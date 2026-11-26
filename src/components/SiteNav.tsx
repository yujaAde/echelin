"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MEMBER_LINKS = [
  { href: "/votes", label: "참석일 투표" },
  { href: "/posts", label: "모임 후기" },
  { href: "/board", label: "자유게시판" },
  { href: "/restaurants", label: "맛집 지도" },
];

const ADMIN_LINKS = [
  { href: "/admin/members", label: "회원 관리" },
  { href: "/admin/holidays", label: "공휴일 관리" },
];

// 가로로 스크롤되는 메뉴. 현재 위치는 노란 밑줄로 표시한다.
export function SiteNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...MEMBER_LINKS, ...ADMIN_LINKS] : MEMBER_LINKS;

  return (
    <nav aria-label="주 메뉴" className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block border-b-[3px] px-2.5 pb-2 pt-1 text-sm whitespace-nowrap ${
                  active
                    ? "border-accent font-semibold text-ink"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
