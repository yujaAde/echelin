"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthFormState } from "@/app/(auth)/actions";
import { buttonClass, inputClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(login, {
    error: initialError,
  });

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-center text-sm text-neutral-500">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-medium text-neutral-900 underline dark:text-neutral-100">
          회원가입
        </Link>
      </p>
    </form>
  );
}
