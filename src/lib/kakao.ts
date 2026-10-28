// 브라우저 전용: 카카오맵 SDK 를 한 번만 로드한다.

let loader: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 사용할 수 있습니다."));
  }
  if (loader) return loader;

  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!key) {
    return Promise.reject(
      new Error("환경변수 NEXT_PUBLIC_KAKAO_MAP_KEY 가 설정되지 않았습니다."),
    );
  }

  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps?.load) {
        loader = null;
        reject(new Error("카카오맵 SDK 초기화에 실패했습니다."));
        return;
      }
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => {
      loader = null;
      reject(
        new Error(
          "카카오맵 SDK 를 불러오지 못했습니다. 카카오 개발자 콘솔에서 JavaScript 키, 플랫폼(Web) 도메인 등록, 카카오맵 활성화 여부를 확인하세요.",
        ),
      );
    };
    document.head.appendChild(script);
  });

  return loader;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
