"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useT, useLang } from "@/lib/i18n";

interface BakerRecipe {
  id: string;
  title: string;
  description: string | null;
  flour: string;
  hydration: number;
  starterPct: number;
  photos: string | null;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  translations: string | null;
}

// Поля рецепта, которые видны на карточке пекаря (их и переводим).
// /api/recipes/translate возвращает больше полей, но здесь нужны только эти.
interface TranslatedFields {
  title: string;
  description: string | null;
  flour: string;
}

export default function BakerPage() {
  const { userId } = useParams<{ userId: string }>();
  const t = useT();
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [recipes, setRecipes] = useState<BakerRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Перевод по кнопке и переключатель «оригинал» — храним по id рецепта,
  // потому что на странице сразу несколько карточек.
  const [fresh, setFresh] = useState<Record<string, TranslatedFields>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/baker/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setName(data.user.name);
        setRecipes(data.recipes);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const toggleLike = async (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    const wasLiked = recipe.isLikedByMe;

    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? {
              ...r,
              isLikedByMe: !wasLiked,
              likesCount: wasLiked ? r.likesCount - 1 : r.likesCount + 1,
            }
          : r
      )
    );

    try {
      await fetch(`/api/community/${recipeId}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      });
    } catch {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? { ...r, isLikedByMe: wasLiked, likesCount: recipe.likesCount }
            : r
        )
      );
    }
  };

  async function handleTranslate(id: string) {
    setTranslating((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch("/api/recipes/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, targetLang: lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(t("recipes.translateError") + ": " + (data.error || ""));
        return;
      }
      setFresh((s) => ({
        ...s,
        [id]: { title: data.title, description: data.description, flour: data.flour },
      }));
      setShowOriginal((s) => ({ ...s, [id]: false }));
    } catch (e) {
      alert(t("recipes.translateError") + ": " + String(e));
    } finally {
      setTranslating((s) => ({ ...s, [id]: false }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-brown-light">{t("loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <a href="/" className="flex items-center gap-1 text-brown-light mb-6">
          <Icon name="back" size={20} />
          <span className="text-sm">{t("back")}</span>
        </a>
        <p className="text-center text-brown-light">{t("baker.notFound")}</p>
      </div>
    );
  }

  // Склонение слова «рецепт» по числу
  const recipeWord =
    lang === "en"
      ? recipes.length === 1
        ? "recipe"
        : "recipes"
      : recipes.length === 1
      ? "рецепт"
      : recipes.length < 5
      ? "рецепта"
      : "рецептов";

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-sm mx-auto p-4">
        {/* Шапка */}
        <a href="/" className="flex items-center gap-1 text-brown-light mb-4">
          <Icon name="back" size={20} />
          <span className="text-sm">{t("back")}</span>
        </a>

        {/* Профиль */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-warm-beige flex items-center justify-center mx-auto mb-2">
            <Icon name="community" size={32} className="text-brown-light" />
          </div>
          <h1 className="text-xl font-bold text-brown-dark">{name}</h1>
          <p className="text-sm text-brown-light">
            {recipes.length} {recipeWord}
          </p>
        </div>

        {/* Рецепты */}
        {recipes.length === 0 ? (
          <p className="text-center text-brown-light py-8">{t("baker.noRecipes")}</p>
        ) : (
          <div className="space-y-4">
            {recipes.map((recipe) => {
              const photoUrl = recipe.photos
                ? (() => {
                    try {
                      const urls: string[] = JSON.parse(recipe.photos!);
                      return urls[0] || null;
                    } catch {
                      return null;
                    }
                  })()
                : null;

              // Перевод: нужен, если язык рецепта не совпадает с языком интерфейса.
              // Берём свежий перевод (по кнопке) или уже сохранённый в БД.
              const origLang = /[а-яё]/i.test(recipe.title) ? "ru" : "en";
              const needsTr = origLang !== lang;
              const saved: TranslatedFields | null = recipe.translations
                ? (JSON.parse(recipe.translations) as Record<string, TranslatedFields>)[lang] ?? null
                : null;
              const tr = fresh[recipe.id] ?? saved;
              const active = needsTr && !showOriginal[recipe.id] ? tr : null;
              const dTitle = active?.title ?? recipe.title;
              const dDescription = active ? active.description : recipe.description;
              const dFlour = active?.flour ?? recipe.flour;

              return (
                <div
                  key={recipe.id}
                  className="bg-card rounded-2xl card-shadow border border-warm-beige/60 overflow-hidden"
                >
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt={dTitle}
                      className="w-full h-48 object-cover object-center"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-brown-dark text-base mb-1">
                      {dTitle}
                    </h3>
                    {dDescription && (
                      <p className="text-sm text-brown-light mb-2 line-clamp-2">
                        {dDescription}
                      </p>
                    )}
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      <span className="text-[11px] bg-warm-beige/70 text-brown px-2 py-0.5 rounded-md font-medium">
                        {dFlour}
                      </span>
                      <span className="text-[11px] bg-warm-beige/70 text-brown px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-0.5">
                        <Icon name="drop" size={10} />
                        {recipe.hydration}%
                      </span>
                      <span className="text-[11px] bg-warm-beige/70 text-brown px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-0.5">
                        <Icon name="wheat" size={10} />
                        {recipe.starterPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-warm-beige/40">
                      <button
                        onClick={() => toggleLike(recipe.id)}
                        className="flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Icon
                          name={recipe.isLikedByMe ? "heart-fill" : "heart"}
                          size={18}
                          className={
                            recipe.isLikedByMe
                              ? "text-terracotta"
                              : "text-brown-light"
                          }
                        />
                        <span className="text-xs text-brown-light">
                          {recipe.likesCount || ""}
                        </span>
                      </button>
                      <span className="flex items-center gap-1 text-brown-light">
                        <Icon name="comment" size={18} />
                        <span className="text-xs">
                          {recipe.commentsCount || ""}
                        </span>
                      </span>

                      {/* Перевод рецепта */}
                      {needsTr &&
                        (tr ? (
                          <button
                            onClick={() =>
                              setShowOriginal((s) => ({ ...s, [recipe.id]: !s[recipe.id] }))
                            }
                            className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-terracotta hover:underline"
                          >
                            <Icon name="globe" size={14} />
                            {showOriginal[recipe.id]
                              ? t("recipes.showTranslation")
                              : t("recipes.showOriginal")}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTranslate(recipe.id)}
                            disabled={translating[recipe.id]}
                            className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-brown-light hover:text-terracotta transition-colors disabled:opacity-50"
                          >
                            <Icon name="globe" size={14} />
                            {translating[recipe.id]
                              ? t("recipes.translating")
                              : t("recipes.translate")}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
