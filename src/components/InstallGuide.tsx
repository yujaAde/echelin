"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// "홈 화면에 추가" 안내. 이미 앱 모드로 열려 있거나 PC 브라우저면 아무것도 보여주지 않는다.

const DISMISS_KEY = "echelin.installGuideDismissed";

type Platform = "server" | "standalone" | "ios" | "android" | "other";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
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

export function InstallGuide() {
  const platform = useSyncExternalStore(subscribe, detectPlatform, () => "server" as Platform);
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (dismissed || platform === "server" || platform === "standalone" || platform === "other") {
    return null;
  }

  const inApp = isKakaoInApp();

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") writeDismissed();
    setInstallPrompt(null);
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
      <p className="font-medium">홈 화면에 추가하면 앱처럼 바로 열 수 있어요</p>
      {platform === "ios" ? (
        <ol className="list-decimal space-y-1 pl-5 text-neutral-700 dark:text-neutral-300">
          {inApp && <li>카카오톡 안에서 열렸다면 오른쪽 아래 메뉴에서 &quot;Safari로 열기&quot;를 먼저 누르세요.</li>}
          <li>Safari 아래쪽 공유 버튼(네모에 화살표)을 누르세요.</li>
          <li>&quot;홈 화면에 추가&quot;를 선택하고 &quot;추가&quot;를 누르세요.</li>
        </ol>
      ) : installPrompt ? (
        <button
          type="button"
          onClick={install}
          className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          앱으로 설치
        </button>
      ) : (
        <ol className="list-decimal space-y-1 pl-5 text-neutral-700 dark:text-neutral-300">
          {inApp && <li>카카오톡 안에서 열렸다면 오른쪽 아래 메뉴에서 &quot;다른 브라우저로 열기&quot;를 먼저 누르세요.</li>}
          <li>Chrome 오른쪽 위 메뉴(점 세 개)를 누르세요.</li>
          <li>&quot;홈 화면에 추가&quot; 또는 &quot;앱 설치&quot;를 선택하세요.</li>
        </ol>
      )}
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
