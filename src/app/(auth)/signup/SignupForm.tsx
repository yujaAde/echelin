"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthFormState } from "@/app/(auth)/actions";
import { buttonClass, inputClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";
import { labelClass } from "@/components/ui";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(signup, {});

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />
      <div className="space-y-1.5">
        <label htmlFor="nickname" className={labelClass}>닉네임</label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          minLength={2}
          maxLength={20}
          autoComplete="nickname"
          required
          defaultValue={state.values?.nickname ?? ""}
          className={inputClass}
        />
        <p className="text-xs text-ink-faint">2~20자. 다른 회원에게 보이는 이름입니다.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="login_id" className={labelClass}>아이디</label>
        <input
          id="login_id"
          name="login_id"
          type="text"
          minLength={4}
          maxLength={20}
          pattern="[A-Za-z0-9_]{4,20}"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.values?.login_id ?? ""}
          className={inputClass}
        />
        <p className="text-xs text-ink-faint">영문, 숫자, 밑줄(_) 4~20자. 로그인할 때 씁니다.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className={labelClass}>비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={6}
          autoComplete="new-password"
          required
          className={inputClass}
        />
        <p className="text-xs text-ink-faint">6자 이상</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password_confirm" className={labelClass}>비밀번호 확인</label>
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
      <p className="text-xs text-ink-faint">
        이메일은 받지 않습니다. 비밀번호를 잊으면 운영진이 초기화해 줍니다.
      </p>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "가입 중..." : "가입 신청"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        이미 회원이라면{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
