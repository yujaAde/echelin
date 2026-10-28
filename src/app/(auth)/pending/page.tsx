import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, buttonClass } from "@/components/AuthCard";
import { LogoutButton } from "@/components/LogoutButton";
import { displayLoginId } from "@/lib/account";
import { requireLogin } from "@/lib/auth";

export const metadata = { title: "승인 대기 | E슐랭" };

export default function PendingPage() {
  return (
    <AuthCard title="가입 승인 대기 중">
      <Suspense fallback={<p className="text-center text-sm text-neutral-500">불러오는 중...</p>}>
        <PendingBody />
      </Suspense>
    </AuthCard>
  );
}

async function PendingBody() {
  const { user, profile } = await requireLogin();
  if (profile?.approved) redirect("/");

  return (
    <div className="space-y-5 text-sm">
      <div className="rounded-md bg-neutral-100 px-4 py-3 dark:bg-neutral-900">
        <p><span className="text-neutral-500">닉네임</span> {profile?.nickname ?? "(생성 중)"}</p>
        <p><span className="text-neutral-500">아이디</span> {displayLoginId(user.email)}</p>
      </div>
      <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
        가입이 접수되었습니다. 관리자가 승인하면 사이트를 이용할 수 있습니다.
        승인이 늦어지면 모임 운영진에게 알려 주세요.
      </p>
      <Link href="/pending" className={`${buttonClass} block text-center`}>
        승인 여부 다시 확인
      </Link>
      <div className="flex justify-center gap-3">
        <Link
          href="/account/password"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          비밀번호 변경
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
