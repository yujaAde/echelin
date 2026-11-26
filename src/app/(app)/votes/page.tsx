import { Suspense } from "react";
import Link from "next/link";
import { btnSmall, listBox, pageTitle, sectionTitle } from "@/components/ui";
import { requireApproved } from "@/lib/auth";
import { addMonths, formatDateKo, formatMonth, isMonthString, monthOf, todayKST } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { loadVoteSummary } from "@/lib/votes";
import { ShareButton } from "./ShareButton";
import { VoteForm } from "./VoteForm";

export const metadata = { title: "참석일 투표 | E슐랭" };

export default function VotesPage(props: PageProps<"/votes">) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">불러오는 중...</p>}>
      <VotesBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function VotesBody({
  searchParams,
}: {
  searchParams: PageProps<"/votes">["searchParams"];
}) {
  const { user } = await requireApproved();
  const { month: rawMonth } = await searchParams;

  const today = todayKST();
  const currentMonth = monthOf(today);
  // 기본은 다음 달 (모임은 보통 다음 달 일정을 정한다)
  const month = isMonthString(rawMonth) ? rawMonth : addMonths(currentMonth, 1);
  const closed = month < currentMonth;

  const supabase = await createClient();
  const summary = await loadVoteSummary(supabase, month, user.id);
  if ("error" in summary) {
    return <p className="text-sm text-danger">데이터를 불러오지 못했습니다. ({summary.error})</p>;
  }
  const { candidates, tally, topCount, members, participantCount, absentees, notVoted, mySelected, myAbsent } =
    summary.data;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink-soft">참석 가능일 투표</p>
            <h1 className={pageTitle}>{formatMonth(month)}</h1>
          </div>
          <div className="flex gap-1.5">
            <Link href={`/votes?month=${addMonths(month, -1)}`} className={btnSmall}>
              이전 달
            </Link>
            <Link href={`/votes?month=${addMonths(month, 1)}`} className={btnSmall}>
              다음 달
            </Link>
          </div>
        </div>
        <p className="text-sm text-ink-soft">
          갈 수 있는 날을 모두 고르세요. 토요일, 일요일, 공휴일만 후보에 오릅니다.
        </p>
        {!closed && <ShareButton month={month} monthLabel={formatMonth(month)} />}
        <VoteForm
          month={month}
          candidates={candidates}
          initialSelected={mySelected}
          initialAbsent={myAbsent}
          closed={closed}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={sectionTitle}>집계</h2>
          <span className="text-sm text-ink-soft">
            {participantCount}명 답함 / 승인 회원 {members.length}명
          </span>
        </div>
        {tally.length === 0 ? (
          <p className="text-sm text-ink-soft">이 달에는 후보일이 없습니다.</p>
        ) : (
          <ol className={listBox}>
            {tally.map((t) => {
              const isTop = topCount > 0 && t.voters.length === topCount;
              const ratio = members.length > 0 ? t.voters.length / members.length : 0;
              return (
                <li key={t.date} className="relative overflow-hidden px-4 py-3 text-sm">
                  {/* 참석 비율만큼 뒤에 깔리는 띠 */}
                  <span
                    aria-hidden
                    className={`absolute inset-y-0 left-0 ${isTop ? "bg-accent-soft" : "bg-surface-muted"}`}
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                  <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex w-44 shrink-0 items-center gap-2">
                      <span className="font-semibold text-ink">{formatDateKo(t.date)}</span>
                      {t.holidayName && <span className="text-xs text-danger">{t.holidayName}</span>}
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`inline-block min-w-9 rounded-md px-2 py-0.5 text-center text-xs font-bold ${
                          isTop ? "bg-accent text-on-accent" : "bg-surface-muted text-ink"
                        }`}
                      >
                        {t.voters.length}명
                      </span>
                      <span className="truncate text-ink-soft">
                        {t.voters.length > 0 ? t.voters.join(", ") : "아직 없음"}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {absentees.length > 0 && (
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-danger">불참</span>{" "}
            {absentees.map((m) => m.nickname).join(", ")}
          </p>
        )}
        {notVoted.length > 0 && (
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">아직 답하지 않음</span>{" "}
            {notVoted.map((m) => m.nickname).join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}
