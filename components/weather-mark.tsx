"use client";

import type { WeatherKind } from "@/lib/weather";

const SIZE = {
  sm: 44,
  md: 88,
  lg: 128,
} as const;

export function WeatherMark({
  kind,
  size = "md",
}: {
  kind: WeatherKind;
  size?: keyof typeof SIZE;
}) {
  const dim = SIZE[size];

  return (
    <svg
      viewBox="0 0 100 100"
      width={dim}
      height={dim}
      aria-hidden="true"
      className="overflow-visible"
    >
      {kind === "sun" ? <SunMark /> : null}
      {kind === "cloud" ? <PartlyMark /> : null}
      {kind === "overcast" ? <CloudMark /> : null}
      {kind === "rain" ? <RainMark /> : null}
      {kind === "snow" ? <SnowMark /> : null}
    </svg>
  );
}

function SunMark() {
  return (
    <g>
      <g
        className="sun-pulse"
        stroke="#E8A317"
        strokeLinecap="round"
        strokeWidth="3.2"
        style={{ transformOrigin: "50px 50px" }}
      >
        <line x1="50" y1="8" x2="50" y2="18" />
        <line x1="50" y1="82" x2="50" y2="92" />
        <line x1="8" y1="50" x2="18" y2="50" />
        <line x1="82" y1="50" x2="92" y2="50" />
        <line x1="21" y1="21" x2="28" y2="28" />
        <line x1="72" y1="72" x2="79" y2="79" />
        <line x1="79" y1="21" x2="72" y2="28" />
        <line x1="28" y1="72" x2="21" y2="79" />
      </g>
      <circle cx="50" cy="50" r="22" fill="#F5C542" />
      <circle cx="50" cy="50" r="16" fill="#FFE08A" />
      <circle cx="43" cy="44" r="5" fill="#FFF6D6" opacity="0.85" />
    </g>
  );
}

function PartlyMark() {
  return (
    <g>
      <circle cx="38" cy="42" r="16" fill="#F5C542" />
      <path
        d="M28 70 C16 70 14 56 24 52 C26 38 44 34 54 44 C62 32 82 36 82 52 C92 54 94 70 80 70 Z"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="1.6"
      />
    </g>
  );
}

function CloudMark() {
  return (
    <g>
      <path
        d="M24 68 C12 68 10 52 22 48 C24 32 44 28 54 40 C64 26 88 32 86 50 C98 52 98 68 82 68 Z"
        fill="#E2E8F0"
        stroke="#94A3B8"
        strokeWidth="1.6"
      />
      <path
        d="M30 74 C20 74 18 62 28 60 C30 50 46 48 54 56 C62 46 80 50 78 62 C88 64 88 74 76 74 Z"
        fill="#F1F5F9"
        opacity="0.9"
      />
    </g>
  );
}

function RainMark() {
  return (
    <g>
      <path
        d="M22 48 C12 48 10 34 22 30 C24 16 44 12 54 24 C64 12 86 18 84 34 C96 36 96 50 80 50 Z"
        fill="#94A3B8"
        stroke="#64748B"
        strokeWidth="1.6"
      />
      <g fill="#38BDF8" stroke="#0EA5E9" strokeWidth="0.8">
        <path d="M32 58 L28 74 Q32 78 36 74 Z" />
        <path d="M50 60 L46 80 Q50 84 54 80 Z" />
        <path d="M68 58 L64 74 Q68 78 72 74 Z" />
      </g>
    </g>
  );
}

function SnowMark() {
  return (
    <g>
      <path
        d="M22 46 C12 46 10 32 22 28 C24 14 44 10 54 22 C64 10 86 16 84 32 C96 34 96 48 80 48 Z"
        fill="#E2E8F0"
        stroke="#94A3B8"
        strokeWidth="1.6"
      />
      <g fill="none" stroke="#F8FAFC" strokeLinecap="round" strokeWidth="2">
        <path d="M32 62 L32 76 M25 69 L39 69 M27 64 L37 74 M37 64 L27 74" />
        <path d="M52 66 L52 82 M44 74 L60 74 M46 68 L58 80 M58 68 L46 80" />
        <path d="M72 60 L72 74 M65 67 L79 67 M67 62 L77 72 M77 62 L67 72" />
      </g>
    </g>
  );
}
