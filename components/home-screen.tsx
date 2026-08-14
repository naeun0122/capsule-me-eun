"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Countdown } from "@/components/countdown";
import { SiteHeader } from "@/components/site-header";
import {
  formatOpenAt,
  isCapsuleOpen,
  parseCapsule,
  type Capsule,
} from "@/lib/capsule";
import { getFirebaseFirestore } from "@/lib/firebase";

function authErrorMessage(error: unknown) {
  if (
    error instanceof FirebaseError &&
    (error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request")
  ) {
    return null;
  }

  if (error instanceof FirebaseError && error.code === "auth/unauthorized-domain") {
    return "이 도메인은 Firebase 인증에 허용되지 않았습니다.";
  }

  return "구글 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function HomeScreen() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setCapsules([]);
      setListLoading(false);
      return;
    }

    setListLoading(true);
    const capsulesQuery = query(
      collection(getFirebaseFirestore(), "capsules"),
      where("ownerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      capsulesQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((doc) => parseCapsule(doc))
          .sort((left, right) => {
            const leftTime = left.openAt ? new Date(left.openAt).getTime() : Number.MAX_SAFE_INTEGER;
            const rightTime = right.openAt ? new Date(right.openAt).getTime() : Number.MAX_SAFE_INTEGER;
            return leftTime - rightTime;
          });
        setCapsules(next);
        setListError(null);
        setListLoading(false);
      },
      (caught) => {
        console.error(caught);
        setListError("캡슐 목록을 불러오지 못했습니다.");
        setListLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);

    try {
      await signInWithGoogle();
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-b from-amber-50 via-rose-50 to-stone-100">
        <div className="h-12 w-56 animate-pulse rounded-full bg-stone-200/80" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-b from-amber-50 via-rose-50 to-stone-100 px-6 py-16">
        <main className="w-full max-w-lg rounded-3xl border border-amber-100/80 bg-white/80 px-8 py-16 text-center shadow-xl shadow-amber-900/5 backdrop-blur-sm sm:px-12 sm:py-20">
          <p className="mb-6 text-xs tracking-[0.35em] text-amber-800/70 uppercase">
            time capsule
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-stone-800 sm:text-6xl">
            캡슐 미
          </h1>
          <p className="mx-auto mt-6 max-w-sm text-base leading-relaxed text-stone-500">
            사진과 편지를 묻고, 열람일에 함께 열어요
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={pending}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-stone-200 bg-white px-7 py-3.5 text-sm font-medium tracking-wide text-stone-700 shadow-md shadow-stone-900/5 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <GoogleMark />
              {pending ? "로그인 중..." : "Google로 시작하기"}
            </button>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        </main>
      </div>
    );
  }

  const openCount = capsules.filter((capsule) => isCapsuleOpen(capsule.openAt)).length;
  const sealedCount = capsules.length - openCount;

  return (
    <div className="min-h-full flex-1 bg-gradient-to-b from-amber-50 via-rose-50 to-stone-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
          <div>
            <p className="text-xs tracking-[0.35em] text-amber-800/70 uppercase">
              dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-800">
              내 캡슐
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              묻힌 캡슐 {capsules.length}개 · 봉인 {sealedCount}개 · 열람 {openCount}개
            </p>
          </div>
          <Link
            href="/new"
            className="inline-flex items-center justify-center rounded-full bg-stone-800 px-6 py-3 text-sm font-medium text-amber-50"
          >
            캡슐 묻기
          </Link>
        </div>

        {listError ? <p className="mt-6 text-sm text-rose-600">{listError}</p> : null}

        {listLoading ? (
          <div className="mt-8 grid gap-4">
            <div className="h-28 animate-pulse rounded-3xl bg-white/70" />
            <div className="h-28 animate-pulse rounded-3xl bg-white/70" />
          </div>
        ) : null}

        {!listLoading && capsules.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-amber-100 bg-white/80 px-8 py-14 text-center">
            <p className="text-stone-600">아직 묻은 캡슐이 없어요</p>
            <Link href="/new" className="mt-4 inline-block text-sm text-amber-800">
              첫 캡슐 묻으러 가기
            </Link>
          </div>
        ) : null}

        <ul className="mt-8 grid gap-4">
          {capsules.map((capsule) => {
            const open = isCapsuleOpen(capsule.openAt);
            const cover = capsule.imageUrls[0];

            return (
              <li key={capsule.id}>
                <Link
                  href={`/capsule/${capsule.id}`}
                  className="flex gap-4 rounded-3xl border border-amber-100/80 bg-white/80 p-4 shadow-sm transition hover:bg-white"
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className={`h-24 w-24 shrink-0 rounded-2xl object-cover ${open ? "" : "blur-sm"}`}
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xs text-amber-800">
                      편지
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-800">
                      {capsule.to ? `${capsule.to}에게` : "이름 없는 캡슐"}
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      {formatOpenAt(capsule.openAt)}
                    </p>
                    <div className="mt-3">
                      <Countdown openAt={capsule.openAt} />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
