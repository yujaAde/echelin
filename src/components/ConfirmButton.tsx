"use client";

import { useRouter } from "next/navigation";
import { useActionState, type ReactNode } from "react";

export type ActionResult = { error?: string };

// 서버 액션을 실행하기 전에 확인 창을 띄우는 폼 버튼.
// 액션이 끝나면 클라이언트에서 router.refresh() 로 화면을 다시 받아, 서버의 refresh() 가
// 배포 환경에서 반영되지 않는 경우에도 목록이 갱신되게 한다. redirect 하는 액션은 그대로 이동한다.
export function ConfirmButton({
  action,
  hidden,
  message,
  className,
  pendingLabel = "처리 중...",
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult | void>;
  hidden: Record<string, string>;
  message: string;
  className?: string;
  pendingLabel?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      const result = await action(formData);
      if (result?.error) return result;
      router.refresh();
      return {};
    },
    {},
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className="inline"
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" disabled={pending} className={className} aria-busy={pending}>
        {pending ? pendingLabel : children}
      </button>
      {state.error && <span className="ml-2 text-xs text-danger">{state.error}</span>}
    </form>
  );
}
