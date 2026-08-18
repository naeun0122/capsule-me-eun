"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { User } from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { SiteHeader } from "@/components/site-header";
import { WeatherCapsuleVisual, KeywordPills } from "@/components/weather-capsule";
import { WeatherHero, WeatherScene, useCurrentWeather } from "@/components/weather-scene";
import { authErrorMessage } from "@/lib/auth-error";
import { clearCapsuleDraft, readCapsuleDraft } from "@/lib/capsule-draft";
import { parseCapsuleMood, type CapsuleMood } from "@/lib/capsule-mood";
import { getFirebaseFirestore, getFirebaseStorage } from "@/lib/firebase";
import { requestCapsuleWeather, type CapsuleWeather } from "@/lib/weather";
import { trackEvent } from "@/lib/ga";

function fileExtension(file: File) {
  const mimeSubtype = file.type.split("/")[1]?.split("+")[0];
  if (mimeSubtype && /^[a-z0-9]+$/i.test(mimeSubtype)) {
    return mimeSubtype === "jpeg" ? "jpg" : mimeSubtype.toLowerCase();
  }
  return "bin";
}

type BuriedCapsule = {
  id: string;
  to: string;
  imageCount: number;
  mood: CapsuleMood | null;
};

function NewCapsuleForm() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [to, setTo] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buried, setBuried] = useState<BuriedCapsule | null>(null);
  const { weather, status: weatherStatus } = useCurrentWeather();

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  useEffect(() => {
    const draft = readCapsuleDraft();

    if (!draft) {
      return;
    }

    setTo((current) => current || draft.to);
    setLetter((current) => current || draft.letter);
    setOpenAt((current) => current || draft.openAt);
    clearCapsuleDraft();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || loading || signingIn) {
      return;
    }

    setError(null);

    let actor = user;

    if (!actor) {
      setLoginPrompt(true);
      setSigningIn(true);

      try {
        actor = await signInWithGoogle();
      } catch (caught) {
        setError(authErrorMessage(caught));
        setSigningIn(false);
        return;
      }

      setSigningIn(false);
      setLoginPrompt(false);
    }

    await buryCapsule(actor);
  }

  async function handleLoginAndBury() {
    if (submitting || loading || signingIn) {
      return;
    }

    setError(null);
    setSigningIn(true);

    try {
      const actor = await signInWithGoogle();
      setSigningIn(false);
      setLoginPrompt(false);
      await buryCapsule(actor);
    } catch (caught) {
      setError(authErrorMessage(caught));
      setSigningIn(false);
    }
  }

  async function buryCapsule(actor: User) {
    setError(null);
    setSubmitting(true);

    try {
      const storage = getFirebaseStorage();
      const db = getFirebaseFirestore();
      const stamp = Date.now();
      const images: { path: string; url: string }[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const path = `${actor.uid}/${stamp}-${index}.${fileExtension(file)}`;
        const objectRef = ref(storage, path);
        await uploadBytes(objectRef, file);
        images.push({
          path,
          url: await getDownloadURL(objectRef),
        });
      }

      let snapshotWeather = weather;
      let mood: CapsuleMood | null = null;

      try {
        snapshotWeather = (await requestCapsuleWeather()) ?? weather;
      } catch (weatherError) {
        console.error(weatherError);
      }

      try {
        mood = await requestCapsuleMood({
          weather: snapshotWeather,
          letter,
          to,
        });
      } catch (moodError) {
        console.error(moodError);
      }

      const docRef = await addDoc(collection(db, "capsules"), {
        ownerId: actor.uid,
        to,
        letter,
        openAt: openAt ? new Date(openAt).toISOString() : null,
        imagePaths: images.map((image) => image.path),
        imageUrls: images.map((image) => image.url),
        weather: snapshotWeather,
        mood,
        createdAt: serverTimestamp(),
      });

      setBuried({
        id: docRef.id,
        to,
        imageCount: images.length,
        mood,
      });
      trackEvent("capsule_bury", {
        image_count: images.length,
        has_open_at: Boolean(openAt),
      });
    } catch (caught) {
      console.error(caught);
      setError("업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (buried) {
    return (
      <div className="relative min-h-full flex-1">
        <WeatherScene weather={weather} />
        <div className="relative z-10">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-16">
            <p className="text-center text-[11px] tracking-[0.28em] text-stone-500 uppercase">
              buried
            </p>
            <h1 className="mt-3 text-center font-serif text-3xl tracking-tight text-stone-800">
              캡슐을 묻었어요
            </h1>
            {buried.mood ? (
              <div className="mt-8 flex flex-col items-center">
                <WeatherCapsuleVisual mood={buried.mood} size="md" floating />
                <p className="mt-4 text-sm font-medium text-stone-800">
                  {buried.mood.name}
                </p>
                <p className="mt-2 text-center text-sm text-stone-700/80">
                  {buried.mood.phrase}
                </p>
                <KeywordPills
                  keywords={buried.mood.keywords}
                  className="mt-4 justify-center"
                />
              </div>
            ) : null}
            <p className="mt-6 text-center text-stone-600">
              {buried.to ? `${buried.to}에게 보내는 편지` : "편지"}를 묻어 두었어요
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href={`/capsule/${buried.id}`}
                className="inline-flex items-center justify-center rounded-full bg-stone-900/90 px-8 py-3.5 text-sm font-medium text-amber-50"
              >
                캡슐 보러 가기
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center text-sm text-stone-700/70 hover:text-stone-900"
              >
                내 캡슐 보기
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full flex-1">
      <WeatherScene weather={weather} />
      <div className="relative z-10">
      <SiteHeader />
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-16">
      <header className="text-center">
        <h1 className="font-serif text-3xl tracking-tight text-stone-800">
          새 캡슐
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          지금 이 날씨와 함께 묻혀요
        </p>
      </header>

      <div className="mt-8">
        <WeatherHero weather={weather} status={weatherStatus} />
      </div>

      <form
        className="mt-8 flex flex-col gap-5 rounded-[1.75rem] bg-[#FBF7F0]/88 px-5 py-6 shadow-sm"
        onSubmit={handleSubmit}
        aria-busy={submitting || signingIn}
      >
        <label className="flex flex-col gap-2 text-sm text-stone-600">
          받는사람
          <input
            type="text"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            disabled={submitting || signingIn}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-stone-600">
          편지
          <textarea
            value={letter}
            onChange={(event) => setLetter(event.target.value)}
            rows={8}
            disabled={submitting || signingIn}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-stone-600">
          열람일
          <input
            type="datetime-local"
            value={openAt}
            onChange={(event) => setOpenAt(event.target.value)}
            disabled={submitting || signingIn}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-stone-600">
          사진
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={submitting || signingIn}
            onChange={(event) =>
              setFiles(Array.from(event.target.files ?? []))
            }
            className="text-stone-700 disabled:opacity-60"
          />
        </label>

        {previews.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {previews.map((url, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${files[index]?.lastModified}-${index}`}
                src={url}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ))}
          </div>
        ) : null}

        {error && !loginPrompt ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || signingIn}
          className="mt-2 rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium text-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "묻는 중" : "캡슐 묻기"}
        </button>
      </form>

      {loginPrompt && !submitting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white px-8 py-10 text-center shadow-xl">
            <p className="text-lg font-medium text-stone-800">
              이 캡슐을 묻어둘까요?
            </p>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              편지와 사진은 Google 계정에만 저장돼요. 로그인하면 바로 묻혀요.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3">
              <GoogleSignInButton
                pending={signingIn}
                onClick={() => void handleLoginAndBury()}
              >
                {signingIn ? "로그인 중..." : "Google로 로그인하고 묻기"}
              </GoogleSignInButton>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button
                type="button"
                onClick={() => {
                  setLoginPrompt(false);
                  setSigningIn(false);
                }}
                className="text-sm text-stone-400 hover:text-stone-600"
              >
                조금 더 적을게요
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {submitting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm">
          <div className="rounded-3xl bg-white px-10 py-8 text-center shadow-xl">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
            <p className="mt-4 text-sm font-medium text-stone-700">
              묻는 중
            </p>
          </div>
        </div>
      ) : null}
    </main>
      </div>
    </div>
  );
}

export default function NewPage() {
  return <NewCapsuleForm />;
}

async function requestCapsuleMood(input: {
  weather: CapsuleWeather | null;
  letter: string;
  to: string;
}): Promise<CapsuleMood | null> {
  const response = await fetch("/api/capsule-mood", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return null;
  }

  return parseCapsuleMood(await response.json());
}
