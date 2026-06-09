import { LangProviderWrapper } from "@/components/LangProviderWrapper";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LangProviderWrapper>{children}</LangProviderWrapper>;
}
