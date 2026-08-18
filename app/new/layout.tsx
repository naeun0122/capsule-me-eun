import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "새 캡슐",
  description: "지금 이 날씨와 함께 사진과 편지를 묻어 두세요.",
  alternates: {
    canonical: "/new",
  },
  openGraph: {
    url: siteUrl("/new"),
    title: "새 캡슐",
    description: "지금 이 날씨와 함께 사진과 편지를 묻어 두세요.",
  },
};

export default function NewLayout({ children }: LayoutProps<"/new">) {
  return children;
}
