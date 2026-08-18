"use client";

import { useId } from "react";
import type { CapsuleMood, CapsuleShape } from "@/lib/capsule-mood";

const SIZE = {
  sm: 92,
  md: 140,
  lg: 196,
} as const;

type RelicKind = "chest" | "clock" | "box" | "locket" | "hourglass" | "tin";

export function WeatherCapsuleVisual({
  mood,
  size = "md",
  floating = false,
}: {
  mood: CapsuleMood;
  size?: keyof typeof SIZE;
  floating?: boolean;
}) {
  const rawId = useId().replace(/:/g, "");
  const dim = SIZE[size];
  const relic = relicKind(mood.shape);

  return (
    <div
      className={floating ? "capsule-float" : undefined}
      style={{ width: dim, height: dim }}
    >
      <svg
        viewBox="0 0 100 108"
        width={dim}
        height={dim}
        aria-hidden="true"
        className="overflow-visible drop-shadow-lg"
      >
        <defs>
          <linearGradient id={`${rawId}-body`} x1="18%" y1="8%" x2="86%" y2="100%">
            <stop offset="0%" stopColor={mood.palette.from} />
            <stop offset="100%" stopColor={mood.palette.to} />
          </linearGradient>
          <radialGradient id={`${rawId}-shine`} cx="30%" cy="24%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="100" rx="22" ry="4.5" fill="#1c1917" opacity="0.16" />
        {relic === "chest" ? (
          <Chest id={rawId} accent={mood.palette.accent} />
        ) : null}
        {relic === "clock" ? (
          <Clock id={rawId} accent={mood.palette.accent} />
        ) : null}
        {relic === "box" ? (
          <LetterBox id={rawId} accent={mood.palette.accent} />
        ) : null}
        {relic === "locket" ? (
          <Locket id={rawId} accent={mood.palette.accent} />
        ) : null}
        {relic === "hourglass" ? (
          <Hourglass id={rawId} accent={mood.palette.accent} />
        ) : null}
        {relic === "tin" ? (
          <Tin id={rawId} accent={mood.palette.accent} />
        ) : null}
      </svg>
    </div>
  );
}

export function KeywordPills({
  keywords,
  className = "",
}: {
  keywords: string[];
  className?: string;
}) {
  if (keywords.length === 0) {
    return null;
  }

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {keywords.map((keyword) => (
        <li
          key={keyword}
          className="rounded-full bg-[#FBF7F0]/80 px-3 py-1 text-[11px] tracking-wide text-stone-600"
        >
          {keyword}
        </li>
      ))}
    </ul>
  );
}

function relicKind(shape: CapsuleShape): RelicKind {
  switch (shape) {
    case "clock":
    case "sun":
      return "clock";
    case "chest":
    case "drop":
      return "chest";
    case "locket":
    case "crystal":
      return "locket";
    case "box":
    case "cloud":
      return "box";
    case "tin":
    case "petal":
      return "tin";
    default:
      return "hourglass";
  }
}

function Chest({ id, accent }: { id: string; accent: string }) {
  return (
    <g>
      <path
        d="M18 50 L82 50 L76 92 L24 92 Z"
        fill={`url(#${id}-body)`}
        stroke="#5C4033"
        strokeWidth="1.6"
      />
      <path
        d="M16 50 L50 28 L84 50 L82 50 L18 50 Z"
        fill={`url(#${id}-body)`}
        stroke="#5C4033"
        strokeWidth="1.6"
      />
      <rect x="18" y="62" width="64" height="6" fill={accent} opacity="0.85" />
      <rect x="44" y="58" width="12" height="16" rx="2" fill="#C4A35A" stroke="#8B6914" strokeWidth="1.2" />
      <circle cx="50" cy="66" r="1.6" fill="#5C4033" />
      <path d="M50 28 L50 50" stroke="#5C4033" strokeWidth="1.2" />
      <path fill={`url(#${id}-shine)`} d="M18 50 L82 50 L76 92 L24 92 Z" />
    </g>
  );
}

function Clock({ id, accent }: { id: string; accent: string }) {
  return (
    <g>
      <circle cx="50" cy="18" r="5" fill="none" stroke="#C4A35A" strokeWidth="2.4" />
      <rect x="48" y="22" width="4" height="8" rx="1" fill="#C4A35A" />
      <circle cx="50" cy="62" r="30" fill={`url(#${id}-body)`} stroke="#C4A35A" strokeWidth="3" />
      <circle cx="50" cy="62" r="23" fill="#FBF7F0" />
      <g stroke="#1c1917" strokeLinecap="round">
        <line x1="50" y1="44" x2="50" y2="48" strokeWidth="1.6" />
        <line x1="50" y1="76" x2="50" y2="80" strokeWidth="1.6" />
        <line x1="32" y1="62" x2="36" y2="62" strokeWidth="1.6" />
        <line x1="64" y1="62" x2="68" y2="62" strokeWidth="1.6" />
        <line x1="50" y1="62" x2="50" y2="48" strokeWidth="2.2" />
        <line x1="50" y1="62" x2="62" y2="68" strokeWidth="1.8" />
      </g>
      <circle cx="50" cy="62" r="2.2" fill="#C4A35A" />
      <circle cx="50" cy="62" r="30" fill={`url(#${id}-shine)`} />
      <circle cx="50" cy="62" r="30" fill="none" stroke={accent} strokeWidth="1" opacity="0.6" />
    </g>
  );
}

