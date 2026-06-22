"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { setCachedAuth } from "@/lib/authState";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || t("auth.loginError"));
      return;
    }

    setCachedAuth("user");
    router.push("/");
  }

  const inputClass =
    "w-full px-4 py-3 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark font-medium focus:outline-none focus:border-terracotta transition-colors";

  return (
    <div className="min-h-screen bg-cream flex items-start justify-center px-4 pt-[12vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-brown-dark">Levain Lab</h1>
          <p className="text-brown-light mt-1">{t("auth.loginTitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 card-shadow border border-warm-beige/60 space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div>
            <label className="text-xs font-medium text-brown-light block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="email@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-brown-light block mb-1">{t("auth.password")}</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass + " pr-12"}
                placeholder={t("auth.passwordMin")}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-light hover:text-brown text-xs font-medium"
              >
                {showPass ? t("hide") : t("show")}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-terracotta to-terracotta-light text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? t("auth.loggingIn") : t("auth.login")}
          </button>

          <p className="text-center">
            <a href="/forgot-password" className="text-xs text-brown-light hover:text-terracotta transition-colors">
              {t("auth.forgotPassword")}
            </a>
          </p>
        </form>

        <p className="text-center text-sm text-brown-light mt-4">
          {t("auth.noAccount")}{" "}
          <a href="/register" className="text-terracotta font-bold hover:underline">
            {t("auth.register")}
          </a>
        </p>
      </div>
    </div>
  );
}
