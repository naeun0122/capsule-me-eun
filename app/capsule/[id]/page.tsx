"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
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

const isDev = process.env.NODE_ENV === "development";

function CapsuleContents({ capsule }: { capsule: Capsule }) {
  return (
    <div className="mt-8 rounded-3xl border border-amber-100/80 bg-white/80 px-6 py-8 shadow-sm sm:px-8">
      <p className="text-xs tracking-[0.3em] text-amber-800/60 uppercase">letter</p>
      <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-stone-700">
        {capsule.letter || "편지가 비어 있어요"}
      </p>
      {capsule.imageUrls.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {capsule.imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-44 w-44 rounded-3xl object-cover shadow-sm"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [status, setStatus] = useState<"loading" | "missing" | "ready">("loading");
  const [devPreview, setDevPreview] = useState(false);

  useEffect(() => {
    setDevPreview(false);

    const unsubscribe = onSnapshot(
      doc(getFirebaseFirestore(), "capsules", id),
      (snapshot) => {
        if (!snapshot.exists()) {
          setCapsule(null);
          setStatus("missing");
          return;
        }

        setCapsule(parseCapsule(snapshot));
        setStatus("ready");
      },
      () => {
        setStatus("missing");
      },
    );

    return unsubscribe;
  }, [id]);

  const open = capsule ? isCapsuleOpen(capsule.openAt) : false;
  const isOwner = Boolean(user && capsule && user.uid === capsule.ownerId);
  const revealed = open || (isDev && devPreview);

  return (
    <div className="min-h-full flex-1 bg-gradient-to-b from-amber-50 via-rose-50 to-stone-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-6 pb-16">
        {loading || status === "loading" ? (
          <div className="mt-10 h-64 animate-pulse rounded-3xl bg-white/70" />
        ) : null}

        {status === "missing" ? (
          <div className="mt-10 rounded-3xl bg-white/80 px-8 py-12 text-center">
            <p className="text-stone-600">캡슐을 찾을 수 없어요</p>
            <Link href="/" className="mt-4 inline-block text-sm text-amber-800">
              대시보드로
            </Link>
          </div>
        ) : null}

        {status === "ready" && capsule && !user ? (
          <div className="mt-10 rounded-3xl bg-white/80 px-8 py-12 text-center">
            <p className="text-stone-600">캡슐을 보려면 로그인해 주세요</p>
            <Link href="/" className="mt-4 inline-block text-sm text-amber-800">
              홈으로
            </Link>
          </div>
        ) : null}

        {status === "ready" && capsule && user && !isOwner ? (
          <div className="mt-10 rounded-3xl bg-white/80 px-8 py-12 text-center">
            <p className="text-stone-600">이 캡슐은 다른 사람의 것입니다</p>
            <Link href="/" className="mt-4 inline-block text-sm text-amber-800">
              대시보드로
            </Link>
          </div>
        ) : null}

        {status === "ready" && capsule && isOwner ? (
          <article className="mt-4">
            <Link href="/" className="text-sm text-stone-400 hover:text-stone-600">
              ← 대시보드
            </Link>

            <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-amber-100/80 bg-white/70 shadow-xl shadow-amber-900/5">
              {capsule.imageUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capsule.imageUrls[0]}
                  alt=""
                  className={`h-56 w-full object-cover sm:h-72 ${revealed ? "" : "scale-105 blur-md"}`}
                />
              ) : (
                <div className="flex h-56 items-center justify-center bg-gradient-to-br from-amber-100 to-rose-100 sm:h-72">
                  <span className="text-sm tracking-[0.4em] text-amber-800/50 uppercase">
                    sealed
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/55 via-stone-900/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 text-white">
                <p className="text-xs tracking-[0.35em] text-white/70 uppercase">
                  capsule
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  {capsule.to ? `${capsule.to}에게` : "이름 없는 캡슐"}
                </h1>
                <p className="mt-2 text-sm text-white/75">{formatOpenAt(capsule.openAt)}</p>
              </div>
            </div>

            {revealed ? (
              <>
                {isDev && devPreview && !open ? (
                  <p className="mt-4 text-center text-xs text-stone-400">
                    개발 미리보기 · 실제 열람일은 아직 남았습니다
                  </p>
                ) : null}
                <CapsuleContents capsule={capsule} />
              </>
            ) : (
              <div className="mt-8 rounded-[2rem] border border-dashed border-amber-200 bg-white/60 px-6 py-12 text-center">
                <p className="text-lg font-medium text-stone-700">아직 기간이 남았어요</p>
                <p className="mt-2 text-sm text-stone-400">
                  열람일이 되어야 편지와 사진을 볼 수 있어요
                </p>
                <div className="mt-6 text-2xl">
                  <Countdown openAt={capsule.openAt} />
                </div>

                {isDev ? (
                  <button
                    type="button"
                    onClick={() => setDevPreview(true)}
                    className="mt-10 text-xs text-stone-300/80 transition hover:text-stone-400"
                  >
                    바로보기
                  </button>
                ) : null}
              </div>
            )}
          </article>
        ) : null}
      </main>
    </div>
  );
}
