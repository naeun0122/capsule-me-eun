import type { DocumentData } from "firebase/firestore";
import { parseCapsuleMood, type CapsuleMood } from "@/lib/capsule-mood";
import { parseCapsuleWeather, type CapsuleWeather } from "@/lib/weather";

export type Capsule = {
  id: string;
  ownerId: string;
  to: string;
  letter: string;
  openAt: string | null;
  imageUrls: string[];
  imagePaths: string[];
  weather: CapsuleWeather | null;
  mood: CapsuleMood | null;
};

export function parseCapsule(snapshot: {
  id: string;
  data: () => DocumentData | undefined;
}): Capsule {
  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    ownerId: typeof data.ownerId === "string" ? data.ownerId : "",
    to: typeof data.to === "string" ? data.to : "",
    letter: typeof data.letter === "string" ? data.letter : "",
    openAt: typeof data.openAt === "string" ? data.openAt : null,
    imageUrls: Array.isArray(data.imageUrls)
      ? data.imageUrls.filter((url: unknown) => typeof url === "string")
      : [],
    imagePaths: Array.isArray(data.imagePaths)
      ? data.imagePaths.filter((path: unknown) => typeof path === "string")
      : [],
    weather: parseCapsuleWeather(data.weather),
    mood: parseCapsuleMood(data.mood),
  };
}

export function isCapsuleOpen(openAt: string | null, now = Date.now()) {
  if (!openAt) {
    return true;
  }

  return new Date(openAt).getTime() <= now;
}

export function countdownParts(openAt: string | null, now = Date.now()) {
  if (!openAt) {
    return { unlocked: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const remaining = new Date(openAt).getTime() - now;

  if (remaining <= 0) {
    return { unlocked: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(remaining / 1000);

  return {
    unlocked: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function ddayLabel(openAt: string | null, now = Date.now()) {
  if (!openAt || isCapsuleOpen(openAt, now)) {
    return "OPEN";
  }

  const days = Math.ceil((new Date(openAt).getTime() - now) / 86400000);

  if (days <= 0) {
    return "D-DAY";
  }

  return `D-${days}`;
}

export function ddayUrgency(openAt: string | null, now = Date.now()) {
  if (!openAt || isCapsuleOpen(openAt, now)) {
    return 1;
  }

  const days = Math.max(0, (new Date(openAt).getTime() - now) / 86400000);
  const t = Math.min(days / 160, 1);

  return 1 - t ** 0.62;
}

export function formatOpenAt(openAt: string | null) {
  if (!openAt) {
    return "열람일 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(openAt));
}
