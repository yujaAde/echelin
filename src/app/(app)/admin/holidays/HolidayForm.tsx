"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { btnPrimary, inputClass } from "@/components/ui";
import { addHoliday, type HolidayFormState } from "./actions";

export function HolidayForm() {
  const [state, formAction, pending] = useActionState<HolidayFormState, FormData>(
    addHoliday,
    {},
  );

  return (
    <form action={formAction} className="space-y-3 rounded-card border border-line bg-surface p-4">
      <FormMessage error={state.error} success={state.success} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="date" name="date" required aria-label="날짜" className={`${inputClass} sm:w-44`} />
        <input
          type="text"
          name="name"
          placeholder="이름 (예: 대체공휴일, 한글날)"
          aria-label="공휴일 이름"
          maxLength={30}
          required
          className={inputClass}
        />
        <button type="submit" disabled={pending} className={`${btnPrimary} shrink-0`}>
          {pending ? "추가 중..." : "공휴일 추가"}
        </button>
      </div>
      <p className="text-xs text-ink-faint">같은 날짜를 다시 넣으면 이름만 바뀝니다.</p>
    </form>
  );
}
