import { Suspense } from "react";
import { PostForm } from "@/components/posts/PostForm";
import { requireApproved } from "@/lib/auth";
import { BOARDS, type Board } from "@/lib/boards";
import { monthOf, todayKST } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

// 후기·자유게시판 공용 글쓰기 화면
export function NewPostPage({ board }: { board: Board }) {
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{BOARDS[board].writeLabel}</h1>
      <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
        <NewPostBody board={board} />
      </Suspense>
    </section>
  );
}

async function NewPostBody({ board }: { board: Board }) {
  const { user } = await requireApproved();

  let restaurants: { id: string; name: string }[] = [];
  if (board === "review") {
    const supabase = await createClient();
    const { data } = await supabase.from("restaurants").select("id, name").order("name");
    restaurants = data ?? [];
  }

  return (
    <PostForm
      board={board}
      userId={user.id}
      defaultMonth={monthOf(todayKST())}
      restaurants={restaurants}
    />
  );
}
