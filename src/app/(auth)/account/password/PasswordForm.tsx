"use client";

import { useActionState } from "react";
import { changePassword, type AuthFormState } from "@/app/(auth)/actions";
import { buttonClass, inputClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">새 비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={6}
          autoComplete="new-password"
          required
          className={inputClass}
        />
        <p className="text-xs text-neutral-500">6자 이상</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="password_confirm" className="text-sm font-medium">새 비밀번호 확인</label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          minLength={6}
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
