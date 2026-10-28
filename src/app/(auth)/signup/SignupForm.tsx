"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthFormState } from "@/app/(auth)/actions";
import { buttonClass, inputClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(signup, {});

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />
      <div className="space-y-1">
        <label htmlFor="nickname" className="text-sm font-medium">닉네임</label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          minLength={2}
          maxLength={20}
          autoComplete="nickname"
          required
          className={inputClass}
        />
        <p className="text-xs text-neutral-500">2~20자. 다른 회원에게 보이는 이름입니다.</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="login_id" className="text-sm font-medium">아이디</label>
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
          className={inputClass}
        />
        <p className="text-xs text-neutral-500">영문, 숫자, 밑줄(_) 4~20자. 로그인할 때 사용합니다.</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
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
        <label htmlFor="password_confirm" className="text-sm font-medium">비밀번호 확인</label>
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
      <p className="text-xs text-neutral-500">
        이메일은 수집하지 않습니다. 비밀번호를 잊으면 운영진이 초기화해 드립니다.
      </p>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "가입 중..." : "가입하기"}
      </button>
      <p className="text-center text-sm text-neutral-500">
        이미 회원이신가요?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline dark:text-neutral-100">
          로그인
        </Link>
      </p>
    </form>
  );
}
