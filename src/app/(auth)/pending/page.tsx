import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { LogoutButton } from "@/components/LogoutButton";
import { btnSmall } from "@/components/ui";
import { displayLoginId } from "@/lib/account";
import { requireLogin } from "@/lib/auth";
import { RecheckButton } from "./RecheckButton";

export const metadata = { title: "승인 대기 | E슐랭" };

export default function PendingPage() {
  return (
    <AuthCard title="가입 승인을 기다리는 중">
      <Suspense fallback={<p className="text-center text-sm text-ink-soft">불러오는 중...</p>}>
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
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-surface-muted px-4 py-3">
        <dt className="text-ink-soft">닉네임</dt>
        <dd className="font-medium text-ink">{profile?.nickname ?? "(만드는 중)"}</dd>
        <dt className="text-ink-soft">아이디</dt>
        <dd className="font-medium text-ink">{displayLoginId(user.email)}</dd>
      </dl>
      <p className="leading-relaxed text-ink-soft">
        가입 신청이 들어갔습니다. 운영진이 승인하면 바로 쓸 수 있어요. 오래 걸리면 단톡방에서
        운영진에게 알려 주세요.
      </p>
      <RecheckButton />
      <div className="flex justify-center gap-2">
        <Link href="/account/password" className={btnSmall}>
          비밀번호 변경
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
