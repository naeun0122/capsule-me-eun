"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Countdown } from "@/components/countdown";
import { SiteHeader } from "@/components/site-header";
import {
  KeywordPills,
  WeatherCapsuleVisual,
} from "@/components/weather-capsule";
import { WeatherMark } from "@/components/weather-mark";
import { WeatherScene } from "@/components/weather-scene";
import {
  formatOpenAt,
  isCapsuleOpen,
  parseCapsule,
  type Capsule,
} from "@/lib/capsule";
import { getFirebaseFirestore } from "@/lib/firebase";
import { weatherKind } from "@/lib/weather";

const isDev = process.env.NODE_ENV === "development";

function CapsuleContents({ capsule }: { capsule: Capsule }) {
  return (
    <div className="mt-8 rounded-[1.75rem] bg-[#FBF7F0]/88 px-6 py-8 shadow-sm sm:px-8">
      {capsule.mood ? (
        <p className="text-center text-base leading-relaxed text-stone-600">
          {capsule.mood.phrase}
        </p>
      ) : null}
      <p className="mt-6 text-center text-[11px] tracking-[0.28em] text-stone-400 uppercase">
        letter
      </p>
      <p className="mt-4 whitespace-pre-wrap text-center text-lg leading-relaxed text-stone-700">
        {capsule.letter || "편지가 비어 있어요"}
      </p>
      {capsule.imageUrls.length > 0 ? (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {capsule.imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-44 w-44 rounded-2xl object-cover shadow-sm"
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
    <div className="relative min-h-full flex-1">
      <WeatherScene weather={capsule?.weather ?? null} />
      <div className="relative z-10">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-5 pb-16">
        {loading || status === "loading" ? (
          <div className="mt-10 h-64 animate-pulse rounded-[1.75rem] bg-[#FBF7F0]/70" />
        ) : null}

        {status === "missing" ? (
          <div className="mt-10 rounded-[1.75rem] bg-[#FBF7F0]/88 px-8 py-12 text-center">
            <p className="text-stone-600">캡슐을 찾을 수 없어요</p>
            <Link href="/" className="mt-4 inline-block text-sm text-stone-500">
              내 캡슐로
            </Link>
          </div>
        ) : null}

        {status === "ready" && capsule && !user ? (
          <div className="mt-10 rounded-[1.75rem] bg-[#FBF7F0]/88 px-8 py-12 text-center">
            <p className="text-stone-600">캡슐을 보려면 로그인해 주세요</p>
            <Link href="/" className="mt-4 inline-block text-sm text-stone-500">
              홈으로
            </Link>
          </div>
        ) : null}

        {status === "ready" && capsule && user && !isOwner ? (
          <div className="mt-10 rounded-[1.75rem] bg-[#FBF7F0]/88 px-8 py-12 text-center">
            <p className="text-stone-600">이 캡슐은 다른 사람의 것입니다</p>
            <Link href="/" className="mt-4 inline-block text-sm text-stone-500">
              내 캡슐로
            </Link>
          </div>
        ) : null}

        {status === "ready" && capsule && isOwner ? (
          <article className="mt-2">
            <Link href="/" className="text-sm text-stone-400 hover:text-stone-600">
              ← 내 캡슐
            </Link>

            <div className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-[#FBF7F0]/88 px-6 pb-8 pt-10 text-center shadow-sm">
              <div className="flex justify-center">
                {capsule.mood ? (
                  <WeatherCapsuleVisual mood={capsule.mood} size="lg" floating />
                ) : capsule.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capsule.imageUrls[0]}
                    alt=""
                    className={`h-44 w-44 rounded-2xl object-cover ${revealed ? "" : "blur-md"}`}
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-amber-50">
                    <span className="text-sm text-stone-400">봉인</span>
                  </div>
                )}
              </div>
              {capsule.weather ? (
                <div className="mt-5 flex items-center justify-center gap-2 text-sm text-stone-600">
                  <WeatherMark kind={weatherKind(capsule.weather)} size="sm" />
                  <span>
                    {capsule.weather.sky}
                    {capsule.weather.temperature != null
                      ? ` ${capsule.weather.temperature}°`
                      : ""}
                    {capsule.weather.place ? ` · ${capsule.weather.place}` : ""}
                  </span>
                </div>
              ) : null}
              <p className="mt-5 text-[11px] tracking-[0.28em] text-stone-400 uppercase">
                {capsule.mood?.name ?? "capsule"}
              </p>
              <h1 className="mt-2 font-serif text-3xl tracking-tight text-stone-800">
                {capsule.to ? `${capsule.to}에게` : "이름 없는 캡슐"}
              </h1>
              <p className="mt-2 text-sm text-stone-500">
                {formatOpenAt(capsule.openAt)}
              </p>
              {capsule.mood?.keywords.length ? (
                <KeywordPills
                  keywords={capsule.mood.keywords}
                  className="mt-5 justify-center"
                />
              ) : null}
              {!revealed && capsule.mood ? (
                <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-stone-500">
                  {capsule.mood.phrase}
                </p>
              ) : null}
            </div>

            {revealed ? (
              <>
                {isDev && devPreview && !open ? (
                  <p className="mt-4 text-center text-xs text-stone-500">
                    개발 미리보기 · 실제 열람일은 아직 남았습니다
                  </p>
                ) : null}
                <CapsuleContents capsule={capsule} />
              </>
            ) : (
              <div className="mt-8 rounded-[1.75rem] bg-[#FBF7F0]/88 px-6 py-12 text-center shadow-sm">
                <p className="font-serif text-xl text-stone-800">아직 열 수 없어요</p>
                <p className="mt-2 text-sm text-stone-400">
                  열람일이 되면 편지와 사진을 볼 수 있어요
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
    </div>
  );
}
