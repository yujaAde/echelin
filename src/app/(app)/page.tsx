import { Suspense } from "react";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const { profile } = await requireApproved();
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{profile.nickname}님, 반갑습니다</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          후기와 맛집 지도 기능이 순서대로 추가될 예정입니다.
        </p>
      </div>
      <Link
        href="/votes"
        className="block rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
      >
        <p className="font-medium">다음 모임 참석 가능일 투표</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          참석할 수 있는 날짜를 고르고 집계를 확인하세요.
        </p>
      </Link>
    </section>
  );
}
