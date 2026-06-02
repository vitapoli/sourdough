"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ошибка");
      return;
    }

    setSent(true);
  }

  const inputClass =
    "w-full px-4 py-3 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark font-medium focus:outline-none focus:border-terracotta transition-colors";

  if (sent) {
    return (
      <div className="min-h-screen bg-cream flex items-start justify-center px-4 pt-[12vh]">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-extrabold text-brown-dark mb-4">Проверь почту</h1>
          <p className="text-brown-light mb-6">
            Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.
          </p>
          <a href="/login" className="text-terracotta font-bold hover:underline">
            Вернуться ко входу
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-start justify-center px-4 pt-[12vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-brown-dark">Забыл пароль?</h1>
          <p className="text-brown-light mt-1">Введи email и мы отправим ссылку для сброса</p>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-terracotta to-terracotta-light text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Отправляю..." : "Отправить ссылку"}
          </button>
        </form>

        <p className="text-center text-sm text-brown-light mt-4">
          <a href="/login" className="text-terracotta font-bold hover:underline">
            Вернуться ко входу
          </a>
        </p>
      </div>
    </div>
  );
}
