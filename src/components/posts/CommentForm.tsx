"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment, type CommentFormState } from "@/app/(app)/posts/actions";
import { FormMessage } from "@/components/FormMessage";
import { btnPrimary, inputClass } from "@/components/ui";

export function CommentForm({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState<CommentFormState, FormData>(addComment, {});
  const formRef = useRef<HTMLFormElement>(null);

  // 저장에 성공하면 입력칸을 비운다
  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="post_id" value={postId} />
      <FormMessage error={state.error} />
      <textarea
        name="body"
        rows={3}
        maxLength={1000}
        required
        placeholder="댓글을 남겨 보세요"
        aria-label="댓글"
        className={inputClass}
      />
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "등록 중..." : "댓글 달기"}
        </button>
      </div>
    </form>
  );
}
