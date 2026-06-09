import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your First Starter in 7 Days — Free Course",
  description: "Free mini-course for beginner bakers. Learn to make your first sourdough starter.",
  manifest: "/course-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Starter Course",
  },
};

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
