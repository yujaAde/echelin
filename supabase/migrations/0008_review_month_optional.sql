-- =============================================================================
-- 0008_review_month_optional.sql
-- "모임 후기"를 "맛집 후기"로 넓힌다
--
-- Supabase SQL Editor 에 그대로 붙여넣어 실행한다. (0001~0007 이 먼저 적용되어 있어야 함)
-- 설계 요약
--   * 후기('review')는 모임에서 다녀온 글(meeting_month 있음)과 모임과 무관한 개인 맛집 후기
--     (meeting_month null) 를 모두 담는다. 그래서 "후기는 모임 월 필수" 제약을 뺀다.
--   * 자유글('free')은 여전히 meeting_month 가 null 이다 (앱에서 보장).
-- =============================================================================

alter table public.posts
  drop constraint if exists posts_review_month_required_check;
