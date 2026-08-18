import { GoogleGenAI } from "@google/genai";
import {
  moodFromWeather,
  parseCapsuleMood,
  type CapsuleMood,
} from "@/lib/capsule-mood";
import type { CapsuleWeather } from "@/lib/weather";

const MODELS = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];

const MOOD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      description: "짧은 별명. 한글 8자 이내. 예: 맑은 낮, 비 오는 날.",
    },
    phrase: {
      type: "string",
      description: "날씨를 담은 짧은 한 문장. 한글 28자 이내. 편지 내용 금지. 시적인 비유는 최소화.",
    },
    keywords: {
      type: "array",
      description: "편지를 스포하지 않는 힌트 키워드 2~4개. 각 6자 이내.",
      items: { type: "string" },
    },
    shape: {
      type: "string",
      enum: ["chest", "clock", "box", "locket", "hourglass", "tin"],
    },
    palette: {
      type: "object",
      additionalProperties: false,
      properties: {
        from: { type: "string", description: "hex like #FDE68A" },
        to: { type: "string", description: "hex like #EA580C" },
        accent: { type: "string", description: "hex like #FFF7ED" },
      },
      required: ["from", "to", "accent"],
    },
  },
  required: ["name", "phrase", "keywords", "shape", "palette"],
};

export async function generateCapsuleMood(input: {
  weather: CapsuleWeather | null;
  letter: string;
  to: string;
}): Promise<CapsuleMood> {
  const fallback = moodFromWeather(input.weather);

  try {
    const generated = await askGemini(input);
    const parsed = parseCapsuleMood(generated);

    if (!parsed) {
      return fallback;
    }

    return {
      ...parsed,
      keywords: parsed.keywords.length > 0 ? parsed.keywords : fallback.keywords,
    };
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

async function askGemini(input: {
  weather: CapsuleWeather | null;
  letter: string;
  to: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(input);
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const interaction = await ai.interactions.create({
        model,
        store: false,
        system_instruction:
          "너는 타임캡슐 디자이너다. 반드시 요청한 JSON만 출력한다.",
        input: prompt,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: MOOD_SCHEMA,
        },
      });

      return parseModelJson(interaction.output_text);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function buildPrompt(input: {
  weather: CapsuleWeather | null;
  letter: string;
  to: string;
}) {
  const weather = input.weather
    ? `장소 ${input.weather.place || "모름"}, 하늘 ${input.weather.sky}, 기온 ${input.weather.temperature ?? "모름"}℃, 습도 ${input.weather.humidity ?? "모름"}%, 강수 ${input.weather.rainfall ?? 0}mm, 풍속 ${input.weather.windSpeed ?? "모름"}m/s`
    : "날씨 정보 없음";
  const letter = input.letter.trim().slice(0, 1600) || "(편지 없음)";
  const to = input.to.trim() || "(받는이 없음)";

  return `날씨: ${weather}
받는이: ${to}
편지:
${letter}

요구사항:
- name은 담백하게. 병, 알, 씨앗, 단지 같은 조어 금지.
- phrase는 날씨만 담은 짧은 문장. 편지 내용을 넣지 말 것.
- keywords는 감정·계절 위주. 문장 인용, 고유명사 금지.
- 편지 내용이 비어 있으면 keywords는 날씨만.
- shape는 날씨에 맞출 것. 맑음/더위=clock, 비=chest, 눈=locket, 구름/흐림=box, 습하고 포근=tin, 그 외=hourglass.
- palette는 그 날의 색. from/to 대비를 분명하게. accent는 놋쇠 느낌 #C4A35A 계열을 자주 쓸 것.`;
}

function parseModelJson(text: string | undefined) {
  if (!text) {
    throw new Error("Gemini returned empty output");
  }

  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(trimmed) as unknown;
}
