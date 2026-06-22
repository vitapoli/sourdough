import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your First Sourdough Starter in 7 Days — Free Mini-Course",
  description:
    "Step-by-step course for beginners: grow your first sourdough starter from scratch. One lesson a day, two methods — intuitive and with scales.",
  openGraph: {
    title: "Your First Sourdough Starter in 7 Days — Free Mini-Course",
    description:
      "Step-by-step course for beginners: grow your first sourdough starter from scratch.",
    url: "https://levainlab.ru/course/en",
    siteName: "Levain Lab",
    locale: "en_US",
    type: "website",
  },
};

export default function CourseEnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
