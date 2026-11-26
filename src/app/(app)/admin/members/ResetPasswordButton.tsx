"use client";

import { useActionState } from "react";
import { btnSmall } from "@/components/ui";
import { resetPassword, type ResetPasswordState } from "./actions";

export function ResetPasswordButton({ id, nickname }: { id: string; nickname: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(resetPassword, {});

  if (state.tempPassword) {
    return (
      <span className="inline-flex flex-col items-end gap-0.5 text-xs">
        <span className="text-ink-soft">임시 비밀번호</span>
        <code className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-sm text-ink select-all">
          {state.tempPassword}
        </code>
        <span className="text-ink-faint">본인에게 전해 주고, 로그인 뒤 바꾸라고 안내하세요</span>
      </span>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`${nickname} 님의 비밀번호를 초기화할까요? 지금 비밀번호는 더 쓸 수 없게 됩니다.`)) {
          e.preventDefault();
        }
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className={btnSmall}>
        {pending ? "초기화 중..." : "비밀번호 초기화"}
      </button>
      {state.error && <span className="ml-2 text-xs text-danger">{state.error}</span>}
    </form>
  );
}
