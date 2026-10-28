"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";
import type { Post } from "@/types/database";
import { updatePost, type PostFormState } from "../../actions";

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

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium">제목</label>
        <input id="title" name="title" type="text" maxLength={100} required defaultValue={post.title} className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="meeting_month" className="text-sm font-medium">모임 월</label>
          <input id="meeting_month" name="meeting_month" type="month" required defaultValue={post.meeting_month} className={inputClass} />
        </div>
        {restaurants.length > 0 && (
          <div className="space-y-1">
            <label htmlFor="restaurant_id" className="text-sm font-medium">방문한 맛집 (선택)</label>
            <select id="restaurant_id" name="restaurant_id" defaultValue={post.restaurant_id ?? ""} className={inputClass}>
              <option value="">선택 안 함</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="body" className="text-sm font-medium">내용</label>
        <textarea id="body" name="body" rows={8} maxLength={5000} defaultValue={post.body} className={inputClass} />
      </div>

      <p className="text-xs text-neutral-500">사진은 수정할 수 없습니다. 사진을 바꾸려면 글을 삭제하고 다시 올려 주세요.</p>

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "저장 중..." : "수정 저장"}
        </button>
        <Link
          href={`/posts/${post.id}`}
          className="shrink-0 rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
