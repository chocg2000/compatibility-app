"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈" },
  { href: "/mbti", label: "MBTI 간이진단" },
  { href: "/saju", label: "사주 개별분석" },
  { href: "/gwansang", label: "관상 개별분석" },
  { href: "/seongmyeong", label: "성명학 개별분석" },
  { href: "/compatibility", label: "종합궁합" },
];

/**
 * 모든 페이지가 공유하는 헤더/네비게이션.
 * 각 페이지가 서로 다른 톤(예: /saju의 먹색 테마)을 갖더라도
 * 헤더 자체는 항상 동일한 중립적인 스타일을 유지한다.
 */
export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Compatibility App
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
