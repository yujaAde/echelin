import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { SiteNav } from "@/components/SiteNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requireApproved } from "@/lib/auth";

export async function SiteHeader() {
  const { profile } = await requireApproved();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-full border border-accent"
            />
            <span className="font-display text-2xl leading-none text-ink">E슐랭</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/account/password"
              className="max-w-28 truncate text-ink-soft hover:text-ink"
              title="비밀번호 변경"
            >
              {profile.nickname}
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <SiteNav isAdmin={profile.role === "admin"} />
      </div>
    </header>
  );
}
