"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      setError("Введите имя");
      return;
    }
    if (trimmedName.length > 30) {
      setError("Имя должно содержать менее 30 символов");
      return;
    }
    if (!/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/.test(trimmedName)) {
      setError("Имя должно состоять только из букв");
      return;
    }
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

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Ошибка регистрации");
      return;
    }

    router.push("/");
  }

  const inputClass =
    "w-full px-4 py-3 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark font-medium focus:outline-none focus:border-terracotta transition-colors";

  return (
    <div className="min-h-screen bg-cream flex items-start justify-center px-4 pt-[8vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-brown-dark">Sourdough</h1>
          <p className="text-brown-light mt-1">Создай аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 card-shadow border border-warm-beige/60 space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div>
            <label className="text-xs font-medium text-brown-light block mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Как тебя зовут?"
              required
              autoComplete="name"
            />
          </div>

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
            <label className="text-xs font-medium text-brown-light block mb-1">Пароль</label>
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
            {loading ? "Регистрация..." : "Создать аккаунт"}
          </button>
        </form>

        <p className="text-center text-sm text-brown-light mt-4">
          Уже есть аккаунт?{" "}
          <a href="/login" className="text-terracotta font-bold hover:underline">
            Войти
          </a>
        </p>
      </div>
    </div>
  );
}
