"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePost, type PostFormState } from "@/app/(app)/posts/actions";
import { FormMessage } from "@/components/FormMessage";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";
import { postPath } from "@/lib/boards";
import type { Post } from "@/types/database";

export function EditPostForm({
  post,
  restaurants,
}: {
  post: Post;
  restaurants: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(updatePost, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={post.id} />
      <FormMessage error={state.error} />

      <div className="space-y-1.5">
        <label htmlFor="title" className={labelClass}>제목</label>
        <input id="title" name="title" type="text" maxLength={100} required defaultValue={post.title} className={inputClass} />
      </div>

      {post.board === "review" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="meeting_month" className={labelClass}>모임 월</label>
            <input id="meeting_month" name="meeting_month" type="month" required defaultValue={post.meeting_month ?? ""} className={inputClass} />
          </div>
          {restaurants.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="restaurant_id" className={labelClass}>다녀온 맛집</label>
              <select id="restaurant_id" name="restaurant_id" defaultValue={post.restaurant_id ?? ""} className={inputClass}>
                <option value="">고르지 않음</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="body" className={labelClass}>내용</label>
        <textarea id="body" name="body" rows={8} maxLength={5000} defaultValue={post.body} className={inputClass} />
      </div>

      <p className="text-xs text-ink-faint">사진은 여기서 바꿀 수 없습니다. 바꾸려면 글을 지우고 다시 올려 주세요.</p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Link href={postPath(post.board, post.id)} className={btnSecondary}>
          취소
        </Link>
        <button type="submit" disabled={pending} className={`${btnPrimary} sm:min-w-32`}>
          {pending ? "저장 중..." : "수정 저장"}
        </button>
      </div>
    </form>
  );
}
