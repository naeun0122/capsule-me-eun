type NominatimAddress = {
  state?: string;
  city?: string;
  county?: string;
  borough?: string;
  city_district?: string;
  suburb?: string;
  neighbourhood?: string;
  town?: string;
  village?: string;
};

const REGION_SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라북도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

export async function reverseGeocodePlace(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    return await Promise.any([
      rejectIfEmpty(reverseGeocodeBigData(lat, lon)),
      rejectIfEmpty(reverseGeocodeNominatim(lat, lon)),
    ]);
  } catch {
    return null;
  }
}

async function rejectIfEmpty(promise: Promise<string | null>) {
  const value = await promise;

  if (!value) {
    throw new Error("empty place");
  }

  return value;
}

async function reverseGeocodeBigData(lat: number, lon: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const url = new URL(
      "https://api.bigdatacloud.net/data/reverse-geocode-client",
    );
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("localityLanguage", "ko");

    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      localityInfo?: {
        administrative?: { name?: string; adminLevel?: number }[];
      };
    };

    const names = (payload.localityInfo?.administrative ?? [])
      .filter((item) => (item.adminLevel ?? 0) >= 4 && item.name)
      .map((item) => item.name as string);

    if (names.length > 0) {
      return formatKoreanPlaceFromParts(names);
    }

    return formatKoreanPlaceFromParts([
      payload.principalSubdivision ?? "",
      payload.city ?? "",
      payload.locality ?? "",
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function reverseGeocodeNominatim(lat: number, lon: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("zoom", "16");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Accept-Language": "ko",
        "User-Agent": "CapsuleMe/1.0 (time capsule weather)",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { address?: NominatimAddress };
    return formatKoreanPlace(payload.address);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function formatKoreanPlaceFromParts(values: string[]) {
  const parts: string[] = [];

  for (const raw of values) {
    const value = shortenRegion(raw.trim());

    if (value && !parts.some((part) => part === value || value.startsWith(part))) {
      parts.push(value);
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.slice(0, 3).join(" ");
}

function formatKoreanPlace(address?: NominatimAddress) {
  if (!address) {
    return null;
  }

  return formatKoreanPlaceFromParts([
    address.state ?? "",
    address.city || address.county || "",
    address.borough || address.city_district || "",
    address.suburb ||
      address.neighbourhood ||
      address.town ||
      address.village ||
      "",
  ]);
}

function shortenRegion(state?: string) {
  if (!state) {
    return "";
  }

  return REGION_SHORT[state] ?? state;
}
