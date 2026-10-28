"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import type { CandidateDate } from "@/lib/calendar";
import { WEEKDAY_LABELS } from "@/lib/calendar";
import { saveVotes, type VoteFormState } from "./actions";

export function VoteForm({
  month,
  candidates,
  initialSelected,
  closed,
}: {
  month: string;
  candidates: CandidateDate[];
  initialSelected: string[];
  closed: boolean;
}) {
  const [state, formAction, pending] = useActionState<VoteFormState, FormData>(saveVotes, {});
  const selectedSet = new Set(initialSelected);

  if (candidates.length === 0) {
    return <p className="text-sm text-neutral-500">이 달에는 후보일(토/일/공휴일)이 없습니다.</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="month" value={month} />
      <FormMessage error={state.error} success={state.success} />

      <fieldset
        disabled={closed || pending}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
      >
        {candidates.map((c) => {
          const day = Number(c.date.slice(8, 10));
          const tone =
            c.holidayName || c.weekday === 0
              ? "text-red-600 dark:text-red-400"
              : "text-blue-600 dark:text-blue-400";
          return (
            <label
              key={c.date}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-100 has-[:disabled]:cursor-default has-[:disabled]:opacity-60 dark:border-neutral-800 dark:has-[:checked]:border-neutral-100 dark:has-[:checked]:bg-neutral-900"
            >
              <input
                type="checkbox"
                name="dates"
                value={c.date}
                defaultChecked={selectedSet.has(c.date)}
                className="mt-0.5"
              />
              <span className="flex flex-col">
                <span className="font-medium">
                  {day}일 <span className={tone}>({WEEKDAY_LABELS[c.weekday]})</span>
                </span>
                {c.holidayName && (
                  <span className="text-xs text-red-600 dark:text-red-400">{c.holidayName}</span>
                )}
              </span>
            </label>
          );
        })}
      </fieldset>

      {closed ? (
        <p className="text-sm text-neutral-500">지난 달은 투표를 수정할 수 없습니다.</p>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {pending ? "저장 중..." : "참석 가능일 저장"}
        </button>
      )}
    </form>
  );
}
