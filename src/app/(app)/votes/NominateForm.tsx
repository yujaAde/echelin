"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { btnPrimary, inputClass } from "@/components/ui";
import { nominatePlace, type VoteFormState } from "./actions";

// "저장한 맛집" 중에서 이번 달 후보를 올리는 폼
export function NominateForm({
  month,
  options,
}: {
  month: string;
  options: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<VoteFormState, FormData>(nominatePlace, {});

  return (
    <form action={formAction} className="space-y-2 rounded-card border border-line bg-surface p-4">
      <input type="hidden" name="month" value={month} />
      <FormMessage error={state.error} success={state.success} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          name="restaurant_id"
          required
          defaultValue=""
          aria-label="추천할 맛집"
          disabled={options.length === 0 || pending}
          className={inputClass}
        >
          <option value="" disabled>
            {options.length === 0 ? "올릴 수 있는 맛집이 없어요" : "저장한 맛집에서 고르기"}
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={options.length === 0 || pending}
          className={`${btnPrimary} shrink-0`}
        >
          {pending ? "올리는 중..." : "후보로 올리기"}
        </button>
      </div>
      <p className="text-xs text-ink-faint">
        목록에 없는 곳은{" "}
        <Link href="/restaurants" className="text-brand hover:underline">
          맛집 지도
        </Link>
        에서 먼저 저장한 뒤 올릴 수 있어요.
      </p>
    </form>
  );
}
