"use client";

import { useActionState } from "react";
import { resetPassword, type ResetPasswordState } from "./actions";

const buttonClass =
  "rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800";

export function ResetPasswordButton({ id, nickname }: { id: string; nickname: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(resetPassword, {});

  if (state.tempPassword) {
    return (
      <span className="inline-flex flex-col items-end gap-0.5 text-xs">
        <span className="text-neutral-500">임시 비밀번호</span>
        <code className="rounded bg-amber-100 px-2 py-0.5 font-mono text-sm text-neutral-900 select-all dark:bg-amber-900 dark:text-amber-100">
          {state.tempPassword}
        </code>
        <span className="text-neutral-500">본인에게 전달하고 로그인 후 변경하도록 안내</span>
      </span>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`${nickname} 님의 비밀번호를 초기화할까요? 기존 비밀번호는 더 이상 쓸 수 없습니다.`)) {
          e.preventDefault();
        }
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "초기화 중..." : "비밀번호 초기화"}
      </button>
      {state.error && <span className="ml-2 text-xs text-red-700">{state.error}</span>}
    </form>
  );
}
