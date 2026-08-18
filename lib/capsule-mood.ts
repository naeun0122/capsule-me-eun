import type { CapsuleWeather } from "@/lib/weather";

export const CAPSULE_SHAPES = [
  "round",
  "drop",
  "petal",
  "crystal",
  "cloud",
  "sun",
  "chest",
  "clock",
  "box",
  "locket",
  "hourglass",
  "tin",
] as const;

export type CapsuleShape = (typeof CAPSULE_SHAPES)[number];

export type CapsulePalette = {
  from: string;
  to: string;
  accent: string;
};

export type CapsuleMood = {
  name: string;
  phrase: string;
  keywords: string[];
  shape: CapsuleShape;
  palette: CapsulePalette;
};

const HEX = /^#([0-9A-Fa-f]{6})$/;

export function parseCapsuleMood(value: unknown): CapsuleMood | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  const name = asShortText(data.name, 16);
  const phrase = asShortText(data.phrase, 80);
  const shape = asShape(data.shape);
  const palette = asPalette(data.palette);

  if (!name || !phrase || !shape || !palette) {
    return null;
  }

  return {
    name,
    phrase,
    keywords: asKeywords(data.keywords),
    shape,
    palette,
  };
}

export function moodFromWeather(
  weather: CapsuleWeather | null,
  extras?: Partial<CapsuleMood>,
): CapsuleMood {
  const preset = weatherPreset(weather);

  return {
    name: extras?.name ?? preset.name,
    phrase: extras?.phrase ?? preset.phrase,
    keywords: extras?.keywords ?? preset.keywords,
    shape: extras?.shape ?? preset.shape,
    palette: extras?.palette ?? preset.palette,
  };
}

function weatherPreset(weather: CapsuleWeather | null): CapsuleMood {
  const sky = weather?.sky ?? "맑음";
  const temperature = weather?.temperature;
  const humidity = weather?.humidity;

  if (sky.includes("눈")) {
    return {
      name: "첫눈",
      phrase: "눈이 내린 날을 넣어 두었어요",
      keywords: ["눈", "고요"],
      shape: "locket",
      palette: { from: "#E0F2FE", to: "#64748B", accent: "#F8FAFC" },
    };
  }

  if (sky.includes("비") || sky.includes("소나기") || sky.includes("빗")) {
    return {
      name: "비 오는 날",
      phrase: "빗소리를 상자 안에 담았어요",
      keywords: ["비", "잔잔"],
      shape: "chest",
      palette: { from: "#7DD3FC", to: "#1E3A8A", accent: "#C4A35A" },
    };
  }

  if (sky === "흐림") {
    return {
      name: "흐린 하루",
      phrase: "낮은 하늘을 넣어 두었어요",
      keywords: ["흐림", "회색"],
      shape: "box",
      palette: { from: "#CBD5E1", to: "#475569", accent: "#C4A35A" },
    };
  }

  if (sky === "구름많음") {
    return {
      name: "구름",
      phrase: "해가 들락날락한 낮이에요",
      keywords: ["구름", "사이"],
      shape: "box",
      palette: { from: "#E2E8F0", to: "#64748B", accent: "#C4A35A" },
    };
  }

  if (temperature != null && temperature >= 28) {
    return {
      name: "더운 오후",
      phrase: "뜨거운 공기를 시계에 맞춰 두었어요",
      keywords: ["더위", "한낮"],
      shape: "clock",
      palette: { from: "#FDE68A", to: "#EA580C", accent: "#C4A35A" },
    };
  }

  if (humidity != null && humidity >= 75) {
    return {
      name: "눅눅한 저녁",
      phrase: "습한 하루를 넣어 두었어요",
      keywords: ["이슬", "온기"],
      shape: "tin",
      palette: { from: "#FBCFE8", to: "#9D174D", accent: "#C4A35A" },
    };
  }

  return {
    name: "맑은 낮",
    phrase: "햇살 좋은 날을 넣어 두었어요",
    keywords: ["맑음", "가벼움"],
    shape: "clock",
    palette: { from: "#FEF3C7", to: "#D97706", accent: "#C4A35A" },
  };
}

function asShape(value: unknown): CapsuleShape | null {
  if (typeof value !== "string") {
    return null;
  }

  return CAPSULE_SHAPES.includes(value as CapsuleShape)
    ? (value as CapsuleShape)
    : null;
}

function asPalette(value: unknown): CapsulePalette | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  const from = asHex(data.from);
  const to = asHex(data.to);
  const accent = asHex(data.accent);

  if (!from || !to || !accent) {
    return null;
  }

  return { from, to, accent };
}

function asKeywords(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

function asShortText(value: unknown, max: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, max);
}

function asHex(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return HEX.test(value) ? value : null;
}
