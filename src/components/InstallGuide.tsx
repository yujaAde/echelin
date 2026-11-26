"use client";

import { useSyncExternalStore } from "react";

// "홈 화면에 추가" 안내. 이미 앱 모드로 열려 있거나 PC 브라우저면 아무것도 보여주지 않는다.
// 안드로이드 설치 이벤트(beforeinstallprompt)는 페이지가 뜨기 전에 올 수 있어
// 루트 레이아웃의 인라인 스크립트가 window.__installPrompt 에 먼저 붙잡아 둔다.

const DISMISS_KEY = "echelin.installGuideDismissed";

type Platform = "server" | "standalone" | "ios" | "android" | "other";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __installPrompt?: BeforeInstallPromptEvent | null;
  }
}

const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  window.addEventListener("installprompt-ready", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener("installprompt-ready", callback);
    window.removeEventListener("appinstalled", callback);
  };
}
function notify() {
  listeners.forEach((l) => l());
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}
function writeDismissed() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // 저장 불가 환경(시크릿 모드 등)이면 이번 세션에서만 닫힌다.
  }
  notify();
}

function readInstallPrompt(): BeforeInstallPromptEvent | null {
  return window.__installPrompt ?? null;
}

function detectPlatform(): Platform {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone) {
    return "standalone";
  }
  const ua = nav.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

function isKakaoInApp(): boolean {
  return /KAKAOTALK/i.test(window.navigator.userAgent);
}

// 카카오톡 내장 브라우저에서 기본 브라우저(아이폰은 Safari)로 현재 페이지를 연다.
function openExternalBrowser() {
  window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
}

const primaryButton =
  "w-full rounded-md bg-neutral-900 px-4 py-2.5 font-medium text-white hover:bg-neutral-700 sm:w-auto dark:bg-neutral-100 dark:text-neutral-900";

export function InstallGuide() {
  const platform = useSyncExternalStore(subscribe, detectPlatform, () => "server" as Platform);
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const installPrompt = useSyncExternalStore(subscribe, readInstallPrompt, () => null);

  if (dismissed || platform === "server" || platform === "standalone" || platform === "other") {
    return null;
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    window.__installPrompt = null;
    if (outcome === "accepted") writeDismissed();
    else notify();
  }

  const inApp = isKakaoInApp();

  let body;
  if (inApp) {
    body = (
      <div className="space-y-2">
        <p className="text-neutral-700 dark:text-neutral-300">
          카카오톡 안에서는 설치할 수 없어요. 아래 버튼으로 브라우저에서 연 다음 설치해 주세요.
        </p>
        <button type="button" onClick={openExternalBrowser} className={primaryButton}>
          브라우저로 열기
        </button>
      </div>
    );
  } else if (platform === "ios") {
    body = (
      <ol className="space-y-2 text-neutral-700 dark:text-neutral-300">
        <li className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center font-semibold">1</span>
          <span>Safari 아래쪽 공유 버튼</span>
          <ShareIcon />
          <span>을 누르세요.</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center font-semibold">2</span>
          <span>목록에서 &quot;홈 화면에 추가&quot;</span>
          <AddIcon />
          <span>를 고르세요.</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center font-semibold">3</span>
          <span>오른쪽 위 &quot;추가&quot;를 누르면 끝이에요.</span>
        </li>
      </ol>
    );
  } else if (installPrompt) {
    body = (
      <button type="button" onClick={install} className={primaryButton}>
        앱 설치하기
      </button>
    );
  } else {
    body = (
      <ol className="list-decimal space-y-1 pl-5 text-neutral-700 dark:text-neutral-300">
        <li>브라우저 오른쪽 위 메뉴(점 세 개)를 누르세요.</li>
        <li>&quot;홈 화면에 추가&quot; 또는 &quot;앱 설치&quot;를 선택하세요.</li>
      </ol>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
      <p className="font-medium">홈 화면에 추가하면 앱처럼 바로 열 수 있어요</p>
      {body}
      <button
        type="button"
        onClick={writeDismissed}
        className="text-xs text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300"
      >
        다시 보지 않기
      </button>
    </div>
  );
}

// iOS 공유 아이콘(네모에서 위로 향한 화살표)
function ShareIcon() {
  return (
    <svg
      aria-label="공유 아이콘"
      viewBox="0 0 24 24"
      className="inline-block size-6 shrink-0 rounded border border-neutral-300 bg-white p-0.5 text-blue-600 dark:border-neutral-600 dark:bg-neutral-900"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}

// iOS "홈 화면에 추가" 아이콘(네모 안 더하기)
function AddIcon() {
  return (
    <svg
      aria-label="홈 화면에 추가 아이콘"
      viewBox="0 0 24 24"
      className="inline-block size-6 shrink-0 rounded border border-neutral-300 bg-white p-0.5 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
