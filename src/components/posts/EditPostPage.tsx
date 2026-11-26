import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { EditPostForm } from "@/components/posts/EditPostForm";
import { requireApproved } from "@/lib/auth";
import { BOARDS, postPath, type Board } from "@/lib/boards";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = Promise<{ id: string }>;

// 후기·자유게시판 공용 글 수정 화면
export function EditPostPage({ board, params }: { board: Board; params: Params }) {
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{BOARDS[board].editTitle}</h1>
      <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
        <EditPostBody board={board} params={params} />
      </Suspense>
    </section>
  );
}

async function EditPostBody({ board, params }: { board: Board; params: Params }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { user } = await requireApproved();
  const supabase = await createClient();

  const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();
  if (post.board !== board) redirect(`${postPath(post.board, post.id)}/edit`);
  if (post.author_id !== user.id) redirect(postPath(board, id));

  let restaurants: { id: string; name: string }[] = [];
  if (board === "review") {
    const { data } = await supabase.from("restaurants").select("id, name").order("name");
    restaurants = data ?? [];
  }

  return <EditPostForm post={post} restaurants={restaurants} />;
}
