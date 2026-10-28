import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="h-14 border-b border-neutral-200 dark:border-neutral-800" />}>
        <SiteHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
