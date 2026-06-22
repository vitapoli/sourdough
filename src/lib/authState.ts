"use client";

// Кэш состояния авторизации для мгновенного показа страницы при повторных заходах.
// "user" — вошедший пользователь, "guest" — гость.
//
// Это НЕ источник правды: на главной мы всё равно перепроверяем /api/auth/me
// в фоне и поправляем состояние, если оно изменилось (вышел/зашёл, истекла сессия).
// Кэш нужен только чтобы не держать пользователя перед пустым спиннером, пока
// идёт сетевой запрос — при обычном заходе состояние не меняется.

const KEY = "authState";

export type AuthState = "user" | "guest";

export function getCachedAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "user" || v === "guest" ? v : null;
}

export function setCachedAuth(v: AuthState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, v);
}
