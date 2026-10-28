import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "맛집탐방 소모임",
  description: "맛집탐방 소모임 회원 전용 사이트",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
