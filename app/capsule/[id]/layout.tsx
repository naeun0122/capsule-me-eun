import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "캡슐",
  description: "묻어 둔 편지와 사진을 열람일에 열어 보세요.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function CapsuleLayout({
  children,
}: LayoutProps<"/capsule/[id]">) {
  return children;
}
