"use client";

import { Icon } from "./Icon";
import { useT } from "@/lib/i18n";

// Заглушка-приглашение для гостя на вкладках, требующих аккаунта.
export function GuestGate({ titleKey }: { titleKey: string }) {
  const t = useT();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 min-h-[55vh] text-center animate-fade-up">
      <Icon name="wheat" size={48} className="mb-3 text-terracotta" />
      <h2 className="text-xl font-extrabold text-brown-dark mb-2">{t(titleKey)}</h2>
      <p className="text-brown-light mb-6 max-w-xs">{t("guest.gate.desc")}</p>
      <a
        href="/register"
        className="px-6 py-3 bg-terracotta text-white font-bold rounded-2xl card-shadow-lg hover:bg-terracotta-light active:scale-95 transition-all"
      >
        {t("guest.gate.cta")}
      </a>
      <a href="/login" className="mt-3 text-brown-light hover:text-brown text-sm transition-colors">
        {t("guest.login")}
      </a>
    </div>
  );
}
