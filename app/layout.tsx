import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/Geist[wght].ttf",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMono[wght].ttf",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const kanit = localFont({
  src: [
    { path: "./fonts/Kanit-Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/Kanit-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/Kanit-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Kanit-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Kanit-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Kanit-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Kanit-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Kanit-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/Kanit-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-kanit",
  display: "swap",
});

const prompt = localFont({
  src: [
    { path: "./fonts/Prompt-Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/Prompt-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/Prompt-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Prompt-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Prompt-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Prompt-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Prompt-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Prompt-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/Prompt-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Me Tang",
  description: "CMU student emergency loan system",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${kanit.variable} ${prompt.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
