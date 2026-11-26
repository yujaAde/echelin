-- =============================================================================
-- 0007_place_votes.sql
-- 월별 모임 진행 단계: 날짜 투표 → 맛집 추천 → 맛집 투표
--
-- Supabase SQL Editor 에 그대로 붙여넣어 실행한다. (0001~0006 이 먼저 적용되어 있어야 함)
-- 설계 요약
--   * vote_rounds: 월별 진행 설정. 날짜 투표 마감 시각, 실제 마감된 시각, 맛집 투표 시작 시각.
--     행이 없거나 값이 null 이면 앱이 기본값을 쓴다 (마감 = 전달 말일 23:59 KST,
--     맛집 투표 시작 = 날짜 마감 + nomination_days 일).
--   * 승인 회원 전원이 날짜 투표(또는 불참)에 답하면 close_date_vote_if_complete() 가
--     date_closed_at 을 기록해 바로 마감한다. 관리자는 수동 마감·재개·시작 시각 조정 가능.
--   * place_nominations: 그 달의 맛집 후보. "저장한 맛집"(restaurants)에 있는 곳만 올릴 수 있다.
--   * place_votes: 맛집 투표. 한 사람이 한 달에 최대 3곳 (트리거로도 보장).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 월별 진행 설정
-- -----------------------------------------------------------------------------
create table public.vote_rounds (
  month                text primary key,
  date_deadline        timestamptz,            -- null: 앱 기본값
  date_closed_at       timestamptz,            -- 전원 응답 또는 관리자 마감 시각
  place_vote_opens_at  timestamptz,            -- null: 마감 시각 + nomination_days
  nomination_days      integer not null default 3,
  updated_at           timestamptz not null default now(),

  constraint vote_rounds_month_format_check
    check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint vote_rounds_nomination_days_check
    check (nomination_days between 0 and 30)
);

alter table public.vote_rounds enable row level security;
revoke all on table public.vote_rounds from anon;
revoke all on table public.vote_rounds from authenticated;
grant select, insert, update, delete on table public.vote_rounds to authenticated;

create policy "vote_rounds_select_approved"
  on public.vote_rounds for select to authenticated
  using (public.is_approved());

create policy "vote_rounds_insert_admin"
  on public.vote_rounds for insert to authenticated
  with check (public.is_admin());

create policy "vote_rounds_update_admin"
  on public.vote_rounds for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "vote_rounds_delete_admin"
  on public.vote_rounds for delete to authenticated
  using (public.is_admin());

-- 승인 회원 전원이 답했으면 날짜 투표를 마감한다. 일반 회원이 투표 저장 직후 호출하므로
-- security definer 로 vote_rounds 에 쓴다. 이미 마감돼 있으면 시각을 바꾸지 않는다.
create or replace function public.close_date_vote_if_complete(target_month text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  member_count    integer;
  responder_count integer;
begin
  if not public.is_approved() then
    raise exception 'not allowed';
  end if;
  if target_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'invalid month';
  end if;

  select count(*) into member_count from public.profiles where approved;

  select count(distinct r.user_id) into responder_count
  from (
    select user_id from public.votes where month = target_month
    union
    select user_id from public.vote_absences where month = target_month
  ) r
  join public.profiles p on p.id = r.user_id and p.approved;

  if member_count = 0 or responder_count < member_count then
    return false;
  end if;

  insert into public.vote_rounds (month, date_closed_at)
  values (target_month, now())
  on conflict (month) do update
    set date_closed_at = coalesce(public.vote_rounds.date_closed_at, now()),
        updated_at = now();
  return true;
end;
$$;

revoke all on function public.close_date_vote_if_complete(text) from public, anon;
grant execute on function public.close_date_vote_if_complete(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. 맛집 후보 (추천)
-- -----------------------------------------------------------------------------
create table public.place_nominations (
  id             uuid primary key default gen_random_uuid(),
  month          text not null,
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  nominated_by   uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),

  constraint place_nominations_month_format_check
    check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint place_nominations_month_restaurant_unique unique (month, restaurant_id)
);

create index place_nominations_month_idx on public.place_nominations (month, created_at);

alter table public.place_nominations enable row level security;
revoke all on table public.place_nominations from anon;
revoke all on table public.place_nominations from authenticated;
grant select, insert, delete on table public.place_nominations to authenticated;

create policy "place_nominations_select_approved"
  on public.place_nominations for select to authenticated
  using (public.is_approved());

create policy "place_nominations_insert_own"
  on public.place_nominations for insert to authenticated
  with check (public.is_approved() and nominated_by = auth.uid());

create policy "place_nominations_delete_own_or_admin"
  on public.place_nominations for delete to authenticated
  using (nominated_by = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. 맛집 투표
-- -----------------------------------------------------------------------------
create table public.place_votes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  month          text not null,
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  created_at     timestamptz not null default now(),

  constraint place_votes_month_format_check
    check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint place_votes_user_month_restaurant_unique unique (user_id, month, restaurant_id)
);

create index place_votes_month_idx on public.place_votes (month, restaurant_id);
create index place_votes_user_month_idx on public.place_votes (user_id, month);

alter table public.place_votes enable row level security;
revoke all on table public.place_votes from anon;
revoke all on table public.place_votes from authenticated;
grant select, insert, delete on table public.place_votes to authenticated;

create policy "place_votes_select_approved"
  on public.place_votes for select to authenticated
  using (public.is_approved());

create policy "place_votes_insert_own"
  on public.place_votes for insert to authenticated
  with check (public.is_approved() and user_id = auth.uid());

-- 관리자는 후보를 뺄 때 그 후보에 모인 표도 함께 지운다
create policy "place_votes_delete_own_or_admin"
  on public.place_votes for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- 한 사람이 한 달에 최대 3곳
create or replace function public.place_votes_enforce_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.place_votes
      where user_id = new.user_id and month = new.month) >= 3 then
    raise exception 'place vote limit exceeded (max 3 per month)';
  end if;
  return new;
end;
$$;

create trigger place_votes_limit_trg
  before insert on public.place_votes
  for each row execute function public.place_votes_enforce_limit();
