import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditPostForm } from "./EditPostForm";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "후기 수정 | E슐랭" };

export default function EditPostPage(props: PageProps<"/posts/[id]/edit">) {
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">후기 수정</h1>
      <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
        <EditPostBody params={props.params} />
      </Suspense>
    </section>
  );
}

async function EditPostBody({ params }: { params: PageProps<"/posts/[id]/edit">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { user } = await requireApproved();
  const supabase = await createClient();

  const [{ data: post }, { data: restaurants }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("restaurants").select("id, name").order("name"),
  ]);
  if (!post) notFound();
  if (post.author_id !== user.id) redirect(`/posts/${id}`);

  return <EditPostForm post={post} restaurants={restaurants ?? []} />;
}
