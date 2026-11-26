import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteComment, deletePost } from "@/app/(app)/posts/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CommentForm } from "@/components/posts/CommentForm";
import { btnSmall, btnSmallDanger, sectionTitle } from "@/components/ui";
import { requireApproved } from "@/lib/auth";
import { BOARDS, postPath, type Board } from "@/lib/boards";
import { formatMonth } from "@/lib/calendar";
import { displayName, formatDateTime, nicknameMap, signedUrlMap } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = Promise<{ id: string }>;

// 후기·자유게시판 공용 글 상세 화면
export function PostDetailPage({ board, params }: { board: Board; params: Params }) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">불러오는 중...</p>}>
      <PostDetail board={board} params={params} />
    </Suspense>
  );
}

async function PostDetail({ board, params }: { board: Board; params: Params }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { user, profile } = await requireApproved();
  const supabase = await createClient();

  const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();
  // 다른 게시판 주소로 들어왔으면 글이 속한 게시판 주소로 보낸다
  if (post.board !== board) redirect(postPath(post.board, post.id));

  const [imageRes, commentRes, restaurantRes] = await Promise.all([
    supabase.from("post_images").select("*").eq("post_id", id).order("sort_order"),
    supabase.from("comments").select("*").eq("post_id", id).order("created_at"),
    post.restaurant_id
      ? supabase.from("restaurants").select("id, name").eq("id", post.restaurant_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const images = imageRes.data ?? [];
  const comments = commentRes.data ?? [];
  const restaurant = restaurantRes.data;

  const [names, urls] = await Promise.all([
    nicknameMap(supabase, [post.author_id, ...comments.map((c) => c.author_id)]),
    signedUrlMap(supabase, images.map((i) => i.storage_path)),
  ]);

  const isAdmin = profile.role === "admin";
  const canEditPost = post.author_id === user.id;
  const canDeletePost = canEditPost || isAdmin;
  const cfg = BOARDS[board];

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <Link href={cfg.path} className="text-sm text-ink-soft hover:text-ink">
          ← {cfg.title}
        </Link>
        <div className="space-y-2">
          {board === "review" && post.meeting_month && (
            <span className="inline-block rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
              {formatMonth(post.meeting_month)} 모임
            </span>
          )}
          <h1 className="text-2xl font-semibold leading-snug text-ink">{post.title}</h1>
          <p className="flex flex-wrap gap-x-3 text-sm text-ink-faint">
            <span className="text-ink-soft">{displayName(names, post.author_id)}</span>
            <span>{formatDateTime(post.created_at)}</span>
          </p>
          {board === "review" && restaurant && (
            <p className="text-sm text-ink-soft">
              다녀온 곳{" "}
              <Link href="/restaurants" className="font-medium text-brand hover:underline">
                {restaurant.name}
              </Link>
            </p>
          )}
        </div>
        {canDeletePost && (
          <div className="flex gap-2">
            {canEditPost && (
              <Link href={`${postPath(board, post.id)}/edit`} className={btnSmall}>
                수정
              </Link>
            )}
            <ConfirmButton
              action={deletePost}
              hidden={{ id: post.id }}
              message={cfg.deleteConfirm}
              className={btnSmallDanger}
            >
              삭제
            </ConfirmButton>
          </div>
        )}
      </header>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img) => {
            const url = urls.get(img.storage_path);
            return (
              <a
                key={img.id}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="aspect-square overflow-hidden rounded-lg bg-surface-muted"
              >
                {url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
              </a>
            );
          })}
        </div>
      )}

      {post.body && (
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{post.body}</div>
      )}

      <section className="space-y-4 border-t border-line pt-6">
        <h2 className={sectionTitle}>댓글 {comments.length}</h2>
        {comments.length > 0 && (
          <ul className="space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg bg-surface px-4 py-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex flex-wrap gap-x-2 text-xs text-ink-faint">
                    <span className="font-medium text-ink">{displayName(names, c.author_id)}</span>
                    <span>{formatDateTime(c.created_at)}</span>
                  </span>
                  {(c.author_id === user.id || isAdmin) && (
                    <ConfirmButton
                      action={deleteComment}
                      hidden={{ id: c.id, post_id: post.id }}
                      message="댓글을 삭제할까요?"
                      className="text-xs text-ink-faint hover:text-danger"
                    >
                      삭제
                    </ConfirmButton>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-ink">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
        <CommentForm postId={post.id} />
      </section>
    </article>
  );
}
