"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-5 py-5">
      <Link href="/" className="font-serif text-base tracking-tight text-stone-800">
        캡슐 미
      </Link>
      {loading || !user ? <span className="w-16" /> : (
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/new" className="text-stone-600 hover:text-stone-800">
            새 캡슐
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
