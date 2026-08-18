export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://capsule-me-857b2.web.app";

export const SITE_NAME = "캡슐 미";

export const SITE_DESCRIPTION =
  "사진과 편지를 묻고, 열람일에 함께 열어요. 그날의 날씨와 함께 남겨 두는 타임캡슐.";

export const SITE_KEYWORDS = [
  "타임캡슐",
  "캡슐 미",
  "편지",
  "추억",
  "열람일",
  "다이어리",
  "날씨",
];

export function siteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function gaMeasurementId() {
  const id =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ??
    "";

  return /^G-[A-Z0-9]+$/.test(id) ? id : "";
}
