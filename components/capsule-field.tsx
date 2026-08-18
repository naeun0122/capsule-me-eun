"use client";

import Link from "next/link";
import { ddayLabel, isCapsuleOpen, type Capsule } from "@/lib/capsule";
import { moodFromWeather } from "@/lib/capsule-mood";
import { WeatherCapsuleVisual } from "@/components/weather-capsule";

export function CapsuleField({
  capsules,
  now,
}: {
  capsules: Capsule[];
  now: number;
}) {
  const ordered = [...(capsules ?? [])].sort((left, right) => {
    const leftTime = left.openAt ? new Date(left.openAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.openAt ? new Date(right.openAt).getTime() : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });

  return (
    <ul className="mx-auto grid w-full max-w-md grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3">
      {ordered.map((capsule) => {
        const open = isCapsuleOpen(capsule.openAt, now);
        const mood =
          capsule.mood ??
          (capsule.weather ? moodFromWeather(capsule.weather) : null);

        return (
          <li key={capsule.id} className="text-center">
            <Link href={`/capsule/${capsule.id}`} className="group inline-flex flex-col items-center">
              <div className="transition duration-300 group-hover:scale-105">
                {mood ? (
                  <WeatherCapsuleVisual mood={mood} size="sm" floating />
                ) : (
                  <div className="h-[92px] w-[92px] rounded-2xl bg-[#FBF7F0]/80" />
                )}
              </div>
              <p className="mt-2 max-w-28 truncate text-sm font-medium text-stone-800">
                {capsule.to || mood?.name || "이름 없는 캡슐"}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  open ? "font-medium text-emerald-800" : "text-stone-500"
                }`}
              >
                {ddayLabel(capsule.openAt, now)}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
