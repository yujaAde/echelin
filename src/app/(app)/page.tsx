import { Suspense } from "react";
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
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">{profile.nickname}님, 반갑습니다</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        다음 모임 날짜 투표, 후기, 맛집 지도 기능이 순서대로 추가될 예정입니다.
      </p>
    </section>
  );
}
