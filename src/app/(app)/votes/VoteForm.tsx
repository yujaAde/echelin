"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { btnPrimary } from "@/components/ui";
import type { CandidateDate } from "@/lib/calendar";
import { WEEKDAY_LABELS } from "@/lib/calendar";
import { saveVotes, type VoteFormState } from "./actions";

export function VoteForm({
  month,
  candidates,
  initialSelected,
  initialAbsent,
  closed,
}: {
  month: string;
  candidates: CandidateDate[];
  initialSelected: string[];
  initialAbsent: boolean;
  closed: boolean;
}) {
  const [state, formAction, pending] = useActionState<VoteFormState, FormData>(saveVotes, {});
  const [absent, setAbsent] = useState(initialAbsent);
  const selectedSet = new Set(initialSelected);
  const locked = closed || pending;

  if (candidates.length === 0) {
    return <p className="text-sm text-ink-soft">이 달에는 후보일(토/일/공휴일)이 없습니다.</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="month" value={month} />
      <FormMessage error={state.error} success={state.success} />

      <fieldset
        disabled={locked || absent}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
      >
        <legend className="sr-only">참석 가능한 날짜</legend>
        {candidates.map((c) => {
          const day = Number(c.date.slice(8, 10));
          const tone = c.holidayName || c.weekday === 0 ? "text-danger" : "text-brand";
          return (
            <label
              key={c.date}
              className="flex min-h-14 cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:disabled]:cursor-default has-[:disabled]:opacity-50"
            >
              <input
                type="checkbox"
                name="dates"
                value={c.date}
                defaultChecked={selectedSet.has(c.date)}
                className="mt-0.5 size-4 accent-brand"
              />
              <span className="flex flex-col">
                <span className="font-semibold text-ink">
                  {day}일 <span className={tone}>({WEEKDAY_LABELS[c.weekday]})</span>
                </span>
                {c.holidayName && <span className="text-xs text-danger">{c.holidayName}</span>}
              </span>
            </label>
          );
        })}
      </fieldset>

      <label
        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-3 text-sm ${
          absent ? "border-danger bg-danger-soft text-danger" : "border-line bg-surface text-ink"
        } ${locked ? "cursor-default opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          name="absent"
          value="1"
          checked={absent}
          disabled={locked}
          onChange={(e) => setAbsent(e.target.checked)}
          className="size-4 accent-danger"
        />
        <span className="font-medium">이번 달은 참석이 어려워요</span>
      </label>

      {closed ? (
        <p className="text-sm text-ink-soft">지난 달 투표는 바꿀 수 없습니다.</p>
      ) : (
        <button type="submit" disabled={pending} className={`${btnPrimary} w-full py-3 sm:w-auto sm:py-2.5`}>
          {pending ? "저장 중..." : absent ? "불참으로 저장" : "참석 가능일 저장"}
        </button>
      )}
    </form>
  );
}
