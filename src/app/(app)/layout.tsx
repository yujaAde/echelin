import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="h-24 border-b border-line" />}>
        <SiteHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}
