import type { Metadata, Viewport } from "next";
import { Nunito, Inter } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sourdough — трекер закваски",
  description: "Веди свою закваску как тамагочи. Первое русскоязычное приложение для домашних пекарей.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sourdough",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FDF8F3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
