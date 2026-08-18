import { reverseGeocodePlace } from "@/lib/place";
import type { CapsuleWeather } from "@/lib/weather";

const NCST_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
const FCST_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";

const SEOUL = { lat: 37.5665, lon: 126.978 };

const PTY_LABEL: Record<number, string> = {
  1: "비",
  2: "비/눈",
  3: "눈",
  4: "소나기",
  5: "빗방울",
  6: "빗방울/눈날림",
  7: "눈날림",
};

const SKY_LABEL: Record<string, string> = {
  "1": "맑음",
  "3": "구름많음",
  "4": "흐림",
};

type NcstItem = {
  category?: string;
  obsrValue?: string;
  baseDate?: string;
  baseTime?: string;
};

type FcstItem = {
  category?: string;
  fcstValue?: string;
  fcstDate?: string;
  fcstTime?: string;
};

export async function fetchCapsuleWeather(
  lat?: number,
  lon?: number,
): Promise<CapsuleWeather> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

  if (!serviceKey) {
    throw new Error("DATA_GO_KR_SERVICE_KEY is missing");
  }

  const latitude = Number.isFinite(lat) ? (lat as number) : SEOUL.lat;
  const longitude = Number.isFinite(lon) ? (lon as number) : SEOUL.lon;
  const grid = latLonToGrid(latitude, longitude);
  const korea = koreaDateTime(new Date());
  const ncstBase = kmaBase(korea, 10, "00");
  const fcstBase = kmaBase(korea, 45, "30");

  const [ncstItems, fcstItems, place] = await Promise.all([
    fetchKmaItems<NcstItem>(NCST_URL, serviceKey, grid, ncstBase, 3),
    fetchKmaItems<FcstItem>(FCST_URL, serviceKey, grid, fcstBase, 2).catch(
      () => [] as FcstItem[],
    ),
    reverseGeocodePlace(latitude, longitude),
  ]);

  const ncst = byCategory(ncstItems, (item) => item.obsrValue);
  const precipitationType = Math.trunc(parseObs(ncst.PTY) ?? 0);
  const skyCode = pickSkyCode(fcstItems, korea);
  const first = ncstItems[0];

  return {
    sky: skyLabel(precipitationType, skyCode),
    temperature: roundOne(parseObs(ncst.T1H)),
    humidity: roundZero(parseObs(ncst.REH)),
    rainfall: roundOne(parseObs(ncst.RN1)),
    windSpeed: roundOne(parseObs(ncst.WSD)),
    precipitationType,
    observedAt: kmaObservedAt(first?.baseDate, first?.baseTime),
    place: place ?? (Number.isFinite(lat) ? "현재 위치" : "서울"),
    latitude,
    longitude,
  };
}

function skyLabel(pty: number, skyCode: string | null) {
  return PTY_LABEL[pty] ?? SKY_LABEL[skyCode ?? ""] ?? "맑음";
}

function pickSkyCode(items: FcstItem[], korea: KoreaDateTime) {
  const skyItems = items.filter((item) => item.category === "SKY");
  const currentHour = `${korea.hour}00`;
  const match =
    skyItems.find(
      (item) => item.fcstDate === korea.date && item.fcstTime === currentHour,
    ) ?? skyItems[0];

  return match?.fcstValue ?? null;
}

async function fetchKmaItems<T>(
  endpoint: string,
  serviceKey: string,
  grid: { nx: number; ny: number },
  base: { date: string; time: string },
  attempts: number,
): Promise<T[]> {
  let current = base;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const items = await requestKma<T>(endpoint, serviceKey, grid, current);

    if (items.length > 0) {
      return items;
    }

    current = shiftBase(current, -60);
  }

  throw new Error("KMA weather data is empty");
}

async function requestKma<T>(
  endpoint: string,
  serviceKey: string,
  grid: { nx: number; ny: number },
  base: { date: string; time: string },
): Promise<T[]> {
  const query = new URLSearchParams({
    pageNo: "1",
    numOfRows: "100",
    dataType: "JSON",
    base_date: base.date,
    base_time: base.time,
    nx: String(grid.nx),
    ny: String(grid.ny),
  });
  const url = `${endpoint}?serviceKey=${encodeURIComponent(serviceKey)}&${query.toString()}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`KMA request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    response?: {
      header?: { resultCode?: string };
      body?: { items?: { item?: T | T[] } };
    };
  };

  if (payload.response?.header?.resultCode !== "00") {
    return [];
  }

  const item = payload.response.body?.items?.item;

  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
}

function byCategory(
  items: NcstItem[],
  valueOf: (item: NcstItem) => string | undefined,
) {
  const map: Record<string, string> = {};

  for (const item of items) {
    if (item.category && valueOf(item) != null) {
      map[item.category] = valueOf(item) as string;
    }
  }

  return map;
}

function parseObs(value: string | undefined) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || Math.abs(parsed) >= 900) {
    return null;
  }

  return parsed;
}

function roundOne(value: number | null) {
  if (value == null) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function roundZero(value: number | null) {
  if (value == null) {
    return null;
  }

  return Math.round(value);
}

function kmaObservedAt(baseDate?: string, baseTime?: string) {
  if (!baseDate || baseDate.length !== 8 || !baseTime) {
    return new Date().toISOString();
  }

  const hour = baseTime.slice(0, 2).padStart(2, "0");
  const minute = (baseTime.slice(2, 4) || "00").padStart(2, "0");

  return `${baseDate.slice(0, 4)}-${baseDate.slice(4, 6)}-${baseDate.slice(6, 8)}T${hour}:${minute}:00+09:00`;
}

type KoreaDateTime = {
  date: string;
  hour: string;
  minute: string;
};

function koreaDateTime(date: Date): KoreaDateTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${value("year")}${value("month")}${value("day")}`,
    hour: value("hour"),
    minute: value("minute"),
  };
}

function kmaBase(
  korea: KoreaDateTime,
  lagMinutes: number,
  minuteStamp: "00" | "30",
) {
  const shifted = shiftKorea(korea, -lagMinutes);

  return {
    date: shifted.date,
    time: `${shifted.hour}${minuteStamp}`,
  };
}

function shiftBase(base: { date: string; time: string }, minutes: number) {
  return kmaBase(
    {
      date: base.date,
      hour: base.time.slice(0, 2),
      minute: base.time.slice(2, 4) || "00",
    },
    -minutes,
    base.time.endsWith("30") ? "30" : "00",
  );
}

function shiftKorea(korea: KoreaDateTime, minutes: number): KoreaDateTime {
  const iso = `${korea.date.slice(0, 4)}-${korea.date.slice(4, 6)}-${korea.date.slice(6, 8)}T${korea.hour}:${korea.minute}:00+09:00`;
  return koreaDateTime(new Date(new Date(iso).getTime() + minutes * 60 * 1000));
}

function latLonToGrid(lat: number, lon: number) {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;
  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;

  if (theta > Math.PI) {
    theta -= 2.0 * Math.PI;
  }

  if (theta < -Math.PI) {
    theta += 2.0 * Math.PI;
  }

  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}
