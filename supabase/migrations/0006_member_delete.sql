-- =============================================================================
-- 0006_member_delete.sql
-- 회원 삭제 시 글·댓글·맛집은 남긴다
--
-- Supabase SQL Editor 에 그대로 붙여넣어 실행한다. (0001~0005 가 먼저 적용되어 있어야 함)
-- 설계 요약
--   * 관리자가 회원 관리 페이지에서 회원을 삭제하면 auth.users → profiles 가 cascade 로 지워진다.
--   * 기존에는 posts / comments / restaurants 도 함께 cascade 로 사라졌다. 모임의 기록이므로
--     남기기 위해 작성자 FK 를 "on delete set null" 로 바꾸고 열을 null 허용으로 만든다.
--     화면에서는 "(탈퇴한 회원)" 으로 표시된다.
--   * votes / vote_absences 는 개인 응답이므로 그대로 cascade 삭제된다.
--   * RLS 는 그대로다. author_id 가 null 인 글은 관리자만 수정·삭제할 수 있다.
-- =============================================================================

-- 후기·자유글
alter table public.posts
  alter column author_id drop not null;
alter table public.posts
  drop constraint posts_author_id_fkey;
alter table public.posts
  add constraint posts_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

-- 댓글
alter table public.comments
  alter column author_id drop not null;
alter table public.comments
  drop constraint comments_author_id_fkey;
alter table public.comments
  add constraint comments_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

-- 맛집
alter table public.restaurants
  alter column created_by drop not null;
alter table public.restaurants
  drop constraint restaurants_created_by_fkey;
alter table public.restaurants
  add constraint restaurants_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;
