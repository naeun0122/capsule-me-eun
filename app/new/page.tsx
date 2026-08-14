"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { getFirebaseFirestore, getFirebaseStorage } from "@/lib/firebase";

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
};

function NewCapsuleForm() {
  const { user, loading } = useAuth();
  const [to, setTo] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buried, setBuried] = useState<BuriedCapsule | null>(null);

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || loading) {
      return;
    }

    if (!user) {
      alert("로그인 먼저!");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const storage = getFirebaseStorage();
      const db = getFirebaseFirestore();
      const stamp = Date.now();
      const images: { path: string; url: string }[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const path = `${user.uid}/${stamp}-${index}.${fileExtension(file)}`;
        const objectRef = ref(storage, path);
        await uploadBytes(objectRef, file);
        images.push({
          path,
          url: await getDownloadURL(objectRef),
        });
      }

      const docRef = await addDoc(collection(db, "capsules"), {
        ownerId: user.uid,
        to,
        letter,
        openAt: openAt ? new Date(openAt).toISOString() : null,
        imagePaths: images.map((image) => image.path),
        imageUrls: images.map((image) => image.url),
        createdAt: serverTimestamp(),
      });

      setBuried({
        id: docRef.id,
        to,
        imageCount: images.length,
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
      <div className="min-h-full flex-1 bg-gradient-to-b from-amber-50 via-rose-50 to-stone-100">
        <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-16">
        <p className="text-xs tracking-[0.35em] text-amber-800/70 uppercase">
          buried
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-800">
          캡슐을 묻었어요
        </h1>
        <p className="mt-4 text-stone-500">
          {buried.to ? `${buried.to}에게 보내는 편지` : "편지"}와 사진{" "}
          {buried.imageCount}장이 Firestore에 연결됐습니다.
        </p>
        <p className="mt-2 break-all text-sm text-stone-400">캡슐 번호: {buried.id}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/capsule/${buried.id}`}
            className="inline-flex items-center justify-center rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium text-amber-50"
          >
            캡슐 보러 가기
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center text-sm text-stone-400 hover:text-stone-600"
          >
            대시보드로
          </Link>
        </div>
      </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-full flex-1 bg-gradient-to-b from-amber-50 via-rose-50 to-stone-100">
      <SiteHeader />
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-16">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
        캡슐 묻기
      </h1>

      <form
        className="mt-8 flex flex-col gap-5"
        onSubmit={handleSubmit}
        aria-busy={submitting}
      >
        <label className="flex flex-col gap-2 text-sm text-stone-600">
          받는사람
          <input
            type="text"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            disabled={submitting}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-stone-600">
          편지
          <textarea
            value={letter}
            onChange={(event) => setLetter(event.target.value)}
            rows={8}
            disabled={submitting}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-stone-600">
          열람일
          <input
            type="datetime-local"
            value={openAt}
            onChange={(event) => setOpenAt(event.target.value)}
            disabled={submitting}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-stone-600">
          사진
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={submitting}
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

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium text-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "업로드 되는 중" : "캡슐묻기"}
        </button>
      </form>

      {submitting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm">
          <div className="rounded-3xl bg-white px-10 py-8 text-center shadow-xl">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
            <p className="mt-4 text-sm font-medium text-stone-700">
              업로드 되는 중
            </p>
          </div>
        </div>
      ) : null}
    </main>
    </div>
  );
}

export default function NewPage() {
  return <NewCapsuleForm />;
}
