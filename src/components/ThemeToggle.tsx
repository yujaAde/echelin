"use client";

import { useSyncExternalStore } from "react";

// 라이트 / 다크 / 기기 설정 전환 버튼.
// 선택은 이 기기의 브라우저(localStorage)에 저장되고, 루트 레이아웃의 인라인 스크립트가
// 페이지를 그리기 전에 html[data-theme] 로 먼저 적용해 화면이 번쩍이지 않게 한다.

export const THEME_KEY = "echelin.theme";

type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = {
  system: "기기 설정 따름",
  light: "라이트 모드",
  dark: "다크 모드",
};
// 상단 상태 표시줄 색(theme-color)도 함께 맞춘다
const PAPER: Record<"light" | "dark", string> = { light: "#fbf5e6", dark: "#15181e" };

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function readTheme(): Theme {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;

  const effective =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", PAPER[effective]));

  try {
    if (theme === "system") window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // 저장이 안 되면 이번 방문 동안만 적용된다
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);

  function next() {
    applyTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]);
  }

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`화면 모드: ${LABEL[theme]}. 눌러서 바꾸기`}
      title={LABEL[theme]}
      className={
        className ??
        "inline-flex size-8 items-center justify-center rounded-md border border-line bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink"
      }
    >
      {theme === "light" ? <SunIcon /> : theme === "dark" ? <MoonIcon /> : <AutoIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

// 기기 설정 따름: 반은 해, 반은 달 느낌의 원
function AutoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
    </svg>
  );
}
