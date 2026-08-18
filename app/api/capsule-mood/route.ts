import { NextRequest } from "next/server";
import { generateCapsuleMood } from "@/lib/gemini-mood";
import { parseCapsuleWeather } from "@/lib/weather";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const data = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const letter = typeof data.letter === "string" ? data.letter : "";
  const to = typeof data.to === "string" ? data.to : "";
  const weather = parseCapsuleWeather(data.weather);

  try {
    const mood = await generateCapsuleMood({ weather, letter, to });
    return Response.json(mood);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "캡슐의 분위기를 만들지 못했습니다." },
      { status: 502 },
    );
  }
}
