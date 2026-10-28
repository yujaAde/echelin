import { Suspense } from "react";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import {
  addMonths,
  candidateDates,
  formatDateKo,
  formatMonth,
  isMonthString,
  monthOf,
  todayKST,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { VoteForm } from "./VoteForm";

export const metadata = { title: "참석일 투표 | 맛집탐방 소모임" };

export default function VotesPage(props: PageProps<"/votes">) {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
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
  const [holidayRes, voteRes, memberRes] = await Promise.all([
    supabase
      .from("holidays")
      .select("date, name")
      .gte("date", `${month}-01`)
      .lt("date", `${addMonths(month, 1)}-01`),
    supabase.from("votes").select("user_id, date").eq("month", month),
    supabase
      .from("profiles")
      .select("id, nickname")
      .eq("approved", true)
      .order("nickname"),
  ]);

  const error = holidayRes.error ?? voteRes.error ?? memberRes.error;
  if (error) {
    return (
      <p className="text-sm text-red-700">
        데이터를 불러오지 못했습니다. ({error.message})
      </p>
    );
  }

  const holidays = new Map((holidayRes.data ?? []).map((h) => [h.date, h.name]));
  const candidates = candidateDates(month, holidays);
  const votes = voteRes.data ?? [];
  const members = memberRes.data ?? [];
  const nicknameOf = new Map(members.map((m) => [m.id, m.nickname]));

  const mySelected = votes.filter((v) => v.user_id === user.id).map((v) => v.date);

  const votersByDate = new Map<string, string[]>();
  for (const v of votes) {
    const list = votersByDate.get(v.date) ?? [];
    list.push(nicknameOf.get(v.user_id) ?? "(탈퇴)");
    votersByDate.set(v.date, list);
  }
  const tally = candidates
    .map((c) => ({ ...c, voters: (votersByDate.get(c.date) ?? []).sort() }))
    .sort((a, b) => b.voters.length - a.voters.length || a.date.localeCompare(b.date));
  const topCount = tally[0]?.voters.length ?? 0;

  const votedIds = new Set(votes.map((v) => v.user_id));
  const notVoted = members.filter((m) => !votedIds.has(m.id));

  const navClass =
    "rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">{formatMonth(month)} 참석 가능일</h1>
          <div className="flex gap-2">
            <Link href={`/votes?month=${addMonths(month, -1)}`} className={navClass}>
              이전 달
            </Link>
            <Link href={`/votes?month=${addMonths(month, 1)}`} className={navClass}>
              다음 달
            </Link>
          </div>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          참석할 수 있는 날을 모두 골라 저장하세요. 토요일, 일요일, 공휴일만 후보로 나옵니다.
        </p>
        <VoteForm
          month={month}
          candidates={candidates}
          initialSelected={mySelected}
          closed={closed}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          집계{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({votedIds.size}명 참여 / 승인 회원 {members.length}명)
          </span>
        </h2>
        {tally.length === 0 ? (
          <p className="text-sm text-neutral-500">후보일이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {tally.map((t) => {
              const isTop = topCount > 0 && t.voters.length === topCount;
              return (
                <li
                  key={t.date}
                  className={`flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-4 ${
                    isTop ? "bg-amber-50 dark:bg-amber-950/40" : ""
                  }`}
                >
                  <div className="flex w-44 shrink-0 items-center gap-2">
                    <span className="font-medium">{formatDateKo(t.date)}</span>
                    {t.holidayName && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {t.holidayName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block min-w-8 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${
                        isTop ? "bg-amber-500 text-white" : "bg-neutral-200 dark:bg-neutral-800"
                      }`}
                    >
                      {t.voters.length}명
                    </span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {t.voters.length > 0 ? t.voters.join(", ") : "아직 없음"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {notVoted.length > 0 && (
          <p className="text-sm text-neutral-500">
            아직 투표하지 않은 회원: {notVoted.map((m) => m.nickname).join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}
