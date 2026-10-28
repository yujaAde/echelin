import { Suspense } from "react";
import { requireApproved } from "@/lib/auth";
import { monthOf, todayKST } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "./PostForm";

export const metadata = { title: "후기 쓰기 | E슐랭" };

export default function NewPostPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">후기 쓰기</h1>
      <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
        <NewPostBody />
      </Suspense>
    </section>
  );
}

async function NewPostBody() {
  const { user } = await requireApproved();
  const supabase = await createClient();
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name")
    .order("name");

  return (
    <PostForm
      userId={user.id}
      defaultMonth={monthOf(todayKST())}
      restaurants={restaurants ?? []}
    />
  );
}
