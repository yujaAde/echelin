// 브라우저 전용: 카카오 JavaScript SDK(v2) 를 한 번만 로드하고 초기화한다.
// 지도 SDK(lib/kakao.ts) 와는 별개 파일이며, 같은 JavaScript 키를 쓴다.
// 버전과 무결성 값은 https://developers.kakao.com/docs/latest/ko/javascript/download 기준.

const SDK_VERSION = "2.8.3";
const SDK_INTEGRITY =
  "sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy";

let loader: Promise<KakaoSdk> | null = null;

export function loadKakaoSdk(): Promise<KakaoSdk> {
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

  loader = new Promise<KakaoSdk>((resolve, reject) => {
    const finish = () => {
      const sdk = window.Kakao;
      if (!sdk) {
        loader = null;
        reject(new Error("카카오 SDK 초기화에 실패했습니다."));
        return;
      }
      if (!sdk.isInitialized()) sdk.init(key);
      resolve(sdk);
    };

    if (window.Kakao) {
      finish();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://t1.kakaocdn.net/kakao_js_sdk/${SDK_VERSION}/kakao.min.js`;
    script.integrity = SDK_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = finish;
    script.onerror = () => {
      loader = null;
      reject(new Error("카카오 SDK 를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });

  return loader;
}
