"use client";

import { useActionState } from "react";
import { inputClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";
import { addHoliday, type HolidayFormState } from "./actions";

export function HolidayForm() {
  const [state, formAction, pending] = useActionState<HolidayFormState, FormData>(
    addHoliday,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <FormMessage error={state.error} success={state.success} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="date" name="date" required className={`${inputClass} sm:w-44`} />
        <input
          type="text"
          name="name"
          placeholder="예: 대체공휴일(한글날)"
          maxLength={30}
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {pending ? "저장 중..." : "추가"}
        </button>
      </div>
      <p className="text-xs text-neutral-500">같은 날짜를 다시 추가하면 이름이 덮어써집니다.</p>
    </form>
  );
}
