import { Suspense } from "react";
import Link from "next/link";
import { InstallGuide } from "@/components/InstallGuide";
import { btnPrimary, btnSecondary, listBox } from "@/components/ui";
import { requireApproved } from "@/lib/auth";
import { addMonths, formatDateKo, formatMonth, monthOf, todayKST } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { loadVoteSummary, type TallyRow } from "@/lib/votes";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">불러오는 중...</p>}>
      <Home />
    </Suspense>
  );
}

const SECTIONS = [
  { href: "/posts", title: "모임 후기", body: "다녀온 모임의 사진과 이야기" },
  { href: "/board", title: "자유게시판", body: "맛집 추천, 잡담, 뭐든지" },
  { href: "/restaurants", title: "맛집 지도", body: "가 보고 싶은 곳을 모아 둔 지도" },
];

async function Home() {
  const { user, profile } = await requireApproved();
  const supabase = await createClient();

  // 홈의 중심은 다음 모임 날짜 투표 현황이다
  const nextMonth = addMonths(monthOf(todayKST()), 1);
  const summary = await loadVoteSummary(supabase, nextMonth, user.id);

  return (
    <div className="space-y-8">
      <InstallGuide />

      <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
        {"error" in summary ? (
          <p className="text-sm text-danger">투표 현황을 불러오지 못했습니다. ({summary.error})</p>
        ) : (
          <VoteHero
            nickname={profile.nickname}
            month={nextMonth}
            tally={summary.data.tally}
            topCount={summary.data.topCount}
            participantCount={summary.data.participantCount}
            memberCount={summary.data.members.length}
            hasVoted={summary.data.mySelected.length > 0 || summary.data.myAbsent}
            myAbsent={summary.data.myAbsent}
          />
        )}
      </section>

      <nav aria-label="둘러보기">
        <ul className={listBox}>
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-surface-muted"
              >
                <span>
                  <span className="block font-semibold text-ink">{s.title}</span>
                  <span className="block text-sm text-ink-soft">{s.body}</span>
                </span>
                <span aria-hidden className="text-ink-faint">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function VoteHero({
  nickname,
  month,
  tally,
  topCount,
  participantCount,
  memberCount,
  hasVoted,
  myAbsent,
}: {
  nickname: string;
  month: string;
  tally: TallyRow[];
  topCount: number;
  participantCount: number;
  memberCount: number;
  hasVoted: boolean;
  myAbsent: boolean;
}) {
  const leaders = topCount > 0 ? tally.filter((t) => t.voters.length === topCount) : [];
  const top3 = tally.slice(0, 3).filter((t) => t.voters.length > 0);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm text-ink-soft">{nickname}님, {formatMonth(month)} 모임은</p>
        <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
          {participantCount === 0
            ? "아직 아무도 투표하지 않았어요"
            : leaders.length === 1
              ? `${formatDateKo(leaders[0].date)}이 가장 많아요`
              : `${leaders.length}개 날짜가 동률이에요`}
        </h1>
        <p className="text-sm text-ink-soft">
          승인 회원 {memberCount}명 중 {participantCount}명이 답했어요.
        </p>
      </div>

      {top3.length > 0 && (
        <ol className="flex flex-wrap gap-2">
          {top3.map((t) => {
            const isTop = t.voters.length === topCount;
            return (
              <li
                key={t.date}
                className={`flex items-baseline gap-2 rounded-lg px-3 py-2 ${
                  isTop ? "bg-accent text-on-accent" : "bg-surface-muted text-ink"
                }`}
              >
                <span className="text-sm font-semibold">{formatDateKo(t.date)}</span>
                <span className="text-xs">{t.voters.length}명</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/votes?month=${month}`} className={hasVoted ? btnSecondary : btnPrimary}>
          {hasVoted ? "내 투표 바꾸기" : "참석 가능일 고르기"}
        </Link>
        <span className="text-sm text-ink-soft">
          {myAbsent ? "불참으로 답했어요" : hasVoted ? "투표 완료" : "아직 투표하지 않았어요"}
        </span>
      </div>
    </div>
  );
}
