"use client";

import { useState } from "react";
import { Dropdown } from "./Dropdown";
import { useT } from "@/lib/i18n";

interface CreateStarterFormProps {
  onCreated: () => void;
}

export function CreateStarterForm({ onCreated }: CreateStarterFormProps) {
  const t = useT();
  const [name, setName] = useState("");
  const [flour, setFlour] = useState("Ржаная");
  const [loading, setLoading] = useState(false);

  const flourLabelMap: Record<string, string> = { "Ржаная": t("create.rye"), "Пшеничная": t("create.wheat") };
  const flourLabelToValue: Record<string, string> = {};
  for (const [val, label] of Object.entries(flourLabelMap)) flourLabelToValue[label] = val;
  const flourLabels = [t("create.rye"), t("create.wheat")];

  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    if (name.trim().length > 30) {
      setError(t("create.nameTooLong"));
      return;
    }
    if (flour.trim().length > 30) {
      setError(t("create.flourTooLong"));
      return;
    }

    setLoading(true);
    await fetch("/api/starters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), flour }),
    });
    setLoading(false);
    setName("");
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg space-y-4">
      <h2 className="text-xl font-semibold text-brown-dark text-center">
        {t("create.title")}
      </h2>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}

      <div>
        <label className="text-sm text-brown-light">{t("create.name")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("create.namePlaceholder")}
          required
          className="w-full mt-1 px-4 py-3 border border-brown-light/30 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-lg"
        />
      </div>

      <div>
        <label className="text-sm text-brown-light">{t("create.flourType")}</label>
        <Dropdown
          value={flourLabelMap[flour] || flour}
          options={flourLabels}
          onChange={(label) => setFlour(flourLabelToValue[label] || label)}
          allowCustom
          className="mt-1"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full py-4 bg-terracotta text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-terracotta-light active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? t("create.creating") : t("create.start")}
      </button>
    </form>
  );
}
