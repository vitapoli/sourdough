import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Первая закваска за 7 дней — бесплатный мини-курс",
  description: "Пошаговый курс для начинающих: выведи свою первую закваску с нуля. Один урок в день, два варианта — с весами и без.",
  manifest: "/course-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Курс закваски",
  },
  openGraph: {
    title: "Первая закваска за 7 дней — бесплатный мини-курс",
    description: "Пошаговый курс для начинающих: выведи свою первую закваску с нуля.",
    url: "https://levainlab.ru/course",
    siteName: "Levain Lab",
    locale: "ru_RU",
    type: "website",
  },
};

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
