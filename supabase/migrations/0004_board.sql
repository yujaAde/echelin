-- =============================================================================
-- 0004_board.sql
-- 자유게시판
--
-- Supabase SQL Editor 에 그대로 붙여넣어 실행한다. (0001~0003 이 먼저 적용되어 있어야 함)
-- 설계 요약
--   * 후기와 자유글은 사진·댓글·권한 규칙이 같으므로 posts 테이블 하나를 공유하고
--     board 열('review' | 'free')로 구분한다. 기존 글은 모두 'review'.
--   * 자유글은 모임 월이 없으므로 meeting_month 를 null 허용으로 바꾸되,
--     후기('review')는 여전히 필수다.
--   * RLS 정책과 Storage 정책은 0003 그대로 적용된다. board 는 작성 후 바꿀 수 없다
--     (update 권한 열 목록에 포함하지 않음).
-- =============================================================================

alter table public.posts
  add column board text not null default 'review';

alter table public.posts
  add constraint posts_board_check
  check (board in ('review', 'free'));

alter table public.posts
  alter column meeting_month drop not null;

alter table public.posts
  drop constraint posts_meeting_month_format_check;

alter table public.posts
  add constraint posts_meeting_month_format_check
  check (meeting_month is null or meeting_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

alter table public.posts
  add constraint posts_review_month_required_check
  check (board <> 'review' or meeting_month is not null);

create index posts_board_created_at_idx on public.posts (board, created_at desc);
