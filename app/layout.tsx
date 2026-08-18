import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { FirebaseAnalytics } from "@/components/firebase-analytics";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans-kr",
});

const serif = Noto_Serif_KR({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-serif-kr",
});

export const metadata: Metadata = {
  title: "캡슐 미",
  description: "사진과 편지를 묻고, 열람일에 함께 열어요",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <FirebaseAnalytics />
          {children}
        </Providers>
      </body>
    </html>
  );
}
