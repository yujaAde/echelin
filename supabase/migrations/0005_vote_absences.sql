-- =============================================================================
-- 0005_vote_absences.sql
-- 참석일 투표에 "불참" 선택지 추가
--
-- Supabase SQL Editor 에 그대로 붙여넣어 실행한다. (0001~0004 가 먼저 적용되어 있어야 함)
-- 설계 요약
--   * "아직 투표 안 함"과 "이번 달은 불참"을 구분하기 위해 월 단위 불참 표시를 따로 둔다.
--   * 한 회원은 한 달에 불참 표시 하나만 가질 수 있고, 불참을 고르면 그 달의 날짜 투표는
--     서버 액션이 모두 지운다 (둘이 동시에 존재하지 않도록 애플리케이션에서 보장).
--   * 권한은 votes 와 동일: 승인 회원 전체 읽기, 본인 명의로만 추가, 본인 것만 삭제.
-- =============================================================================

create table public.vote_absences (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  month       text not null,
  created_at  timestamptz not null default now(),

  primary key (user_id, month),
  constraint vote_absences_month_format_check
    check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

comment on table public.vote_absences is '월별 불참 표시. 해당 월에 참석 가능한 날이 없다고 명시적으로 답한 회원.';

create index vote_absences_month_idx on public.vote_absences (month);

alter table public.vote_absences enable row level security;
revoke all on table public.vote_absences from anon;
revoke all on table public.vote_absences from authenticated;
grant select, insert, delete on table public.vote_absences to authenticated;

create policy "vote_absences_select_approved"
  on public.vote_absences for select to authenticated
  using (public.is_approved());

create policy "vote_absences_insert_own"
  on public.vote_absences for insert to authenticated
  with check (public.is_approved() and user_id = auth.uid());

create policy "vote_absences_delete_own"
  on public.vote_absences for delete to authenticated
  using (user_id = auth.uid());
