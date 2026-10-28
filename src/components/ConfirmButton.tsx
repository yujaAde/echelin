"use client";

import type { ReactNode } from "react";

// 서버 액션을 실행하기 전에 확인 창을 띄우는 폼 버튼
export function ConfirmButton({
  action,
  hidden,
  message,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className="inline"
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
