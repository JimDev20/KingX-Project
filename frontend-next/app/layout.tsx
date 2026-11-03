import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-hanken",
});

export const metadata: Metadata = {
  title: "KingX Uptime Monitor",
  description: "Monitor website uptime, response time, and incidents from one dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${hanken.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
