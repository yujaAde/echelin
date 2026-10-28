"use client";

import { useActionState, useEffect, useRef } from "react";
import { inputClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";
import { addComment, type CommentFormState } from "../actions";

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
        className={inputClass}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {pending ? "등록 중..." : "댓글 등록"}
        </button>
      </div>
    </form>
  );
}
