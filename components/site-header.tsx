"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-5">
      <Link href="/" className="text-sm font-semibold tracking-wide text-stone-800">
        캡슐 미
      </Link>
      {loading || !user ? null : (
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/new" className="text-stone-600 hover:text-stone-800">
            캡슐 묻기
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-stone-400 hover:text-stone-600"
          >
            로그아웃
          </button>
        </nav>
      )}
    </header>
  );
}
