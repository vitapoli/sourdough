"use client";

import { LangProvider } from "@/lib/i18n";

export function LangProviderWrapper({ children }: { children: React.ReactNode }) {
  return <LangProvider>{children}</LangProvider>;
}
