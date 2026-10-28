import { Suspense } from "react";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { formatMonth } from "@/lib/calendar";
import { displayName, formatDateTime, nicknameMap, signedUrlMap } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "모임 후기 | 맛집탐방 소모임" };

export default function PostsPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">모임 후기</h1>
        <Link
          href="/posts/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          후기 쓰기
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
        <PostList />
      </Suspense>
    </section>
  );
}

async function PostList() {
  await requireApproved();
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, author_id, title, meeting_month, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return <p className="text-sm text-red-700">후기를 불러오지 못했습니다. ({error.message})</p>;
  }
  if (!posts || posts.length === 0) {
    return <p className="text-sm text-neutral-500">아직 후기가 없습니다. 첫 후기를 남겨 보세요.</p>;
  }

  const postIds = posts.map((p) => p.id);
  const [names, imageRes, commentRes] = await Promise.all([
    nicknameMap(supabase, posts.map((p) => p.author_id)),
    supabase
      .from("post_images")
      .select("post_id, storage_path, sort_order")
      .in("post_id", postIds)
      .order("sort_order"),
    supabase.from("comments").select("post_id").in("post_id", postIds),
  ]);

  const thumbPath = new Map<string, string>();
  const imageCount = new Map<string, number>();
  for (const img of imageRes.data ?? []) {
    if (!thumbPath.has(img.post_id)) thumbPath.set(img.post_id, img.storage_path);
    imageCount.set(img.post_id, (imageCount.get(img.post_id) ?? 0) + 1);
  }
  const commentCount = new Map<string, number>();
  for (const c of commentRes.data ?? []) {
    commentCount.set(c.post_id, (commentCount.get(c.post_id) ?? 0) + 1);
  }
  const urls = await signedUrlMap(supabase, [...thumbPath.values()]);

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {posts.map((p) => {
        const thumb = thumbPath.get(p.id);
        const url = thumb ? urls.get(thumb) : undefined;
        return (
          <li key={p.id}>
            <Link
              href={`/posts/${p.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                {url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-xs text-neutral-500">
                  {formatMonth(p.meeting_month)} 모임 · {displayName(names, p.author_id)} ·{" "}
                  {formatDateTime(p.created_at)}
                </p>
                <p className="text-xs text-neutral-500">
                  사진 {imageCount.get(p.id) ?? 0} · 댓글 {commentCount.get(p.id) ?? 0}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
