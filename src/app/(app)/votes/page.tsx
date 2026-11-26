import { Suspense } from "react";
import Link from "next/link";
import { btnSmall, listBox, pageTitle, sectionTitle } from "@/components/ui";
import { requireApproved } from "@/lib/auth";
import { addMonths, formatDateKo, formatMonth, isMonthString, monthOf, todayKST } from "@/lib/calendar";
import { formatDateTime } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";
import { loadVoteSummary, PHASE_LABEL, type VoteSummary } from "@/lib/votes";
import { NominateForm } from "./NominateForm";
import { PlaceVoteForm } from "./PlaceVoteForm";
import { RoundAdmin } from "./RoundAdmin";
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
  const { user, profile } = await requireApproved();
  const { month: rawMonth } = await searchParams;

  const currentMonth = monthOf(todayKST());
  // 기본은 다음 달 (모임은 보통 다음 달 일정을 정한다)
  const month = isMonthString(rawMonth) ? rawMonth : addMonths(currentMonth, 1);

  const supabase = await createClient();
  const summary = await loadVoteSummary(supabase, month, user.id, currentMonth);
  if ("error" in summary) {
    return <p className="text-sm text-danger">데이터를 불러오지 못했습니다. ({summary.error})</p>;
  }
  const s = summary.data;
  const { phase } = s.round;
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink-soft">모임 투표</p>
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
        <PhaseStrip s={s} />
        {phase !== "ended" && <ShareButton month={month} monthLabel={formatMonth(month)} phase={phase} />}
        {isAdmin && phase !== "ended" && <RoundAdmin month={month} round={s.round} />}
      </header>

      {phase === "date" ? (
        <>
          <DateVoteSection s={s} />
          <DateTallySection s={s} open />
        </>
      ) : (
        <>
          <DateResultSection s={s} />
          <PlaceSection s={s} currentUserId={user.id} isAdmin={isAdmin} />
        </>
      )}
    </div>
  );
}

// 지금 어느 단계인지, 다음 단계는 언제인지
function PhaseStrip({ s }: { s: VoteSummary }) {
  const { round } = s;
  const steps: { key: typeof round.phase; label: string }[] = [
    { key: "date", label: "날짜 투표" },
    { key: "nominate", label: "맛집 추천" },
    { key: "place", label: "맛집 투표" },
  ];
  const order = ["date", "nominate", "place", "ended"];
  const idx = order.indexOf(round.phase);

  let note: string;
  if (round.phase === "date") {
    note = `마감 ${formatDateTime(round.dateDeadline)}. 모두 답하면 그 전에 마감돼요.`;
  } else if (round.phase === "nominate") {
    note = `맛집 투표 시작 ${formatDateTime(round.placeOpensAt)}`;
  } else if (round.phase === "place") {
    note = "추천은 계속 받아요. 추천하면 바로 후보에 들어갑니다.";
  } else {
    note = "지난 모임이라 결과만 볼 수 있어요.";
  }

  return (
    <div className="space-y-2">
      <ol className="flex flex-wrap items-center gap-1 text-xs">
        {steps.map((st, i) => {
          const done = i < idx;
          const active = st.key === round.phase;
          return (
            <li key={st.key} className="flex items-center gap-1">
              <span
                className={`rounded-md px-2 py-1 font-medium ${
                  active
                    ? "bg-accent text-on-accent"
                    : done
                      ? "bg-surface-muted text-ink-soft line-through"
                      : "bg-surface-muted text-ink-faint"
                }`}
              >
                {st.label}
              </span>
              {i < steps.length - 1 && <span className="text-ink-faint">›</span>}
            </li>
          );
        })}
        {round.phase === "ended" && (
          <li className="rounded-md bg-surface-muted px-2 py-1 font-medium text-ink-soft">{PHASE_LABEL.ended}</li>
        )}
      </ol>
      <p className="text-sm text-ink-soft">{note}</p>
    </div>
  );
}

function DateVoteSection({ s }: { s: VoteSummary }) {
  return (
    <section className="space-y-4">
      <h2 className={sectionTitle}>참석 가능일</h2>
      <p className="text-sm text-ink-soft">
        갈 수 있는 날을 모두 고르세요. 토요일, 일요일, 공휴일만 후보에 오릅니다.
      </p>
      <VoteForm
        month={s.month}
        candidates={s.candidates}
        initialSelected={s.mySelected}
        initialAbsent={s.myAbsent}
        closed={false}
      />
    </section>
  );
}

// 날짜 투표가 끝난 뒤 맨 위에 보여 주는 결과
function DateResultSection({ s }: { s: VoteSummary }) {
  const { leaders, topCount, participantCount, members, round } = s;
  return (
    <section className="space-y-3 rounded-card border border-line bg-surface p-5">
      <p className="text-sm text-ink-soft">
        날짜 투표 결과
        {round.dateClosedAt && <> (마감 {formatDateTime(round.dateClosedAt)})</>}
      </p>
      {leaders.length === 0 ? (
        <p className="font-display text-2xl text-ink">아무도 날짜를 고르지 않았어요</p>
      ) : (
        <>
          <p className="font-display text-2xl leading-snug text-ink sm:text-3xl">
            {leaders.map((l) => formatDateKo(l.date)).join(", ")}
          </p>
          <p className="text-sm text-ink-soft">
            {topCount}명 참석 가능
            {leaders.length > 1 && " (동률)"}. 승인 회원 {members.length}명 중 {participantCount}명이 답했어요.
          </p>
        </>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-ink-soft hover:text-ink">전체 집계 보기</summary>
        <div className="pt-3">
          <DateTallySection s={s} />
        </div>
      </details>
    </section>
  );
}

function DateTallySection({ s, open }: { s: VoteSummary; open?: boolean }) {
  const { tally, topCount, members, participantCount, absentees, notVoted } = s;
  return (
    <section className="space-y-4">
      {open && (
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={sectionTitle}>집계</h2>
          <span className="text-sm text-ink-soft">
            {participantCount}명 답함 / 승인 회원 {members.length}명
          </span>
        </div>
      )}
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
          <span className="font-semibold text-danger">불참</span> {absentees.map((m) => m.nickname).join(", ")}
        </p>
      )}
      {notVoted.length > 0 && (
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">아직 답하지 않음</span> {notVoted.map((m) => m.nickname).join(", ")}
        </p>
      )}
    </section>
  );
}

function PlaceSection({
  s,
  currentUserId,
  isAdmin,
}: {
  s: VoteSummary;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const { round, places, placeTopCount, placeParticipantCount, members, myPlaceVotes, nominatable, month } = s;
  const voting = round.phase === "place";
  const locked = round.phase === "ended";

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={sectionTitle}>{voting ? "어디 갈까요" : "맛집 추천"}</h2>
        {voting && (
          <span className="text-sm text-ink-soft">
            {placeParticipantCount}명 투표 / 승인 회원 {members.length}명
          </span>
        )}
      </div>
      <p className="text-sm text-ink-soft">
        {locked
          ? "이번 달 후보와 결과예요."
          : voting
            ? "가고 싶은 곳을 3곳까지 고르세요. 후보에 없는 곳은 아래에서 추천하면 바로 추가돼요."
            : "저장한 맛집 중에서 이번 달 후보를 올려 주세요. 투표는 추천 기간이 끝나면 시작돼요."}
      </p>
      <PlaceVoteForm
        month={month}
        places={places}
        topCount={placeTopCount}
        initialSelected={myPlaceVotes}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        voting={voting}
        locked={locked}
      />
      {!locked && <NominateForm month={month} options={nominatable} />}
    </section>
  );
}
