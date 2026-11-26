import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  applicationName: SITE_NAME,
  description: SITE_DESCRIPTION,
  // iOS 홈 화면 추가 시 앱처럼 열리도록
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  // 카카오톡 등에서 링크 미리보기 카드에 쓰인다
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf5e6" },
    { media: "(prefers-color-scheme: dark)", color: "#15181e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* 제목용 서체. 본문은 시스템 고딕을 쓴다 (globals.css) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 루트 레이아웃이라 모든 페이지에 적용된다. App Router 에서는 이 경고가 해당되지 않는다. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap"
        />
        {/* 안드로이드 설치 이벤트는 앱이 뜨기 전에 올 수 있어 가장 먼저 붙잡아 둔다. InstallGuide 가 읽는다. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__installPrompt=e;try{sessionStorage.removeItem('echelin.installGuideInstalled')}catch(_){}window.dispatchEvent(new Event('installprompt-ready'));});window.addEventListener('appinstalled',function(){window.__installPrompt=null;try{sessionStorage.setItem('echelin.installGuideInstalled','1')}catch(_){}});`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
