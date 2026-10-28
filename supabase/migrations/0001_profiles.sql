-- =============================================================================
-- 0001_profiles.sql
-- 기능 1: 로그인/회원가입 + 가입 승인
--
-- Supabase SQL Editor 에 그대로 붙여넣어 실행한다.
-- 설계 요약
--   * profiles.id = auth.users.id. 회원가입 시 트리거가 자동으로 행을 만든다.
--   * 신규 회원은 approved = false 로 시작하며 관리자가 승인해야 서비스를 쓸 수 있다.
--   * 일반 회원은 자기 nickname / avatar_url 만 수정 가능. role, approved 는
--     컬럼 권한으로 막고 관리자용 RPC(set_profile_approved)로만 변경한다.
--   * is_approved(), is_admin() 은 security definer 로 만들어 다른 테이블의
--     RLS 정책에서 재귀 없이 재사용한다.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 테이블
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nickname    text not null,
  avatar_url  text,
  role        text not null default 'member',
  approved    boolean not null default false,
  created_at  timestamptz not null default now(),

  constraint profiles_role_check
    check (role in ('admin', 'member')),
  constraint profiles_nickname_length_check
    check (char_length(btrim(nickname)) between 2 and 20)
);

comment on table public.profiles is '회원 프로필. id 는 auth.users.id 와 동일.';
comment on column public.profiles.approved is '관리자 승인 여부. false 면 승인 대기 상태.';

-- 닉네임은 대소문자 구분 없이 중복 금지
create unique index profiles_nickname_unique_idx
  on public.profiles (lower(nickname));

create index profiles_approved_idx
  on public.profiles (approved, created_at);

-- -----------------------------------------------------------------------------
-- 2. 권한 헬퍼 함수 (RLS 정책에서 재사용)
--    security definer + 고정 search_path 로 RLS 재귀와 search_path 조작을 막는다.
-- -----------------------------------------------------------------------------
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select approved from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' and approved
       from public.profiles
      where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_approved() from public, anon;
revoke all on function public.is_admin()    from public, anon;
grant execute on function public.is_approved() to authenticated;
grant execute on function public.is_admin()    to authenticated;

-- -----------------------------------------------------------------------------
-- 3. 회원가입 시 프로필 자동 생성 트리거
--    signUp 시 options.data.nickname 으로 넘긴 값을 사용하고, 없으면 이메일 앞부분.
--    닉네임이 중복이면 뒤에 4자리 난수를 붙여 가입 자체는 막지 않는다.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_nickname text;
  final_nickname text;
begin
  base_nickname := nullif(btrim(new.raw_user_meta_data ->> 'nickname'), '');
  if base_nickname is null then
    base_nickname := split_part(new.email, '@', 1);
  end if;
  base_nickname := left(base_nickname, 20);
  if char_length(base_nickname) < 2 then
    base_nickname := base_nickname || '회원';
  end if;

  final_nickname := base_nickname;
  if exists (select 1 from public.profiles where lower(nickname) = lower(final_nickname)) then
    final_nickname := left(base_nickname, 15) || '_' || lpad((floor(random() * 10000))::int::text, 4, '0');
  end if;

  insert into public.profiles (id, nickname)
  values (new.id, final_nickname);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. 관리자 승인/승인취소 RPC
--    role, approved 컬럼은 클라이언트가 직접 update 할 수 없으므로 이 함수로만 변경.
-- -----------------------------------------------------------------------------
create or replace function public.set_profile_approved(target_id uuid, value boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '관리자만 승인 상태를 변경할 수 있습니다.'
      using errcode = '42501';
  end if;

  if target_id = auth.uid() then
    raise exception '자기 자신의 승인 상태는 변경할 수 없습니다.'
      using errcode = '42501';
  end if;

  update public.profiles
     set approved = value
   where id = target_id;

  if not found then
    raise exception '대상 회원을 찾을 수 없습니다.'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_profile_approved(uuid, boolean) from public, anon;
grant execute on function public.set_profile_approved(uuid, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. 테이블 권한 + RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- 비로그인(anon)은 아무것도 못 한다.
revoke all on table public.profiles from anon;

-- 로그인 회원: select 전체 컬럼 허용(행은 RLS 로 제한),
-- update 는 nickname / avatar_url 두 컬럼만 허용. insert/delete 는 없음(트리거/cascade 로 처리).
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (nickname, avatar_url) on table public.profiles to authenticated;

-- [SELECT] 본인 프로필은 승인 전에도 조회 가능 (승인 대기 화면용)
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- [SELECT] 승인된 회원은 승인된 회원 목록을 볼 수 있다 (작성자 표시 등)
create policy "profiles_select_approved_members"
  on public.profiles
  for select
  to authenticated
  using (public.is_approved() and approved);

-- [SELECT] 관리자는 승인 대기 회원을 포함해 전체 조회 (관리자 승인 페이지용)
create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- [UPDATE] 본인 프로필만 수정 (컬럼은 grant 로 nickname, avatar_url 로 제한됨)
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- 6. 최초 관리자 지정 (수동)
--    가입 후 아래 쿼리의 이메일을 본인 것으로 바꿔 SQL Editor 에서 한 번 실행한다.
-- -----------------------------------------------------------------------------
-- update public.profiles p
--    set role = 'admin', approved = true
--   from auth.users u
--  where u.id = p.id
--    and u.email = 'me@example.com';
