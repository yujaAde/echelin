"use client";

import { useState } from "react";
import { btnSmall } from "@/components/ui";
import { loadKakaoSdk } from "@/lib/kakaoShare";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// 투표 링크를 카카오톡 단톡방에 올리는 버튼. SDK 실패 시 OS 공유 → 링크 복사로 단계적으로 대체한다.
export function ShareButton({ month, monthLabel }: { month: string; monthLabel: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const url = `${SITE_URL}/votes?month=${month}`;
  const text = `[${SITE_NAME}] ${monthLabel} 모임 참석 가능일 투표입니다. 갈 수 있는 날을 모두 골라 주세요!`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMessage("링크를 복사했습니다. 단톡방에 붙여 넣으세요.");
    } catch {
      setMessage(`복사가 안 됐습니다. 주소를 직접 옮겨 주세요: ${url}`);
    }
  }

  async function shareKakao() {
    setBusy(true);
    setMessage(null);
    try {
      const sdk = await loadKakaoSdk();
      sdk.Share.sendDefault({
        objectType: "text",
        text,
        link: { mobileWebUrl: url, webUrl: url },
        buttonTitle: "투표하러 가기",
      });
    } catch {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ title: SITE_NAME, text, url });
        } catch {
          // 사용자가 공유 시트를 닫은 경우
        }
      } else {
        await copyLink();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={shareKakao}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-md bg-[#FEE500] px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#f5dc00] disabled:opacity-50"
        >
          {busy ? "준비 중..." : "카카오톡으로 공유"}
        </button>
        <button type="button" onClick={copyLink} className={btnSmall}>
          링크 복사
        </button>
      </div>
      {message && <p className="text-xs text-ink-soft">{message}</p>}
    </div>
  );
}
