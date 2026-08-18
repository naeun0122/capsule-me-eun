export type CapsuleWeather = {
  sky: string;
  temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
  windSpeed: number | null;
  precipitationType: number;
  observedAt: string;
  place: string;
  latitude: number | null;
  longitude: number | null;
};

export function parseCapsuleWeather(value: unknown): CapsuleWeather | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  const sky = typeof data.sky === "string" ? data.sky : "";

  if (!sky) {
    return null;
  }

  return {
    sky,
    temperature: asFiniteNumber(data.temperature),
    humidity: asFiniteNumber(data.humidity),
    rainfall: asFiniteNumber(data.rainfall),
    windSpeed: asFiniteNumber(data.windSpeed),
    precipitationType:
      asFiniteNumber(data.precipitationType) ?? 0,
    observedAt: typeof data.observedAt === "string" ? data.observedAt : "",
    place: typeof data.place === "string" ? data.place : "",
    latitude: asFiniteNumber(data.latitude),
    longitude: asFiniteNumber(data.longitude),
  };
}

export type WeatherKind = "sun" | "cloud" | "overcast" | "rain" | "snow";

export function weatherKind(weather: CapsuleWeather | null): WeatherKind {
  const sky = weather?.sky ?? "";

  if (sky.includes("눈")) {
    return "snow";
  }

  if (sky.includes("비") || sky.includes("소나기") || sky.includes("빗")) {
    return "rain";
  }

  if (sky === "흐림") {
    return "overcast";
  }

  if (sky === "구름많음") {
    return "cloud";
  }

  return "sun";
}

export function weatherAtmosphere(weather: CapsuleWeather | null) {
  const kind = weatherKind(weather);
  const temperature = weather?.temperature ?? 20;
  const humidity = weather?.humidity ?? 50;
  const wind = Math.max(0.4, weather?.windSpeed ?? 2);
  const heavy = (weather?.rainfall ?? 0) > 1.5 || humidity >= 85;

  if (kind === "snow") {
    return {
      kind,
      from: "#94A3B8",
      mid: "#E2E8F0",
      to: "#F8FAFC",
      glow: "#E0F2FE",
      ink: "#0F172A",
      muted: "#475569",
      hud: "bg-white/55 text-slate-800",
      wind,
      humidity,
      heavy,
    };
  }

  if (kind === "rain") {
    return {
      kind,
      from: "#0F172A",
      mid: "#1E3A5F",
      to: "#64748B",
      glow: "#38BDF8",
      ink: "#F8FAFC",
      muted: "#CBD5E1",
      hud: "bg-slate-900/40 text-slate-50",
      wind,
      humidity,
      heavy,
    };
  }

  if (kind === "overcast") {
    return {
      kind,
      from: "#475569",
      mid: "#94A3B8",
      to: "#CBD5E1",
      glow: "#E2E8F0",
      ink: "#1E293B",
      muted: "#475569",
      hud: "bg-white/50 text-slate-800",
      wind,
      humidity,
      heavy,
    };
  }

  if (kind === "cloud") {
    return {
      kind,
      from: "#7DD3FC",
      mid: "#E0F2FE",
      to: "#FEF3C7",
      glow: "#FDE68A",
      ink: "#1C1917",
      muted: "#57534E",
      hud: "bg-white/55 text-stone-800",
      wind,
      humidity,
      heavy,
    };
  }

  if (temperature >= 28) {
    return {
      kind,
      from: "#38BDF8",
      mid: "#FDE68A",
      to: "#FB923C",
      glow: "#FBBF24",
      ink: "#1C1917",
      muted: "#57534E",
      hud: "bg-white/55 text-stone-800",
      wind,
      humidity,
      heavy,
    };
  }

  return {
    kind,
    from: "#38BDF8",
    mid: "#7DD3FC",
    to: "#FEF3C7",
    glow: "#FDE68A",
    ink: "#1C1917",
    muted: "#57534E",
    hud: "bg-white/55 text-stone-800",
    wind,
    humidity,
    heavy,
  };
}

export function weatherEmoji(sky: string) {
  if (sky.includes("눈")) {
    return "❄️";
  }

  if (sky.includes("비") || sky.includes("소나기") || sky.includes("빗")) {
    return "🌧️";
  }

  if (sky === "흐림") {
    return "☁️";
  }

  if (sky === "구름많음") {
    return "⛅";
  }

  return "☀️";
}

export function formatWeatherLine(weather: CapsuleWeather) {
  const parts = [];

  if (weather.place) {
    parts.push(weather.place);
  }

  parts.push(weather.sky);

  if (weather.temperature != null) {
    parts.push(`${weather.temperature}°C`);
  }

  if (weather.humidity != null) {
    parts.push(`습도 ${weather.humidity}%`);
  }

  if (weather.rainfall != null && weather.rainfall > 0) {
    parts.push(`강수 ${weather.rainfall}mm`);
  }

  return parts.join(" · ");
}

export function formatWeatherSnapshot(weather: CapsuleWeather) {
  const parts = [];

  if (weather.place) {
    parts.push(weather.place);
  }

  parts.push(`${weatherEmoji(weather.sky)} ${weather.sky}`);

  if (weather.temperature != null) {
    parts.push(`${weather.temperature}°`);
  }

  return parts.join(" · ");
}

export function formatObservedAt(observedAt: string) {
  if (!observedAt) {
    return "";
  }

  const date = new Date(observedAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)} 기준`;
}

export async function requestCapsuleWeather(): Promise<CapsuleWeather | null> {
  const coords = await readBrowserCoords();
  const params = new URLSearchParams();

  if (coords) {
    params.set("lat", String(coords.lat));
    params.set("lon", String(coords.lon));
  }

  const response = await fetch(`/api/weather?${params.toString()}`);

  if (!response.ok) {
    return null;
  }

  return parseCapsuleWeather(await response.json());
}

function asFiniteNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

let cachedCoords: { lat: number; lon: number } | null | undefined;

function readBrowserCoords(): Promise<{ lat: number; lon: number } | null> {
  if (cachedCoords !== undefined) {
    return Promise.resolve(cachedCoords);
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    cachedCoords = null;
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        cachedCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        resolve(cachedCoords);
      },
      () => {
        cachedCoords = null;
        resolve(null);
      },
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 8000 },
    );
  });
}
