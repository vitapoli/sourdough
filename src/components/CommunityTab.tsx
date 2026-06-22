"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Icon } from "./Icon";
import { useT, useLang } from "@/lib/i18n";

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
  translations: string | null;
  photos: string | null;
  createdAt: string;
  user: { id: string; name: string } | null;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
}

// Перевод рецепта, как его отдаёт /api/recipes/translate.
// ingredients и steps — это JSON-строки (тот же формат, что в самом рецепте).
interface RecipeTranslation {
  title: string;
  description: string | null;
  flour: string;
  ingredients: string | null;
  steps: string;
}

interface CommentData {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string };
}

type SortMode = "new" | "popular";

// Относительное время
function timeAgo(dateStr: string, t: (k: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("community.justNow");
  if (mins < 60) return `${mins}${t("community.minAgo")}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${t("community.hAgo")}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}${t("community.dAgo")}`;
  const months = Math.floor(days / 30);
  return `${months}${t("community.monthAgo")}`;
}

export function CommunityTab() {
  const t = useT();
  const { lang } = useLang();
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
  // Перевод открытого рецепта: свежий по кнопке + переключатель «оригинал».
  // Привязаны к рецепту+языку через ключ, чтобы при смене рецепта/языка сбрасываться.
  const [freshTr, setFreshTr] = useState<{ key: string; tr: RecipeTranslation } | null>(null);
  const [showOrigTr, setShowOrigTr] = useState<{ key: string; on: boolean } | null>(null);
  const [translating, setTranslating] = useState(false);
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

  // Перевести открытый рецепт. Рецепты в ленте публичные — API это разрешает,
  // перевод кэшируется в самом рецепте (общий кэш для всех).
  const handleTranslate = async () => {
    if (!selected) return;
    const key = `${selected.id}:${lang}`;
    setTranslating(true);
    try {
      const res = await fetch("/api/recipes/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, targetLang: lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(t("recipes.translateError") + ": " + (data.error || ""));
        return;
      }
      setFreshTr({ key, tr: data });
      setShowOrigTr({ key, on: false });
    } catch (e) {
      alert(t("recipes.translateError") + ": " + String(e));
    } finally {
      setTranslating(false);
    }
  };

  // --- Детальный вид рецепта ---
  if (selected) {
    // Перевод: нужен, если язык рецепта ≠ языку интерфейса. Берём свежий перевод
    // (по кнопке) или уже сохранённый в БД, плюс переключатель «оригинал».
    const viewKey = `${selected.id}:${lang}`;
    const origLang = /[а-яё]/i.test(selected.title) ? "ru" : "en";
    const needsTranslation = origLang !== lang;
    let savedTranslation: RecipeTranslation | null = null;
    try {
      savedTranslation = selected.translations
        ? (JSON.parse(selected.translations) as Record<string, RecipeTranslation>)[lang] ?? null
        : null;
    } catch { /* */ }
    const translation = freshTr?.key === viewKey ? freshTr.tr : savedTranslation;
    const showOriginal = showOrigTr?.key === viewKey ? showOrigTr.on : false;
    const active = needsTranslation && !showOriginal ? translation : null;

    const dTitle = active?.title ?? selected.title;
    const dDescription = active ? active.description : selected.description;
    const dFlour = active?.flour ?? selected.flour;
    const dIngredients = active?.ingredients ?? selected.ingredients;
    const dSteps = active?.steps ?? selected.steps;

    const photos: string[] = selected.photos
      ? JSON.parse(selected.photos)
      : [];
    let ingredients: { name: string; amount: string; unit: string; phase?: string }[] = [];
    try {
      ingredients = dIngredients ? JSON.parse(dIngredients) : [];
    } catch { /* */ }
    let steps: { text: string }[] = [];
    try {
      const parsed = JSON.parse(dSteps);
      steps = Array.isArray(parsed) ? parsed : [];
    } catch { /* */ }

    return (
      <div className="animate-fade-up pb-24 px-4 max-w-[416px] mx-auto">
        {/* Шапка */}
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-brown-light mb-4 active:opacity-60"
        >
          <Icon name="back" size={20} />
          <span className="text-sm">{t("back")}</span>
        </button>

        {/* Фото */}
        {photos.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-4">
            <img
              src={photos[0]}
              alt={dTitle}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Заголовок */}
        <h2 className="text-xl font-bold text-brown-dark mb-1">
          {dTitle}
        </h2>
        {dDescription && (
          <p className="text-sm text-brown-light mb-3">
            {dDescription}
          </p>
        )}

        {/* Теги */}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium">
            {dFlour}
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

        {/* Перевод рецепта */}
        {needsTranslation && (
          <div className="mb-4">
            {translation ? (
              <button
                onClick={() => setShowOrigTr({ key: viewKey, on: !showOriginal })}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta hover:underline"
              >
                <Icon name="globe" size={14} />
                {showOriginal ? t("recipes.showTranslation") : t("recipes.showOriginal")}
              </button>
            ) : (
              <button
                onClick={handleTranslate}
                disabled={translating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warm-beige/50 text-brown rounded-xl text-xs font-bold hover:bg-warm-beige transition-colors disabled:opacity-50"
              >
                <Icon name="globe" size={14} />
                {translating ? t("recipes.translating") : t("recipes.translate")}
              </button>
            )}
          </div>
        )}

        {/* Автор + лайк + сохранение */}
        <div className="flex items-center justify-between mb-5 py-3 border-y border-warm-beige/60">
          <a
            href={`/baker/${selected.user?.id}`}
            className="text-sm font-semibold text-terracotta"
          >
            {selected.user?.name || t("community.anon")}
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
                ✓ {t("community.saved")}
              </span>
            ) : (
              <button
                onClick={() => saveRecipe(selected.id)}
                disabled={savingId === selected.id}
                className="flex items-center gap-1 text-brown-light active:scale-95 transition-transform"
              >
                <Icon name="save" size={20} />
                <span className="text-sm">{t("save")}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ингредиенты */}
        {ingredients.length > 0 && (() => {
          const recipePhases = [...new Set(ingredients.map((ing) => ing.phase).filter(Boolean))] as string[];
          const noPhase = ingredients.filter((ing) => !ing.phase);
          const renderIng = (
            ing: { name: string; amount: string; unit: string },
            i: number
          ) => (
            <div key={i} className="flex justify-between text-sm text-brown-dark">
              <span>{ing.name}</span>
              <span className="text-brown-light">
                {ing.amount} {ing.unit}
              </span>
            </div>
          );
          return (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-brown mb-2">{t("community.ingredients")}</h3>
              <div className="space-y-3">
                {noPhase.length > 0 && (
                  <div className="space-y-1.5">
                    {noPhase.map((ing, i) => renderIng(ing, i))}
                  </div>
                )}
                {recipePhases.map((phase) => (
                  <div key={phase}>
                    <p className="text-xs font-bold text-golden mb-1">{phase}</p>
                    <div className="space-y-1.5 border-l-2 border-golden/30 pl-3">
                      {ingredients
                        .filter((ing) => ing.phase === phase)
                        .map((ing, i) => renderIng(ing, i))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Шаги */}
        {steps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-brown mb-2">{t("community.steps")}</h3>
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
            {t("community.comments")} ({selected.commentsCount})
          </h3>

          {commentsLoading ? (
            <p className="text-sm text-brown-light">{t("loading")}</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-brown-light mb-3">
              {t("community.noComments")}
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
                        {timeAgo(c.createdAt, t)}
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
              placeholder={t("community.commentPlaceholder")}
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
    <div className="animate-fade-up pb-4 px-4 max-w-[416px] mx-auto">
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
          placeholder={t("community.searchPlaceholder")}
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
            {s === "new" ? t("community.new") : t("community.popular")}
          </button>
        ))}
      </div>

      {/* Лента карточек */}
      {loading ? (
        <div className="text-center py-12 text-brown-light">{t("loading")}</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🍞</div>
          <p className="text-brown-light">
            {search
              ? t("community.nothingFound")
              : t("community.noRecipes")}
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
            <span className="text-sm text-brown-light">{t("loading")}</span>
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
  const t = useT();
  const { lang } = useLang();
  const [freshTr, setFreshTr] = useState<RecipeTranslation | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Перевод видимых полей карточки (заголовок, описание, мука) в язык интерфейса.
  const origLang = /[а-яё]/i.test(recipe.title) ? "ru" : "en";
  const needsTr = origLang !== lang;
  let savedTr: RecipeTranslation | null = null;
  try {
    savedTr = recipe.translations
      ? (JSON.parse(recipe.translations) as Record<string, RecipeTranslation>)[lang] ?? null
      : null;
  } catch { /* */ }
  const tr = freshTr ?? savedTr;
  const active = needsTr && !showOriginal ? tr : null;
  const dTitle = active?.title ?? recipe.title;
  const dDescription = active ? active.description : recipe.description;
  const dFlour = active?.flour ?? recipe.flour;

  async function translateCard() {
    setTranslating(true);
    try {
      const res = await fetch("/api/recipes/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recipe.id, targetLang: lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(t("recipes.translateError") + ": " + (data.error || ""));
        return;
      }
      setFreshTr(data);
      setShowOriginal(false);
    } catch (err) {
      alert(t("recipes.translateError") + ": " + String(err));
    } finally {
      setTranslating(false);
    }
  }

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
            alt={dTitle}
            loading="lazy"
            className="w-full h-44 object-cover"
          />
        </button>
      )}

      <div className="p-4">
        {/* Название */}
        <button onClick={onOpen} className="text-left w-full">
          <h3 className="font-bold text-brown-dark text-base mb-1 leading-snug">
            {dTitle}
          </h3>
        </button>

        {dDescription && (
          <p className="text-sm text-brown-light mb-2 line-clamp-2">
            {dDescription}
          </p>
        )}

        {/* Теги */}
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

        {/* Перевод рецепта */}
        {needsTr && (
          <div className="mb-3 -mt-1">
            {tr ? (
              <button
                onClick={() => setShowOriginal((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-bold text-terracotta hover:underline"
              >
                <Icon name="globe" size={13} />
                {showOriginal ? t("recipes.showTranslation") : t("recipes.showOriginal")}
              </button>
            ) : (
              <button
                onClick={translateCard}
                disabled={translating}
                className="inline-flex items-center gap-1 text-xs font-bold text-brown-light hover:text-terracotta transition-colors disabled:opacity-50"
              >
                <Icon name="globe" size={13} />
                {translating ? t("recipes.translating") : t("recipes.translate")}
              </button>
            )}
          </div>
        )}

        {/* Футер: автор + лайк + комментарии + сохранение */}
        <div className="flex items-center justify-between pt-2 border-t border-warm-beige/40">
          <a
            href={`/baker/${recipe.user?.id}`}
            className="text-xs font-semibold text-terracotta truncate max-w-[100px]"
            onClick={(e) => e.stopPropagation()}
          >
            {recipe.user?.name || t("community.anon")}
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