function LetterBox({ id, accent }: { id: string; accent: string }) {
  return (
    <g>
      <path
        d="M16 40 L84 40 L84 90 L16 90 Z"
        fill={`url(#${id}-body)`}
        stroke="#5C4033"
        strokeWidth="1.6"
      />
      <path
        d="M16 40 L50 62 L84 40"
        fill="none"
        stroke={accent}
        strokeWidth="2"
      />
      <path
        d="M16 40 L50 18 L84 40 L16 40 Z"
        fill={`url(#${id}-body)`}
        stroke="#5C4033"
        strokeWidth="1.6"
      />
      <rect x="42" y="64" width="16" height="10" rx="1.5" fill="#C4A35A" opacity="0.9" />
      <path fill={`url(#${id}-shine)`} d="M16 40 L84 40 L84 90 L16 90 Z" />
    </g>
  );
}

function Locket({ id, accent }: { id: string; accent: string }) {
  return (
    <g>
      <circle cx="50" cy="16" r="4.5" fill="none" stroke="#C4A35A" strokeWidth="2.2" />
      <path d="M50 20 L50 30" stroke="#C4A35A" strokeWidth="2" />
      <ellipse
        cx="50"
        cy="64"
        rx="26"
        ry="30"
        fill={`url(#${id}-body)`}
        stroke="#C4A35A"
        strokeWidth="2.4"
      />
      <ellipse cx="50" cy="64" rx="16" ry="19" fill="#FBF7F0" />
      <ellipse cx="50" cy="64" rx="16" ry="19" fill={`url(#${id}-body)`} opacity="0.35" />
      <path d="M42 58 Q50 70 58 58" fill="none" stroke={accent} strokeWidth="1.6" />
      <ellipse cx="50" cy="64" rx="26" ry="30" fill={`url(#${id}-shine)`} />
    </g>
  );
}

function Hourglass({ id, accent }: { id: string; accent: string }) {
  return (
    <g>
      <rect x="28" y="18" width="44" height="8" rx="2" fill="#5C4033" />
      <rect x="28" y="84" width="44" height="8" rx="2" fill="#5C4033" />
      <path
        d="M34 26 C34 26 34 42 50 54 C66 42 66 26 66 26 Z"
        fill={`url(#${id}-body)`}
        stroke="#5C4033"
        strokeWidth="1.5"
      />
      <path
        d="M34 84 C34 84 34 68 50 56 C66 68 66 84 66 84 Z"
        fill={`url(#${id}-body)`}
        stroke="#5C4033"
        strokeWidth="1.5"
      />
      <path d="M40 36 L60 36 L50 50 Z" fill={accent} opacity="0.9" />
      <path d="M38 78 L62 78 L50 62 Z" fill={accent} opacity="0.55" />
      <path d="M34 26 L34 84 M66 26 L66 84" stroke="#5C4033" strokeWidth="1.4" />
      <path fill={`url(#${id}-shine)`} d="M34 26 C34 26 34 42 50 54 C66 42 66 26 66 26 Z" />
    </g>
  );
}

function Tin({ id, accent }: { id: string; accent: string }) {
  return (
    <g>
      <ellipse cx="50" cy="34" rx="32" ry="12" fill={`url(#${id}-body)`} stroke="#5C4033" strokeWidth="1.5" />
      <path
        d="M18 34 L18 78 C18 88 82 88 82 78 L82 34"
        fill={`url(#${id}-body)`}
        stroke="#5C4033"
        strokeWidth="1.5"
      />
      <ellipse cx="50" cy="78" rx="32" ry="10" fill={`url(#${id}-body)`} stroke="#5C4033" strokeWidth="1.4" />
      <ellipse cx="50" cy="34" rx="22" ry="7" fill="#FBF7F0" opacity="0.35" />
      <rect x="38" y="48" width="24" height="16" rx="2" fill={accent} opacity="0.8" />
      <path fill={`url(#${id}-shine)`} d="M18 34 L18 78 C18 88 82 88 82 78 L82 34" />
    </g>
  );
}
