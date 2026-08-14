"use client";

import { useEffect, useState } from "react";
import { countdownParts } from "@/lib/capsule";

export function Countdown({ openAt }: { openAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = countdownParts(openAt, now);

  if (parts.unlocked) {
    return (
      <p className="text-sm font-medium text-emerald-700">열 수 있어요</p>
    );
  }

  return (
    <p className="font-medium tracking-wide text-amber-800">
      {parts.days > 0 ? `${parts.days}일 ` : ""}
      {String(parts.hours).padStart(2, "0")}:
      {String(parts.minutes).padStart(2, "0")}:
      {String(parts.seconds).padStart(2, "0")}
    </p>
  );
}
