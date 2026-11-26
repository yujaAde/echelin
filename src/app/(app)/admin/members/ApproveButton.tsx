"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { btnSmall, btnSmallPrimary } from "@/components/ui";
import { setApproved, type ApproveState } from "./actions";

// 승인/승인 취소 버튼. 처리 중 표시와 실패 메시지를 보여 준다.
// 서버 액션이 refresh() 로 화면을 갱신하지만, 환경에 따라 반영되지 않는 경우가 있어
// 성공 시 클라이언트에서도 router.refresh() 로 한 번 더 최신 데이터를 받는다.
export function ApproveButton({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ApproveState, FormData>(
    async (prev, formData) => {
      const result = await setApproved(prev, formData);
      if (!result.error) router.refresh();
      return result;
    },
    {},
  );

  const label = pending ? "처리 중..." : approved ? "승인 취소" : "승인";

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={approved ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className={approved ? btnSmall : btnSmallPrimary}
        aria-busy={pending}
      >
        {label}
      </button>
      {state.error && <span className="ml-2 text-xs text-danger">{state.error}</span>}
    </form>
  );
}
