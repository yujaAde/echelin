"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePost, type PostFormState } from "@/app/(app)/posts/actions";
import { FormMessage } from "@/components/FormMessage";
import { MeetingFields } from "@/components/posts/MeetingFields";
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
        <MeetingFields
          defaultMonth={post.meeting_month ?? ""}
          defaultIsMeeting={post.meeting_month !== null}
          restaurants={restaurants}
          defaultRestaurantId={post.restaurant_id}
        />
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
