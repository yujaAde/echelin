-- =============================================================================
-- 0002_votes.sql
-- 기능 2: 월별 참석 가능일 투표
--
-- Supabase SQL Editor 에 그대로 붙여넣어 실행한다. (0001 이 먼저 적용되어 있어야 함)
-- 설계 요약
--   * holidays: 투표 후보일 계산에 쓰는 공휴일 목록. 관리자만 편집.
--     2026~2027 공휴일을 미리 넣어 두었으니 관리자 페이지에서 확인/수정할 것.
--   * votes: 회원이 고른 참석 가능일. (user_id, date) 당 한 행.
--     승인 회원은 전체 조회(집계용), 본인 것만 추가/삭제.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 공휴일
-- -----------------------------------------------------------------------------
create table public.holidays (
  date        date primary key,
  name        text not null,
  created_at  timestamptz not null default now(),

  constraint holidays_name_length_check
    check (char_length(btrim(name)) between 1 and 30)
);

comment on table public.holidays is '투표 후보일 계산용 공휴일. 토/일은 자동 포함되므로 평일 공휴일과 대체공휴일만 관리하면 된다.';

alter table public.holidays enable row level security;
revoke all on table public.holidays from anon;
revoke all on table public.holidays from authenticated;
grant select, insert, update, delete on table public.holidays to authenticated;

create policy "holidays_select_approved"
  on public.holidays for select to authenticated
  using (public.is_approved());

create policy "holidays_insert_admin"
  on public.holidays for insert to authenticated
  with check (public.is_admin());

create policy "holidays_update_admin"
  on public.holidays for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "holidays_delete_admin"
  on public.holidays for delete to authenticated
  using (public.is_admin());

-- 초기 데이터: 2026~2027 공휴일 (대체공휴일 포함). 주말과 겹치는 날도 넣어 둔다.
insert into public.holidays (date, name) values
  -- 2026
  ('2026-01-01', '신정'),
  ('2026-02-16', '설날 연휴'),
  ('2026-02-17', '설날'),
  ('2026-02-18', '설날 연휴'),
  ('2026-03-01', '삼일절'),
  ('2026-03-02', '대체공휴일(삼일절)'),
  ('2026-05-05', '어린이날'),
  ('2026-05-24', '부처님오신날'),
  ('2026-05-25', '대체공휴일(부처님오신날)'),
  ('2026-06-03', '지방선거'),
  ('2026-06-06', '현충일'),
  ('2026-08-15', '광복절'),
  ('2026-08-17', '대체공휴일(광복절)'),
  ('2026-09-24', '추석 연휴'),
  ('2026-09-25', '추석'),
  ('2026-09-26', '추석 연휴'),
  ('2026-10-03', '개천절'),
  ('2026-10-05', '대체공휴일(개천절)'),
  ('2026-10-09', '한글날'),
  ('2026-12-25', '성탄절'),
  -- 2027
  ('2027-01-01', '신정'),
  ('2027-02-05', '설날 연휴'),
  ('2027-02-06', '설날'),
  ('2027-02-07', '설날 연휴'),
  ('2027-02-08', '대체공휴일(설날)'),
  ('2027-03-01', '삼일절'),
  ('2027-05-05', '어린이날'),
  ('2027-05-13', '부처님오신날'),
  ('2027-06-06', '현충일'),
  ('2027-08-15', '광복절'),
  ('2027-08-16', '대체공휴일(광복절)'),
  ('2027-09-14', '추석 연휴'),
  ('2027-09-15', '추석'),
  ('2027-09-16', '추석 연휴'),
  ('2027-10-03', '개천절'),
  ('2027-10-04', '대체공휴일(개천절)'),
  ('2027-10-09', '한글날'),
  ('2027-10-11', '대체공휴일(한글날)'),
  ('2027-12-25', '성탄절'),
  ('2027-12-27', '대체공휴일(성탄절)');

-- -----------------------------------------------------------------------------
-- 2. 투표
-- -----------------------------------------------------------------------------
create table public.votes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  month       text not null,
  date        date not null,
  created_at  timestamptz not null default now(),

  constraint votes_user_date_unique unique (user_id, date),
  constraint votes_month_format_check
    check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint votes_month_matches_date_check
    check (to_char(date, 'YYYY-MM') = month)
);

comment on table public.votes is '월별 참석 가능일 투표. 한 회원이 같은 날짜에 두 번 투표할 수 없다.';

create index votes_month_idx on public.votes (month, date);
create index votes_user_month_idx on public.votes (user_id, month);

alter table public.votes enable row level security;
revoke all on table public.votes from anon;
revoke all on table public.votes from authenticated;
grant select, insert, delete on table public.votes to authenticated;

-- [SELECT] 승인 회원은 집계를 위해 전체 투표를 볼 수 있다
create policy "votes_select_approved"
  on public.votes for select to authenticated
  using (public.is_approved());

-- [INSERT] 승인 회원이 본인 명의로만 추가
create policy "votes_insert_own"
  on public.votes for insert to authenticated
  with check (public.is_approved() and user_id = auth.uid());

-- [DELETE] 본인 투표만 삭제 (승인 취소된 회원도 자기 것은 지울 수 있음)
create policy "votes_delete_own"
  on public.votes for delete to authenticated
  using (user_id = auth.uid());
