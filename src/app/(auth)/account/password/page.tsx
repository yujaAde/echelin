import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { requireLogin } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "비밀번호 변경 | E슐랭" };

export default function PasswordPage() {
  return (
    <AuthCard title="비밀번호 변경">
      <Suspense fallback={<p className="text-center text-sm text-ink-soft">불러오는 중...</p>}>
        <PasswordBody />
      </Suspense>
    </AuthCard>
  );
}

async function PasswordBody() {
  const { profile } = await requireLogin();
  const backHref = profile?.approved ? "/" : "/pending";

  return (
    <div className="space-y-4">
      <PasswordForm />
      <p className="text-center text-sm">
        <Link href={backHref} className="text-ink-soft hover:text-ink">
          돌아가기
        </Link>
      </p>
    </div>
  );
}
