-- =============================================================================
-- 0003_posts.sql
-- 기능 3: 모임 후기 (사진 여러 장 + 댓글)
--
-- Supabase SQL Editor 에 그대로 붙여넣어 실행한다. (0001, 0002 가 먼저 적용되어 있어야 함)
-- 설계 요약
--   * restaurants: posts.restaurant_id 가 참조하므로 테이블과 RLS 를 여기서 먼저 만든다.
--     화면(카카오 검색/지도)은 기능 4 에서 붙인다.
--   * posts / post_images / comments: 승인 회원 전체 읽기, 작성자 본인(또는 관리자)만 수정/삭제.
--   * Storage 버킷 post-images: private. 경로는 "{user_id}/{uuid}.jpg".
--     승인 회원 읽기, 본인 폴더에만 업로드/삭제.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 맛집 (기능 4 에서 사용, FK 때문에 먼저 생성)
-- -----------------------------------------------------------------------------
create table public.restaurants (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  address         text,
  lat             double precision,
  lng             double precision,
  kakao_place_id  text,
  memo            text,
  created_by      uuid not null references public.profiles (id) on delete cascade,
  created_at      timestamptz not null default now(),

  constraint restaurants_name_length_check
    check (char_length(btrim(name)) between 1 and 100),
  constraint restaurants_kakao_place_id_unique unique (kakao_place_id)
);

alter table public.restaurants enable row level security;
revoke all on table public.restaurants from anon;
revoke all on table public.restaurants from authenticated;
grant select, insert, delete on table public.restaurants to authenticated;
grant update (name, address, lat, lng, kakao_place_id, memo) on table public.restaurants to authenticated;

create policy "restaurants_select_approved"
  on public.restaurants for select to authenticated
  using (public.is_approved());

create policy "restaurants_insert_own"
  on public.restaurants for insert to authenticated
  with check (public.is_approved() and created_by = auth.uid());

create policy "restaurants_update_own_or_admin"
  on public.restaurants for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

create policy "restaurants_delete_own_or_admin"
  on public.restaurants for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. 후기 글
-- -----------------------------------------------------------------------------
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references public.profiles (id) on delete cascade,
  title          text not null,
  body           text not null default '',
  restaurant_id  uuid references public.restaurants (id) on delete set null,
  meeting_month  text not null,
  created_at     timestamptz not null default now(),

  constraint posts_title_length_check
    check (char_length(btrim(title)) between 1 and 100),
  constraint posts_body_length_check
    check (char_length(body) <= 5000),
  constraint posts_meeting_month_format_check
    check (meeting_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_meeting_month_idx on public.posts (meeting_month);
create index posts_restaurant_idx on public.posts (restaurant_id);

alter table public.posts enable row level security;
revoke all on table public.posts from anon;
revoke all on table public.posts from authenticated;
grant select, insert, delete on table public.posts to authenticated;
grant update (title, body, restaurant_id, meeting_month) on table public.posts to authenticated;

create policy "posts_select_approved"
  on public.posts for select to authenticated
  using (public.is_approved());

create policy "posts_insert_own"
  on public.posts for insert to authenticated
  with check (public.is_approved() and author_id = auth.uid());

create policy "posts_update_own_or_admin"
  on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "posts_delete_own_or_admin"
  on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. 후기 사진 (Storage 경로만 저장)
-- -----------------------------------------------------------------------------
create table public.post_images (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts (id) on delete cascade,
  storage_path  text not null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),

  constraint post_images_storage_path_unique unique (storage_path),
  constraint post_images_post_sort_unique unique (post_id, sort_order)
);

create index post_images_post_idx on public.post_images (post_id, sort_order);

alter table public.post_images enable row level security;
revoke all on table public.post_images from anon;
revoke all on table public.post_images from authenticated;
grant select, insert, delete on table public.post_images to authenticated;

create policy "post_images_select_approved"
  on public.post_images for select to authenticated
  using (public.is_approved());

-- 내 글에만, 내 폴더({user_id}/...) 경로만 붙일 수 있다
create policy "post_images_insert_own_post"
  on public.post_images for insert to authenticated
  with check (
    public.is_approved()
    and split_part(storage_path, '/', 1) = auth.uid()::text
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );

create policy "post_images_delete_own_post_or_admin"
  on public.post_images for delete to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 4. 댓글
-- -----------------------------------------------------------------------------
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),

  constraint comments_body_length_check
    check (char_length(btrim(body)) between 1 and 1000)
);

create index comments_post_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;
revoke all on table public.comments from anon;
revoke all on table public.comments from authenticated;
grant select, insert, delete on table public.comments to authenticated;
grant update (body) on table public.comments to authenticated;

create policy "comments_select_approved"
  on public.comments for select to authenticated
  using (public.is_approved());

create policy "comments_insert_own"
  on public.comments for insert to authenticated
  with check (public.is_approved() and author_id = auth.uid());

create policy "comments_update_own"
  on public.comments for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "comments_delete_own_or_admin"
  on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. Storage 버킷 (private) + 객체 정책
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  false,
  5242880, -- 5MB (브라우저에서 리사이즈하므로 보통 수백 KB)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 승인 회원만 읽기 (signed URL 발급에도 이 정책이 적용됨)
create policy "post_images_storage_select_approved"
  on storage.objects for select to authenticated
  using (bucket_id = 'post-images' and public.is_approved());

-- 업로드는 본인 폴더({user_id}/...)에만
create policy "post_images_storage_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and public.is_approved()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 삭제도 본인 폴더만 (관리자가 남의 글을 지울 때는 서버에서 service_role 로 처리)
create policy "post_images_storage_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
