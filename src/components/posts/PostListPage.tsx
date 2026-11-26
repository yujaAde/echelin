import { Suspense } from "react";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { BOARDS, postPath, type Board } from "@/lib/boards";
import { formatMonth } from "@/lib/calendar";
import { displayName, formatDateTime, nicknameMap, signedUrlMap } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

// 후기·자유게시판 공용 목록 화면. 라우트 파일이 board 만 지정해 호출한다.
export function PostListPage({ board }: { board: Board }) {
  const cfg = BOARDS[board];
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{cfg.title}</h1>
        <Link
          href={`${cfg.path}/new`}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {cfg.writeLabel}
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
        <PostList board={board} />
      </Suspense>
    </section>
  );
}

async function PostList({ board }: { board: Board }) {
  await requireApproved();
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, author_id, title, meeting_month, created_at")
    .eq("board", board)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return <p className="text-sm text-red-700">글을 불러오지 못했습니다. ({error.message})</p>;
  }
  if (!posts || posts.length === 0) {
    return <p className="text-sm text-neutral-500">{BOARDS[board].emptyText}</p>;
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
        const images = imageCount.get(p.id) ?? 0;
        const meta = [
          board === "review" && p.meeting_month ? `${formatMonth(p.meeting_month)} 모임` : null,
          displayName(names, p.author_id),
          formatDateTime(p.created_at),
        ].filter(Boolean);
        return (
          <li key={p.id}>
            <Link
              href={postPath(board, p.id)}
              className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              {(board === "review" || url) && (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                  {url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-xs text-neutral-500">{meta.join(" · ")}</p>
                <p className="text-xs text-neutral-500">
                  {images > 0 && <>사진 {images} · </>}댓글 {commentCount.get(p.id) ?? 0}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
