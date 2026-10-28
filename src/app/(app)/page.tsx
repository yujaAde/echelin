import { Suspense } from "react";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";

const cardClass =
  "block rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900";

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
          맛집 지도 기능이 곧 추가될 예정입니다.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/votes" className={cardClass}>
          <p className="font-medium">다음 모임 참석 가능일 투표</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            참석할 수 있는 날짜를 고르고 집계를 확인하세요.
          </p>
        </Link>
        <Link href="/posts" className={cardClass}>
          <p className="font-medium">모임 후기</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            다녀온 모임의 사진과 이야기를 남기고 댓글을 달아 보세요.
          </p>
        </Link>
      </div>
    </section>
  );
}
