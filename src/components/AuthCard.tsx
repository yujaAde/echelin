import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { btnPrimary, inputClass as input } from "@/components/ui";

// 로그인·가입·승인 대기·비밀번호 변경이 함께 쓰는 틀. 마스코트와 이름이 머리말이 된다.
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="mb-6 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={64}
          height={64}
          className="size-16 rounded-full border-2 border-accent"
        />
        <span className="font-display text-3xl leading-none text-ink">E슐랭</span>
      </Link>
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 sm:p-8">
        <h1 className="mb-5 text-xl font-semibold text-ink">{title}</h1>
        {children}
      </div>
    </main>
  );
}

// 예전 이름을 쓰는 폼들을 위해 그대로 내보낸다
export const inputClass = input;
export const buttonClass = `${btnPrimary} w-full`;
