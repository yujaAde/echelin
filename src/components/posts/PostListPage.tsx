import { Suspense } from "react";
import Link from "next/link";
import { btnPrimary, listBox, pageTitle } from "@/components/ui";
import { requireApproved } from "@/lib/auth";
import { BOARDS, isReviewView, postPath, type Board, type ReviewView } from "@/lib/boards";
import { formatMonth } from "@/lib/calendar";
import { displayName, formatDateTime, nicknameMap, signedUrlMap } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// 후기·자유게시판 공용 목록 화면. 라우트 파일이 board 만 지정해 호출한다.
// 후기는 "전체 / 모임 후기만" 보기를 고를 수 있다 (?view=meeting).
// searchParams 는 Suspense 안에서 읽어야 정적 껍데기를 미리 만들 수 있다.
export function PostListPage({ board, searchParams }: { board: Board; searchParams?: SearchParams }) {
  const cfg = BOARDS[board];
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h1 className={pageTitle}>{cfg.title}</h1>
        <Link href={`${cfg.path}/new`} className={btnPrimary}>
          {cfg.writeLabel}
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-ink-soft">불러오는 중...</p>}>
        <PostListBody board={board} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function PostListBody({ board, searchParams }: { board: Board; searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const view: ReviewView = board === "review" && isReviewView(params.view) ? params.view : "all";
  return (
    <div className="space-y-5">
      {board === "review" && <ReviewViewTabs view={view} />}
      <PostList board={board} view={view} />
    </div>
  );
}

function ReviewViewTabs({ view }: { view: ReviewView }) {
  const tabs: { key: ReviewView; label: string; href: string }[] = [
    { key: "all", label: "전체", href: "/posts" },
    { key: "meeting", label: "모임 후기만", href: "/posts?view=meeting" },
  ];
  return (
    <nav aria-label="후기 보기" className="flex gap-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === view ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            t.key === view ? "bg-accent text-on-accent" : "bg-surface-muted text-ink-soft hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

async function PostList({ board, view }: { board: Board; view: ReviewView }) {
  await requireApproved();
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, author_id, title, meeting_month, restaurant_id, created_at")
    .eq("board", board);
  if (board === "review" && view === "meeting") {
    query = query.not("meeting_month", "is", null);
  }
  const { data: posts, error } = await query.order("created_at", { ascending: false }).limit(50);
  if (error) {
    return <p className="text-sm text-danger">글을 불러오지 못했습니다. ({error.message})</p>;
  }
  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line px-4 py-10 text-center">
        <p className="text-sm text-ink-soft">
          {view === "meeting" ? "아직 모임 후기가 없습니다." : BOARDS[board].emptyText}
        </p>
      </div>
    );
  }

  const postIds = posts.map((p) => p.id);
  const restaurantIds = [...new Set(posts.map((p) => p.restaurant_id).filter((id): id is string => !!id))];
  const [names, imageRes, commentRes, restaurantRes] = await Promise.all([
    nicknameMap(supabase, posts.map((p) => p.author_id)),
    supabase
      .from("post_images")
      .select("post_id, storage_path, sort_order")
      .in("post_id", postIds)
      .order("sort_order"),
    supabase.from("comments").select("post_id").in("post_id", postIds),
    restaurantIds.length > 0
      ? supabase.from("restaurants").select("id, name").in("id", restaurantIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const restaurantName = new Map((restaurantRes.data ?? []).map((r) => [r.id, r.name]));

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
    <ul className={listBox}>
      {posts.map((p) => {
        const thumb = thumbPath.get(p.id);
        const url = thumb ? urls.get(thumb) : undefined;
        const images = imageCount.get(p.id) ?? 0;
        const comments = commentCount.get(p.id) ?? 0;
        const place = p.restaurant_id ? restaurantName.get(p.restaurant_id) : undefined;
        return (
          <li key={p.id}>
            <Link
              href={postPath(board, p.id)}
              className="flex items-center gap-4 px-4 py-3 hover:bg-surface-muted"
            >
              {(board === "review" || url) && (
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  {url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                {board === "review" && (
                  <p className="flex flex-wrap gap-1.5 text-xs">
                    {p.meeting_month && (
                      <span className="rounded-md bg-brand-soft px-1.5 py-0.5 font-medium text-brand">
                        {formatMonth(p.meeting_month)} 모임
                      </span>
                    )}
                    {place && (
                      <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-ink-soft">{place}</span>
                    )}
                  </p>
                )}
                <p className="truncate font-semibold text-ink">{p.title}</p>
                <p className="flex flex-wrap gap-x-3 text-xs text-ink-faint">
                  <span className="text-ink-soft">{displayName(names, p.author_id)}</span>
                  <span>{formatDateTime(p.created_at)}</span>
                  {images > 0 && <span>사진 {images}</span>}
                  {comments > 0 && <span>댓글 {comments}</span>}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
