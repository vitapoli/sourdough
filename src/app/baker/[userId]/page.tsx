"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@/components/Icon";

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
}

export default function BakerPage() {
  const { userId } = useParams<{ userId: string }>();
  const [name, setName] = useState("");
  const [recipes, setRecipes] = useState<BakerRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-brown-light">Загрузка...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <a href="/" className="flex items-center gap-1 text-brown-light mb-6">
          <Icon name="back" size={20} />
          <span className="text-sm">На главную</span>
        </a>
        <p className="text-center text-brown-light">Пекарь не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4">
        {/* Шапка */}
        <a href="/" className="flex items-center gap-1 text-brown-light mb-4">
          <Icon name="back" size={20} />
          <span className="text-sm">Назад</span>
        </a>

        {/* Профиль */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-warm-beige flex items-center justify-center mx-auto mb-2">
            <Icon name="community" size={32} className="text-brown-light" />
          </div>
          <h1 className="text-xl font-bold text-brown-dark">{name}</h1>
          <p className="text-sm text-brown-light">
            {recipes.length}{" "}
            {recipes.length === 1
              ? "рецепт"
              : recipes.length < 5
              ? "рецепта"
              : "рецептов"}
          </p>
        </div>

        {/* Рецепты */}
        {recipes.length === 0 ? (
          <p className="text-center text-brown-light py-8">
            У этого пекаря пока нет публичных рецептов
          </p>
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

              return (
                <div
                  key={recipe.id}
                  className="bg-card rounded-2xl card-shadow border border-warm-beige/60 overflow-hidden"
                >
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt={recipe.title}
                      className="w-full h-44 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-brown-dark text-base mb-1">
                      {recipe.title}
                    </h3>
                    {recipe.description && (
                      <p className="text-sm text-brown-light mb-2 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      <span className="text-[11px] bg-warm-beige/70 text-brown px-2 py-0.5 rounded-md font-medium">
                        {recipe.flour}
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
