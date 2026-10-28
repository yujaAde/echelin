import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { requireApproved } from "@/lib/auth";

export async function SiteHeader() {
  const { profile } = await requireApproved();

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-semibold">맛집탐방 소모임</Link>
          {profile.role === "admin" && (
            <Link href="/admin/members" className="text-neutral-600 hover:underline dark:text-neutral-400">
              회원 관리
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">{profile.nickname}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
