import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { requireApproved } from "@/lib/auth";

const linkClass = "text-neutral-600 hover:underline dark:text-neutral-400";

export async function SiteHeader() {
  const { profile } = await requireApproved();

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/" className="font-semibold">
            맛집탐방 소모임
          </Link>
          <Link href="/votes" className={linkClass}>
            참석일 투표
          </Link>
          <Link href="/posts" className={linkClass}>
            모임 후기
          </Link>
          <Link href="/restaurants" className={linkClass}>
            맛집 지도
          </Link>
          {profile.role === "admin" && (
            <>
              <Link href="/admin/members" className={linkClass}>
                회원 관리
              </Link>
              <Link href="/admin/holidays" className={linkClass}>
                공휴일 관리
              </Link>
            </>
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
