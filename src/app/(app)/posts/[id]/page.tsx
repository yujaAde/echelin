import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireApproved } from "@/lib/auth";
import { formatMonth } from "@/lib/calendar";
import { displayName, formatDateTime, nicknameMap, signedUrlMap } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";
import { deleteComment, deletePost } from "../actions";
import { CommentForm } from "./CommentForm";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const smallButton =
  "rounded-md border border-neutral-300 px-2.5 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";

export default function PostDetailPage(props: PageProps<"/posts/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
      <PostDetail params={props.params} />
    </Suspense>
  );
}

async function PostDetail({ params }: { params: PageProps<"/posts/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { user, profile } = await requireApproved();
  const supabase = await createClient();

  const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();

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

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <Link href="/posts" className="text-sm text-neutral-500 hover:underline">
          ← 후기 목록
        </Link>
        <h1 className="text-2xl font-semibold">{post.title}</h1>
        <p className="text-sm text-neutral-500">
          {formatMonth(post.meeting_month)} 모임 · {displayName(names, post.author_id)} ·{" "}
          {formatDateTime(post.created_at)}
        </p>
        {restaurant && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">맛집: {restaurant.name}</p>
        )}
        {canDeletePost && (
          <div className="flex gap-2 pt-1">
            {canEditPost && (
              <Link href={`/posts/${post.id}/edit`} className={smallButton}>
                수정
              </Link>
            )}
            <ConfirmButton
              action={deletePost}
              hidden={{ id: post.id }}
              message="이 후기와 사진, 댓글을 모두 삭제할까요?"
              className={smallButton}
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
                className="aspect-square overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800"
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
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{post.body}</div>
      )}

      <section className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-lg font-medium">댓글 {comments.length}</h2>
        {comments.length > 0 && (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-md bg-neutral-50 px-4 py-3 text-sm dark:bg-neutral-900">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-500">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {displayName(names, c.author_id)}
                    </span>{" "}
                    · {formatDateTime(c.created_at)}
                  </span>
                  {(c.author_id === user.id || isAdmin) && (
                    <ConfirmButton
                      action={deleteComment}
                      hidden={{ id: c.id, post_id: post.id }}
                      message="댓글을 삭제할까요?"
                      className="text-xs text-neutral-500 hover:underline"
                    >
                      삭제
                    </ConfirmButton>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
        <CommentForm postId={post.id} />
      </section>
    </article>
  );
}
