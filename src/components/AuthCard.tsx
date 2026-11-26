import type { CSSProperties, ReactNode } from "react";

export function AuthCard({
  title,
  children,
  backgroundImage,
}: {
  title: string;
  children: ReactNode;
  /** public/ 기준 경로. 지정하면 화면 전체 배경으로 깔고 카드를 반투명하게 띄운다. */
  backgroundImage?: string;
}) {
  const style: CSSProperties | undefined = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : undefined;

  return (
    <main
      className={`flex flex-1 items-center justify-center bg-cover bg-center p-6 ${
        backgroundImage ? "bg-no-repeat" : ""
      }`}
      style={style}
    >
      <div
        className={`w-full max-w-sm rounded-xl border border-neutral-200 p-8 shadow-sm dark:border-neutral-800 ${
          backgroundImage
            ? "bg-white/90 shadow-lg backdrop-blur-sm dark:bg-neutral-950/90"
            : "bg-white dark:bg-neutral-950"
        }`}
      >
        <p className="mb-1 text-center text-sm text-neutral-500">E슐랭</p>
        <h1 className="mb-6 text-center text-xl font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100 dark:focus:ring-neutral-100";

export const buttonClass =
  "w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300";
