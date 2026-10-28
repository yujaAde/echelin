"use client";

import { useActionState } from "react";
import { recheckApproval, type AuthFormState } from "@/app/(auth)/actions";
import { buttonClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";

export function RecheckButton() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(recheckApproval, {});

  return (
    <form action={formAction} className="space-y-3">
      <FormMessage error={state.error} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "확인 중..." : "승인 여부 다시 확인"}
      </button>
    </form>
  );
}
