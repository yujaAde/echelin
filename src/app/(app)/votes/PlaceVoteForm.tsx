"use client";

import { useActionState, useState } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { FormMessage } from "@/components/FormMessage";
import { btnPrimary } from "@/components/ui";
import { MAX_PLACE_VOTES, type PlaceCandidate } from "@/lib/votes";
import { removeNomination, savePlaceVotes, type VoteFormState } from "./actions";

// 후보 목록. 투표 기간에는 체크박스로 최대 3곳을 고르고, 추천 기간에는 목록만 보여 준다.
export function PlaceVoteForm({
  month,
  places,
  topCount,
  initialSelected,
  currentUserId,
  isAdmin,
  voting,
  locked,
}: {
  month: string;
  places: PlaceCandidate[];
  topCount: number;
  initialSelected: string[];
  currentUserId: string;
  isAdmin: boolean;
  voting: boolean; // 투표 기간인가 (아니면 추천만)
  locked: boolean; // 지난 달
}) {
  const [state, formAction, pending] = useActionState<VoteFormState, FormData>(savePlaceVotes, {});
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  const full = selected.size >= MAX_PLACE_VOTES;

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  if (places.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line px-4 py-8 text-center">
        <p className="text-sm text-ink-soft">아직 후보가 없어요. 첫 맛집을 추천해 보세요.</p>
      </div>
    );
  }

  const rows = places.map((p) => {
    const isTop = voting && topCount > 0 && p.voters.length === topCount;
    const checked = selected.has(p.restaurantId);
    const canRemove = !locked && (p.nominatedBy === currentUserId || isAdmin);
    const body = (
      <>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{p.name}</p>
          {p.address && <p className="text-xs text-ink-faint">{p.address}</p>}
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-faint">
            <span>추천 {p.nominatorName}</span>
            {voting && p.voters.length > 0 && <span>{p.voters.join(", ")}</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {voting && (
            <span
              className={`inline-block min-w-9 rounded-md px-2 py-0.5 text-center text-xs font-bold ${
                isTop ? "bg-accent text-on-accent" : "bg-surface-muted text-ink"
              }`}
            >
              {p.voters.length}표
            </span>
          )}
          {canRemove && (
            <ConfirmButton
              action={removeNomination}
              hidden={{ id: p.nominationId }}
              message={`${p.name}을(를) 후보에서 뺄까요?`}
              pendingLabel="빼는 중..."
              className="text-xs text-ink-faint hover:text-danger"
            >
              빼기
            </ConfirmButton>
          )}
        </div>
      </>
    );

    if (!voting || locked) {
      return (
        <li key={p.nominationId} className="flex items-start gap-3 px-4 py-3 text-sm">
          {body}
        </li>
      );
    }
    return (
      <li key={p.nominationId}>
        <label
          className={`flex cursor-pointer items-start gap-3 px-4 py-3 text-sm ${
            checked ? "bg-accent-soft" : ""
          } ${!checked && full ? "opacity-60" : ""}`}
        >
          <input
            type="checkbox"
            name="restaurant_ids"
            value={p.restaurantId}
            checked={checked}
            disabled={pending || (!checked && full)}
            onChange={(e) => toggle(p.restaurantId, e.target.checked)}
            className="mt-1 size-4 shrink-0 accent-brand"
          />
          {body}
        </label>
      </li>
    );
  });

  if (!voting || locked) {
    return <ul className="divide-y divide-line rounded-card border border-line bg-surface">{rows}</ul>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="month" value={month} />
      <FormMessage error={state.error} success={state.success} />
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">{rows}</ul>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={`${btnPrimary} w-full sm:w-auto`}>
          {pending ? "저장 중..." : "맛집 투표 저장"}
        </button>
        <span className="text-sm text-ink-soft">
          {selected.size}/{MAX_PLACE_VOTES}곳 선택
        </span>
      </div>
    </form>
  );
}
