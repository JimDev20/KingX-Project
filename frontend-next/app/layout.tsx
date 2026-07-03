import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
