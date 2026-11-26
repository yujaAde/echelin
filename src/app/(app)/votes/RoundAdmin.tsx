"use client";

import { useActionState } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { FormMessage } from "@/components/FormMessage";
import { btnSmall, btnSmallPrimary, inputClass, labelClass } from "@/components/ui";
import { isoToKstInput, type RoundState } from "@/lib/votes";
import { closeDateVoteNow, openPlaceVoteNow, reopenDateVote, updateRoundSchedule, type VoteFormState } from "./actions";

// 운영진용 진행 조정. 접혀 있다가 열면 마감·재개·시작 버튼과 일정 입력이 나온다.
export function RoundAdmin({ month, round }: { month: string; round: RoundState }) {
  const [state, formAction, pending] = useActionState<VoteFormState, FormData>(updateRoundSchedule, {});

  return (
    <details className="rounded-card border border-line bg-surface text-sm">
      <summary className="cursor-pointer px-4 py-3 font-medium text-ink">운영진 설정</summary>
      <div className="space-y-4 border-t border-line px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {round.phase === "date" && (
            <ConfirmButton
              action={closeDateVoteNow}
              hidden={{ month }}
              message="날짜 투표를 지금 마감할까요? 더 이상 날짜를 고칠 수 없고 맛집 추천이 시작됩니다."
              pendingLabel="마감 중..."
              className={btnSmallPrimary}
            >
              날짜 투표 지금 마감
            </ConfirmButton>
          )}
          {(round.phase === "nominate" || round.phase === "place") && (
            <ConfirmButton
              action={reopenDateVote}
              hidden={{ month }}
              message="날짜 투표를 다시 열까요? 맛집 추천과 투표는 그대로 남고, 날짜 마감 뒤 다시 이어집니다."
              pendingLabel="여는 중..."
              className={btnSmall}
            >
              날짜 투표 다시 열기
            </ConfirmButton>
          )}
          {round.phase === "nominate" && (
            <ConfirmButton
              action={openPlaceVoteNow}
              hidden={{ month }}
              message="맛집 투표를 지금 시작할까요? 추천은 계속 받을 수 있습니다."
              pendingLabel="시작 중..."
              className={btnSmallPrimary}
            >
              맛집 투표 지금 시작
            </ConfirmButton>
          )}
        </div>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="month" value={month} />
          <FormMessage error={state.error} success={state.success} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="date_deadline" className={labelClass}>날짜 투표 마감</label>
              <input
                id="date_deadline"
                name="date_deadline"
                type="datetime-local"
                defaultValue={isoToKstInput(round.dateDeadline)}
                className={inputClass}
              />
              <p className="text-xs text-ink-faint">
                {round.hasCustomDeadline ? "직접 정한 값" : "기본값: 전달 말일 23:59"}. 모두 답하면 그 전에도 마감돼요.
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor="place_vote_opens_at" className={labelClass}>맛집 투표 시작</label>
              <input
                id="place_vote_opens_at"
                name="place_vote_opens_at"
                type="datetime-local"
                defaultValue={isoToKstInput(round.placeOpensAt)}
                className={inputClass}
              />
              <p className="text-xs text-ink-faint">
                {round.hasCustomOpensAt ? "직접 정한 값" : `기본값: 날짜 마감 ${round.nominationDays}일 뒤`}. 그 전까지는 추천만 받아요.
              </p>
            </div>
          </div>
          <button type="submit" disabled={pending} className={btnSmallPrimary}>
            {pending ? "저장 중..." : "일정 저장"}
          </button>
        </form>
      </div>
    </details>
  );
}
