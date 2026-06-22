"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { setCachedAuth } from "@/lib/authState";

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setCachedAuth("guest");
    router.push("/login");
  }

  async function handleDelete() {
    if (!deletePassword) { setDeleteError(t("profile.enterPassword")); return; }
    setDeleting(true);
    setDeleteError("");
    const res = await fetch("/api/auth/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error || t("error"));
      setDeleting(false);
      return;
    }
    setCachedAuth("guest");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-brown-light">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-6">
      <div className="max-w-sm mx-auto">
        {/* Назад */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-sm text-brown-light hover:text-terracotta transition-colors mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          {t("back")}
        </button>

        {/* Профиль */}
        <div className="bg-card rounded-2xl p-6 card-shadow border border-warm-beige/60 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-terracotta/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 18 18" fill="none" stroke="#C67B5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="6" r="3.5" />
                <path d="M2.5 16.5c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-brown-dark">{user?.name}</h2>
              <p className="text-sm text-brown-light">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Выход */}
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-card rounded-2xl card-shadow border border-warm-beige/60 text-brown font-bold hover:bg-warm-beige/30 transition-all mb-4"
        >
          {t("profile.logout")}
        </button>

        {/* Удаление */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 text-sm text-brown-light/60 hover:text-red-400 transition-colors"
          >
            {t("profile.delete")}
          </button>
        ) : (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200 space-y-3">
            <p className="text-sm text-red-600 font-medium">
              {t("profile.deleteWarning")}
            </p>
            <input
              type="password"
              placeholder={t("profile.confirmPassword")}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-red-200 text-sm bg-white focus:outline-none focus:border-red-400"
            />
            {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting || !deletePassword}
                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deleting ? t("profile.deleting") : t("profile.confirmDelete")}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 text-brown-light hover:text-brown text-sm transition-colors"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
