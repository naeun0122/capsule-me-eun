"use client";

import { useEffect, useMemo, useState } from "react";
import { WeatherMark } from "@/components/weather-mark";
import {
  requestCapsuleWeather,
  weatherAtmosphere,
  weatherKind,
  type CapsuleWeather,
} from "@/lib/weather";

export function useCurrentWeather() {
  const [weather, setWeather] = useState<CapsuleWeather | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    void requestCapsuleWeather()
      .then((next) => {
        if (cancelled) {
          return;
        }

        setWeather(next);
        setStatus(next ? "ready" : "error");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { weather, status };
}

export function WeatherScene({
  weather,
  className = "",
}: {
  weather: CapsuleWeather | null;
  className?: string;
}) {
  const air = weatherAtmosphere(weather);
  const wind = `${Math.max(18, 46 / air.wind)}s`;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(180deg, ${air.from} 0%, ${air.mid} 46%, ${air.to} 100%)`,
      }}
    >
      <div
        className="absolute -left-10 top-[8%] h-64 w-64 rounded-full blur-3xl"
        style={{ background: air.glow, opacity: air.kind === "rain" ? 0.18 : 0.45 }}
      />
      {air.kind === "sun" ? <SunGlow color={air.glow} /> : null}
      <Clouds kind={air.kind} duration={wind} />
      {air.kind === "rain" ? <Rain heavy={air.heavy} /> : null}
      {air.kind === "snow" ? <Snow /> : null}
      {air.humidity >= 70 ? <Fog opacity={air.humidity / 220} /> : null}
      {air.kind === "sun" ? <Dust /> : null}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}

export function WeatherHero({
  weather,
  status,
  compact = false,
}: {
  weather: CapsuleWeather | null;
  status: "loading" | "ready" | "error";
  compact?: boolean;
}) {
  const air = weatherAtmosphere(weather);

  if (status === "loading") {
    return (
      <div
        className={`mx-auto w-full rounded-[1.75rem] bg-[#FBF7F0]/80 ${compact ? "h-24" : "h-40"} animate-pulse`}
      />
    );
  }

  if (status === "error" || !weather) {
    return (
      <div className="mx-auto w-full rounded-[1.75rem] bg-[#FBF7F0]/80 px-6 py-6 text-center">
        <p className="text-sm" style={{ color: air.muted }}>
          위치를 허용하면 오늘의 하늘을 보여 줘요
        </p>
      </div>
    );
  }

  const kind = weatherKind(weather);

  return (
    <section className="mx-auto w-full rounded-[1.75rem] bg-[#FBF7F0]/88 px-6 py-6 text-center shadow-sm">
      <div className="flex justify-center">
        <WeatherMark kind={kind} size={compact ? "sm" : "lg"} />
      </div>
      <p
        className={`font-serif tracking-tight ${compact ? "mt-2 text-3xl" : "mt-3 text-5xl"}`}
        style={{ color: air.ink }}
      >
        {weather.temperature != null ? `${weather.temperature}°` : weather.sky}
      </p>
      <p className="mt-1 text-sm" style={{ color: air.muted }}>
        {weather.sky}
        {weather.place ? ` · ${weather.place}` : ""}
      </p>
    </section>
  );
}

export function WeatherHud({
  weather,
  status,
}: {
  weather: CapsuleWeather | null;
  status: "loading" | "ready" | "error";
}) {
  return <WeatherHero weather={weather} status={status} compact />;
}

function SunGlow({ color }: { color: string }) {
  return (
    <div className="absolute right-[8%] top-[6%] h-44 w-44">
      <div
        className="sun-pulse absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        }}
      />
    </div>
  );
}

function Clouds({ kind, duration }: { kind: string; duration: string }) {
  const clouds = useMemo(
    () => [
      { top: "8%", left: "-8%", width: "46%", delay: "0s", opacity: 0.35 },
      { top: "16%", left: "38%", width: "40%", delay: "-12s", opacity: 0.28 },
      { top: "28%", left: "8%", width: "52%", delay: "-22s", opacity: 0.22 },
      { top: "12%", left: "62%", width: "34%", delay: "-7s", opacity: 0.3 },
    ],
    [],
  );

  if (kind === "sun") {
    return null;
  }

  const extra = kind === "overcast" || kind === "rain" ? 0.22 : 0;

  return (
    <>
      {clouds.map((cloud, index) => (
        <div
          key={index}
          className="cloud-drift absolute h-24 rounded-[100%] bg-white blur-xl"
          style={{
            top: cloud.top,
            left: cloud.left,
            width: cloud.width,
            opacity: cloud.opacity + extra,
            animationDuration: duration,
            animationDelay: cloud.delay,
          }}
        />
      ))}
    </>
  );
}

function Rain({ heavy }: { heavy: boolean }) {
  return (
    <div
      className={`weather-rain absolute inset-0 ${heavy ? "opacity-80" : "opacity-55"}`}
    />
  );
}

function Snow() {
  return <div className="weather-snow absolute inset-0 opacity-80" />;
}

function Fog({ opacity }: { opacity: number }) {
  return (
    <div
      className="fog-drift absolute inset-x-[-10%] bottom-0 h-2/5 bg-white blur-3xl"
      style={{ opacity }}
    />
  );
}

function Dust() {
  return <div className="weather-dust absolute inset-0 opacity-50" />;
}
