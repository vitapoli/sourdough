"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Пароль минимум 6 символов");
      return;
    }
    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(password) || !/[0-9]/.test(password)) {
      setError("Пароль должен содержать как буквы так и цифры");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Ошибка");
      return;
    }

    setDone(true);
  }

  const inputClass =
    "w-full px-4 py-3 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark font-medium focus:outline-none focus:border-terracotta transition-colors";

  if (!token) {
    return (
      <div className="min-h-screen bg-cream flex items-start justify-center px-4 pt-[12vh]">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-extrabold text-brown-dark mb-4">Недействительная ссылка</h1>
          <p className="text-brown-light mb-6">Попробуйте запросить сброс пароля заново.</p>
          <a href="/forgot-password" className="text-terracotta font-bold hover:underline">
            Забыл пароль
          </a>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-cream flex items-start justify-center px-4 pt-[12vh]">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-extrabold text-brown-dark mb-4">Пароль изменён</h1>
          <p className="text-brown-light mb-6">Теперь можешь войти с новым паролем.</p>
          <a href="/login" className="text-terracotta font-bold hover:underline">
            Войти
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-start justify-center px-4 pt-[12vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-brown-dark">Новый пароль</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 card-shadow border border-warm-beige/60 space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div>
            <label className="text-xs font-medium text-brown-light block mb-1">Новый пароль</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass + " pr-12"}
                placeholder="Минимум 6 символов"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-light hover:text-brown text-xs font-medium"
              >
                {showPass ? "Скрыть" : "Показать"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-brown-light block mb-1">Повтори пароль</label>
            <input
              type={showPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              placeholder="Ещё раз"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-terracotta to-terracotta-light text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Сохраняю..." : "Сохранить пароль"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
