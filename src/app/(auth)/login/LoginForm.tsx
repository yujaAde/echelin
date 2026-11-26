"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthFormState } from "@/app/(auth)/actions";
import { buttonClass, inputClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";
import { labelClass } from "@/components/ui";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(login, {
    error: initialError,
  });

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />
      <div className="space-y-1.5">
        <label htmlFor="login_id" className={labelClass}>아이디</label>
        <input
          id="login_id"
          name="login_id"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.values?.login_id ?? ""}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className={labelClass}>비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        아직 회원이 아니라면{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          가입하기
        </Link>
      </p>
      <p className="text-center text-xs text-ink-faint">
        비밀번호를 잊었다면 운영진에게 초기화를 요청하세요.
      </p>
    </form>
  );
}
