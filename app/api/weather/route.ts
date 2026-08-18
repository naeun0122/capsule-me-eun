import { NextRequest } from "next/server";
import { fetchCapsuleWeather } from "@/lib/kma-weather";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  try {
    const weather = await fetchCapsuleWeather(
      Number.isFinite(lat) ? lat : undefined,
      Number.isFinite(lon) ? lon : undefined,
    );

    return Response.json(weather);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "날씨를 불러오지 못했습니다." },
      { status: 502 },
    );
  }
}
