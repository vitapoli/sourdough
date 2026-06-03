"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Icon } from "./Icon";

interface CommunityRecipe {
  id: string;
  title: string;
  description: string | null;
  flour: string;
  hydration: number;
  starterPct: number;
  salt: number | null;
  ingredients: string | null;
  steps: string;
  photos: string | null;
  createdAt: string;
  user: { id: string; name: string } | null;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
}

interface CommentData {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string };
}

type SortMode = "new" | "popular";

// Относительное время
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins}мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}д`;
  const months = Math.floor(days / 30);
  return `${months}мес`;
}

export function CommunityTab() {
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("new");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<CommunityRecipe | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Получить текущего пользователя
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((u) => setCurrentUserId(u?.id ?? null))
      .catch(() => {});
  }, []);

  // Загрузка рецептов
  const fetchRecipes = useCallback(
    async (reset = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({ sort });
      if (search) params.set("q", search);
      if (!reset && cursor) params.set("cursor", cursor);

      try {
        const res = await fetch(`/api/community?${params}`);
        const data = await res.json();
        if (reset) {
          setRecipes(data.recipes);
        } else {
          setRecipes((prev) => [...prev, ...data.recipes]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        // тихо
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort, search, cursor]
  );

  // При смене сортировки/поиска — перезагрузка
  useEffect(() => {
    setCursor(null);
    fetchRecipes(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, search]);

  // Загрузить список уже сохранённых рецептов
  useEffect(() => {
    fetch("/api/recipes").then(r => r.ok ? r.json() : []).then((data: { parentId?: string }[]) => {
      const ids = new Set<string>(data.filter(r => r.parentId).map(r => r.parentId!));
      setSavedIds(ids);
    }).catch(() => {});
  }, []);

  // Debounce поиска
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearch(value), 300);
  };

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          fetchRecipes(false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchRecipes]);

  // Лайк
  const toggleLike = async (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    // Оптимистичное обновление
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
    if (selected?.id === recipeId) {
      setSelected((s) =>
        s
          ? {
              ...s,
              isLikedByMe: !wasLiked,
              likesCount: wasLiked ? s.likesCount - 1 : s.likesCount + 1,
            }
          : s
      );
    }

    try {
      await fetch(`/api/community/${recipeId}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      });
    } catch {
      // Откат при ошибке
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? { ...r, isLikedByMe: wasLiked, likesCount: recipe.likesCount }
            : r
        )
      );
    }
  };

  // Загрузка комментариев
  const loadComments = async (recipeId: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/community/${recipeId}/comments`);
      const data = await res.json();
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Отправка комментария
  const sendComment = async () => {
    if (!selected || !commentText.trim()) return;
    try {
      const res = await fetch(`/api/community/${selected.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setCommentText("");
        // Обновить счётчик
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === selected.id
              ? { ...r, commentsCount: r.commentsCount + 1 }
              : r
          )
        );
        setSelected((s) =>
          s ? { ...s, commentsCount: s.commentsCount + 1 } : s
        );
      }
    } catch {
      // тихо
    }
  };

  // Удаление комментария
  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/community/${selected!.id}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === selected!.id
              ? { ...r, commentsCount: Math.max(0, r.commentsCount - 1) }
              : r
          )
        );
        setSelected((s) =>
          s ? { ...s, commentsCount: Math.max(0, s.commentsCount - 1) } : s
        );
      }
    } catch {
      // тихо
    }
  };

  // Сохранить к себе
  const saveRecipe = async (recipeId: string) => {
    setSavingId(recipeId);
    try {
      const res = await fetch(`/api/community/${recipeId}/save`, {
        method: "POST",
      });
      if (res.ok) {
        setSavedIds((prev) => new Set(prev).add(recipeId));
      } else {
        console.error("Save recipe error:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Save recipe error:", err);
    } finally {
      setSavingId(null);
    }
  };

  // Открыть рецепт
  const openRecipe = (recipe: CommunityRecipe) => {
    setSelected(recipe);
    setComments([]);
    setCommentText("");
    loadComments(recipe.id);
  };

  // --- Детальный вид рецепта ---
  if (selected) {
    const photos: string[] = selected.photos
      ? JSON.parse(selected.photos)
      : [];
    let ingredients: { name: string; amount: string; unit: string; phase?: string }[] = [];
    try {
      ingredients = selected.ingredients ? JSON.parse(selected.ingredients) : [];
    } catch { /* */ }
    let steps: { text: string }[] = [];
    try {
      const parsed = JSON.parse(selected.steps);
      steps = Array.isArray(parsed) ? parsed : [];
    } catch { /* */ }

    return (
      <div className="animate-fade-up pb-24 px-4">
        {/* Шапка */}
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-brown-light mb-4 active:opacity-60"
        >
          <Icon name="back" size={20} />
          <span className="text-sm">Назад</span>
        </button>

        {/* Фото */}
        {photos.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-4">
            <img
              src={photos[0]}
              alt={selected.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Заголовок */}
        <h2 className="text-xl font-bold text-brown-dark mb-1">
          {selected.title}
        </h2>
        {selected.description && (
          <p className="text-sm text-brown-light mb-3">
            {selected.description}
          </p>
        )}

        {/* Теги */}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium">
            {selected.flour}
          </span>
          <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1">
            <Icon name="drop" size={12} />
            {selected.hydration}%
          </span>
          <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1">
            <Icon name="wheat" size={12} />
            {selected.starterPct}%
          </span>
        </div>

        {/* Автор + лайк + сохранение */}
        <div className="flex items-center justify-between mb-5 py-3 border-y border-warm-beige/60">
          <a
            href={`/baker/${selected.user?.id}`}
            className="text-sm font-semibold text-terracotta"
          >
            {selected.user?.name || "Аноним"}
          </a>
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleLike(selected.id)}
              className="flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Icon
                name={selected.isLikedByMe ? "heart-fill" : "heart"}
                size={20}
                className={
                  selected.isLikedByMe ? "text-terracotta" : "text-brown-light"
                }
              />
              <span className="text-sm text-brown-light">
                {selected.likesCount}
              </span>
            </button>
            {selected.user?.id !== currentUserId && (savedIds.has(selected.id) ? (
              <span className="text-sm text-green-happy font-medium">
                ✓ Сохранён
              </span>
            ) : (
              <button
                onClick={() => saveRecipe(selected.id)}
                disabled={savingId === selected.id}
                className="flex items-center gap-1 text-brown-light active:scale-95 transition-transform"
              >
                <Icon name="save" size={20} />
                <span className="text-sm">Сохранить</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ингредиенты */}
        {ingredients.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-bold text-brown mb-2">Ингредиенты</h3>
            <div className="space-y-1.5">
              {ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm text-brown-dark"
                >
                  <span>{ing.name}</span>
                  <span className="text-brown-light">
                    {ing.amount} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Шаги */}
        {steps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-brown mb-2">Приготовление</h3>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warm-beige text-brown text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-brown-dark leading-relaxed">
                    {step.text || (typeof step === "string" ? step : "")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Комментарии */}
        <div className="border-t border-warm-beige/60 pt-4">
          <h3 className="text-sm font-bold text-brown mb-3 flex items-center gap-2">
            <Icon name="comment" size={16} />
            Комментарии ({selected.commentsCount})
          </h3>

          {commentsLoading ? (
            <p className="text-sm text-brown-light">Загрузка...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-brown-light mb-3">
              Пока нет комментариев
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div key={c.id} className="bg-warm-beige/30 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-brown">
                        {c.user.name}
                      </span>
                      <span className="text-[10px] text-brown-light">
                        {timeAgo(c.createdAt)}
                      </span>
                    </div>
                    {currentUserId === c.user.id && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="text-brown-light hover:text-terracotta p-1"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-brown-dark">{c.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Поле ввода */}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
              placeholder="Написать комментарий..."
              maxLength={500}
              className="flex-1 bg-warm-beige/40 rounded-xl px-3 py-2.5 text-sm text-brown-dark placeholder:text-brown-light/50 outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            <button
              onClick={sendComment}
              disabled={!commentText.trim()}
              className="bg-terracotta text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
            >
              →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Лента ---
  return (
    <div className="animate-fade-up pb-4 px-4">
      {/* Поиск */}
      <div className="relative mb-3">
        <Icon
          name="search"
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light/50"
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Поиск рецептов..."
          className="w-full bg-warm-beige/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-brown-dark placeholder:text-brown-light/50 outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </div>

      {/* Сортировка */}
      <div className="flex gap-2 mb-4">
        {(["new", "popular"] as SortMode[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              sort === s
                ? "bg-terracotta text-white"
                : "bg-warm-beige/50 text-brown-light"
            }`}
          >
            {s === "new" ? "Новое" : "Популярное"}
          </button>
        ))}
      </div>

      {/* Лента карточек */}
      {loading ? (
        <div className="text-center py-12 text-brown-light">Загрузка...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🍞</div>
          <p className="text-brown-light">
            {search
              ? "Ничего не найдено"
              : "Пока нет публичных рецептов. Поделитесь своим первым!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpen={() => openRecipe(recipe)}
              onLike={() => toggleLike(recipe.id)}
              onSave={() => saveRecipe(recipe.id)}
              saving={savingId === recipe.id}
              saved={savedIds.has(recipe.id)}
              isOwn={recipe.user?.id === currentUserId}
            />
          ))}
        </div>
      )}

      {/* Sentinel для подгрузки */}
      {hasMore && (
        <div ref={sentinelRef} className="py-4 text-center">
          {loadingMore && (
            <span className="text-sm text-brown-light">Загрузка...</span>
          )}
        </div>
      )}
    </div>
  );
}

// --- Карточка рецепта ---
function RecipeCard({
  recipe,
  onOpen,
  onLike,
  onSave,
  saving,
  saved,
  isOwn,
}: {
  recipe: CommunityRecipe;
  onOpen: () => void;
  onLike: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  isOwn?: boolean;
}) {
  const photoUrl = recipe.photos
    ? (() => {
        try {
          const urls: string[] = JSON.parse(recipe.photos!);
          return urls.length > 0 ? urls[0] : null;
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="bg-card rounded-2xl card-shadow border border-warm-beige/60 overflow-hidden">
      {/* Фото */}
      {photoUrl && (
        <button onClick={onOpen} className="block w-full">
          <img
            src={photoUrl}
            alt={recipe.title}
            className="w-full h-44 object-cover"
          />
        </button>
      )}

      <div className="p-4">
        {/* Название */}
        <button onClick={onOpen} className="text-left w-full">
          <h3 className="font-bold text-brown-dark text-base mb-1 leading-snug">
            {recipe.title}
          </h3>
        </button>

        {recipe.description && (
          <p className="text-sm text-brown-light mb-2 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Теги */}
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

        {/* Футер: автор + лайк + комментарии + сохранение */}
        <div className="flex items-center justify-between pt-2 border-t border-warm-beige/40">
          <a
            href={`/baker/${recipe.user?.id}`}
            className="text-xs font-semibold text-terracotta truncate max-w-[100px]"
            onClick={(e) => e.stopPropagation()}
          >
            {recipe.user?.name || "Аноним"}
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className="flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Icon
                name={recipe.isLikedByMe ? "heart-fill" : "heart"}
                size={18}
                className={
                  recipe.isLikedByMe ? "text-terracotta" : "text-brown-light"
                }
              />
              <span className="text-xs text-brown-light">
                {recipe.likesCount || ""}
              </span>
            </button>

            <button
              onClick={onOpen}
              className="flex items-center gap-1 text-brown-light"
            >
              <Icon name="comment" size={18} />
              <span className="text-xs">{recipe.commentsCount || ""}</span>
            </button>

            {!isOwn && (saved ? (
              <span className="text-green-happy">
                <Icon name="bookmark-fill" size={18} />
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                disabled={saving}
                className="text-brown-light active:scale-95 transition-transform"
              >
                <Icon name="save" size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
