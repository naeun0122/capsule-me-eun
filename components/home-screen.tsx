"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getCountFromServer, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { CapsuleField } from "@/components/capsule-field";
import { SiteHeader } from "@/components/site-header";
import { WeatherHero, WeatherScene, useCurrentWeather } from "@/components/weather-scene";
import { authErrorMessage } from "@/lib/auth-error";
import { parseCapsule, type Capsule } from "@/lib/capsule";
import { saveCapsuleDraft } from "@/lib/capsule-draft";
import { getFirebaseFirestore } from "@/lib/firebase";
import { weatherAtmosphere } from "@/lib/weather";

export function HomeScreen() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const currentWeather = useCurrentWeather();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

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
        setCapsules(snapshot.docs.map((doc) => parseCapsule(doc)));
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
      <div className="relative min-h-full flex-1">
        <WeatherScene weather={currentWeather.weather} />
        <div className="relative z-10 flex min-h-full items-center justify-center">
          <div className="h-12 w-40 animate-pulse rounded-full bg-[#FBF7F0]/70" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <GuestLanding
        weather={currentWeather.weather}
        weatherStatus={currentWeather.status}
        pending={pending}
        error={error}
        onGoogleSignIn={() => void handleGoogleSignIn()}
      />
    );
  }

  const air = weatherAtmosphere(currentWeather.weather);

  return (
    <div className="relative min-h-full flex-1">
      <WeatherScene weather={currentWeather.weather} />
      <div className="relative z-10 mx-auto w-full max-w-xl pb-28">
        <SiteHeader />
        <main className="px-5">
          <header className="text-center">
            <p
              className="text-[11px] tracking-[0.28em] uppercase"
              style={{ color: air.muted }}
            >
              capsule me
            </p>
            <h1
              className="mt-2 font-serif text-4xl tracking-tight"
              style={{ color: air.ink }}
            >
              내 캡슐
            </h1>
            <p className="mt-2 text-sm" style={{ color: air.muted }}>
              {capsules.length}개의 기억
            </p>
          </header>

          <div className="mt-8">
            <WeatherHero
              weather={currentWeather.weather}
              status={currentWeather.status}
            />
          </div>

          {listError ? (
            <p className="pt-4 text-center text-sm text-rose-600">{listError}</p>
          ) : null}

          {listLoading ? (
            <p className="pt-16 text-center text-sm" style={{ color: air.muted }}>
              불러오는 중
            </p>
          ) : null}

          {!listLoading && capsules.length === 0 ? (
            <div className="pt-16 text-center">
              <p style={{ color: air.ink }}>아직 묻은 캡슐이 없어요</p>
              <Link
                href="/new"
                className="mt-4 inline-block text-sm underline decoration-stone-400 underline-offset-4"
                style={{ color: air.muted }}
              >
                첫 캡슐 묻기
              </Link>
            </div>
          ) : null}

          {!listLoading && capsules.length > 0 ? (
            <div className="mt-12">
              <CapsuleField capsules={capsules} now={now} />
            </div>
          ) : null}
        </main>
      </div>

      <Link
        href="/new"
        className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-stone-900 px-7 py-3 text-sm font-medium text-[#FBF7F0] shadow-lg"
      >
        새 캡슐
      </Link>
    </div>
  );
}

function GuestLanding({
  weather,
  weatherStatus,
  pending,
  error,
  onGoogleSignIn,
}: {
  weather: ReturnType<typeof useCurrentWeather>["weather"];
  weatherStatus: ReturnType<typeof useCurrentWeather>["status"];
  pending: boolean;
  error: string | null;
  onGoogleSignIn: () => void;
}) {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [letter, setLetter] = useState("");
  const [totalCapsules, setTotalCapsules] = useState<number | null>(null);
  const air = weatherAtmosphere(weather);

  useEffect(() => {
    let cancelled = false;

    void getCountFromServer(collection(getFirebaseFirestore(), "capsules"))
      .then((snapshot) => {
        if (!cancelled) {
          setTotalCapsules(snapshot.data().count);
        }
      })
      .catch((caught) => {
        console.error(caught);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCapsuleDraft({ to, letter, openAt: "" });
    router.push("/new");
  }

  return (
    <div className="relative min-h-full flex-1">
      <WeatherScene weather={weather} />
      <div className="relative z-10 mx-auto w-full max-w-xl">
        <SiteHeader />
        <main className="px-5 pb-16">
          <header className="text-center">
            <p
              className="text-[11px] tracking-[0.28em] uppercase"
              style={{ color: air.muted }}
            >
              capsule me
            </p>
            <h1
              className="mt-2 font-serif text-5xl tracking-tight"
              style={{ color: air.ink }}
            >
              캡슐 미
            </h1>
            <p
              className="mx-auto mt-3 max-w-xs text-sm leading-relaxed"
              style={{ color: air.muted }}
            >
              사진과 편지를 묻고, 열람일에 함께 열어요
            </p>
            <p className="mt-4 text-sm" style={{ color: air.ink }}>
              {totalCapsules == null ? (
                <span className="inline-block h-5 w-36 animate-pulse rounded-full bg-[#FBF7F0]/70 align-middle" />
              ) : totalCapsules === 0 ? (
                "아직 묻힌 캡슐이 없어요"
              ) : (
                <>지금까지 {totalCapsules.toLocaleString("ko-KR")}개의 캡슐</>
              )}
            </p>
          </header>

          <div className="mt-8">
            <WeatherHero weather={weather} status={weatherStatus} />
          </div>

          <form className="mt-8 flex flex-col gap-4" onSubmit={handleStart}>
            <div className="rounded-[1.75rem] bg-[#FBF7F0]/88 px-5 py-5 shadow-sm">
              <label className="flex flex-col gap-2 text-sm text-stone-600">
                누구에게
                <input
                  type="text"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  placeholder="미래의 나, 친구, 가족"
                  className="rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 text-stone-800"
                />
              </label>
              <label className="mt-4 flex flex-col gap-2 text-sm text-stone-600">
                편지
                <textarea
                  value={letter}
                  onChange={(event) => setLetter(event.target.value)}
                  rows={4}
                  placeholder="오늘을 남겨 두어요"
                  className="rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 text-stone-800"
                />
              </label>
            </div>

            <button
              type="submit"
              className="rounded-full bg-stone-900 px-8 py-3.5 text-sm font-medium text-[#FBF7F0]"
            >
              캡슐 묻기
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={pending}
              className="text-sm opacity-70 transition hover:opacity-100 disabled:opacity-50"
              style={{ color: air.ink }}
            >
              {pending ? "로그인 중..." : "이미 묻은 캡슐이 있다면 Google로 보기"}
            </button>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
