"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";
import { PhotoViewer } from "./PhotoViewer";
import { useT, useLang, translateBuiltInRecipe } from "@/lib/i18n";
import { track } from "@/lib/metrika";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  phase?: string;
  hydration?: number;
  pinned?: boolean;
  pinnedUnit?: "g" | "%";
  role?: "flour" | "liquid" | "starter" | "none";
}

const FLOUR_KW = ["мука", "солод"];
const LIQUID_KW = ["вода", "кипяток", "молоко", "кефир", "пахта", "сыворотка", "сок", "йогурт", "какао", "чай", "квас", "газировка", "чайный гриб"];
const STARTER_KW = ["закваска", "стартер", "левен", "leaven", "материнская", "культура"];
const IS_DRY = (n: string) => /сух[оиейая]/i.test(n);

type IngRole = "flour" | "liquid" | "starter" | "none";

function detectRole(name: string): IngRole {
  const n = name.toLowerCase();
  if (STARTER_KW.some(k => n.includes(k))) return "starter";
  if (FLOUR_KW.some(k => n.includes(k))) return "flour";
  if (!IS_DRY(name) && LIQUID_KW.some(k => n.includes(k))) return "liquid";
  return "none";
}

function getRole(ing: Ingredient): IngRole {
  return ing.role ?? detectRole(ing.name);
}

function getRoleLabel(role: IngRole, t: (k: string) => string): string {
  if (role === "flour") return t("recipes.roleFlour");
  if (role === "liquid") return t("recipes.roleLiquid");
  if (role === "starter") return t("recipes.roleStarter");
  return t("recipes.roleNone");
}
const ROLE_COLORS: Record<IngRole, string> = {
  flour: "bg-amber-100 text-amber-700 border-amber-300",
  liquid: "bg-blue-100 text-blue-600 border-blue-300",
  starter: "bg-green-100 text-green-700 border-green-300",
  none: "bg-gray-100 text-gray-400 border-gray-300",
};
const ROLE_ORDER: IngRole[] = ["flour", "liquid", "starter", "none"];

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  flour: string;
  hydration: number;
  starterPct: number;
  salt: number | null;
  ingredients: string | null;
  hydrationCalc: string | null;
  steps: string;
  translations: string | null;
  photos: string | null;
  isBuiltIn: boolean;
  pinned: boolean;
  hidden: boolean;
  isPublic: boolean;
  previewHidden: string | null;
  parentId: string | null;
  variants?: Recipe[];
  savedFrom?: { id: string; name: string };
}

function RecipeCardContent({ recipe }: { recipe: Recipe }) {
  const t = useT();
  const photoUrl = recipe.photos ? (() => { const u: string[] = JSON.parse(recipe.photos); return u.length > 0 ? u[0] : null; })() : null;
  const hasDescription = !!recipe.description;

  const tags = (
    <div className="flex gap-2 flex-wrap">
      {(() => { const h: string[] = recipe.previewHidden ? JSON.parse(recipe.previewHidden) : []; return (<>
      {!h.includes("flour") && (
      <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium">
        {recipe.flour}
      </span>
      )}
      {!h.includes("hydration") && (
      <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1">
        <Icon name="drop" size={14} /> {recipe.hydration}%
      </span>
      )}
      {!h.includes("starter") && (
      <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1">
        <img src="/ear.png" alt="" className="h-3.5 w-auto inline" /> {recipe.starterPct}%
      </span>
      )}
      </>); })()}
      {recipe.ingredients && (() => {
        const ings: Ingredient[] = JSON.parse(recipe.ingredients);
        const flourKeywords = ["мука", "солод"];
        const totalFlour = ings
          .filter(ing => flourKeywords.some(k => ing.name.toLowerCase().includes(k)))
          .reduce((sum, ing) => sum + (parseFloat(ing.amount) || 0), 0);
        return ings.filter(ing => ing.pinned).map((ing, i) => {
          const amount = parseFloat(ing.amount) || 0;
          const display = ing.pinnedUnit === "%" && totalFlour > 0
            ? `${Math.round(amount / totalFlour * 100)}%`
            : `${ing.amount}${ing.unit}`;
          return (
            <span key={i} className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium">
              {ing.name} {display}
            </span>
          );
        });
      })()}
    </div>
  );

  const hidden: string[] = recipe.previewHidden ? JSON.parse(recipe.previewHidden) : [];
  const hasDefaultTags = !hidden.includes("flour") || !hidden.includes("hydration") || !hidden.includes("starter");
  const hasCustomPinned = recipe.ingredients ? (() => {
    const ings: Ingredient[] = JSON.parse(recipe.ingredients);
    return ings.some(ing => ing.pinned);
  })() : false;
  const hasPinnedIngs = hasDefaultTags || hasCustomPinned;

  const pinnedIcon = (recipe.pinned || recipe.isPublic) && (
    <span className="absolute top-3 right-3 flex gap-1">
      {recipe.isPublic && <Icon name="globe" size={16} className="text-terracotta" />}
      {recipe.pinned && <Icon name="bookmark-fill" size={16} className="text-golden" />}
    </span>
  );

  const titleRow = (
    <div className="flex justify-between items-start mb-1 pr-6">
      <h3 className="font-extrabold text-brown-dark text-lg leading-tight">
        {recipe.title}
      </h3>
      {recipe.isBuiltIn && (
        <span className="text-xs bg-golden/15 text-golden px-2.5 py-0.5 rounded-full font-bold shrink-0 ml-2 border border-golden/30">
          {t("recipes.builtin")}
        </span>
      )}
      {recipe.savedFrom && (
        <a href={`/baker/${recipe.savedFrom.id}`} className="text-xs bg-terracotta/10 text-terracotta px-2.5 py-0.5 rounded-full font-bold shrink-0 ml-2 border border-terracotta/30 truncate max-w-[140px]">
          {t("recipes.by")} {recipe.savedFrom.name}
        </a>
      )}
    </div>
  );

  // Фото + закреплённые ингредиенты → фото напротив тегов
  if (photoUrl && hasPinnedIngs) {
    return (
      <div className="w-full p-4 text-left relative">
        {pinnedIcon}
        {titleRow}
        {hasDescription && (
          <p className="text-sm text-brown-light mb-1.5 line-clamp-2">{recipe.description}</p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">{tags}</div>
          <img src={photoUrl} alt="" loading="lazy" className="w-14 h-14 object-cover rounded-xl shrink-0" />
        </div>
      </div>
    );
  }

  // Фото + описание (без закреплённых) → фото напротив описания
  if (photoUrl && hasDescription) {
    return (
      <div className="w-full p-4 text-left relative">
        {pinnedIcon}
        {titleRow}
        <div className="flex gap-3 mb-1.5">
          <p className="text-sm text-brown-light line-clamp-2 flex-1 min-w-0">{recipe.description}</p>
          <img src={photoUrl} alt="" loading="lazy" className="w-14 h-14 object-cover rounded-xl shrink-0" />
        </div>
        {tags}
      </div>
    );
  }

  // Остальное — фото напротив названия
  return (
    <div className="w-full p-4 text-left relative">
      {pinnedIcon}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          {titleRow}
          {hasDescription && (
            <p className="text-sm text-brown-light mb-1.5 line-clamp-2">{recipe.description}</p>
          )}
          {tags}
        </div>
        {photoUrl && (
          <img src={photoUrl} alt="" loading="lazy" className="w-14 h-14 object-cover rounded-xl shrink-0" />
        )}
      </div>
    </div>
  );
}

function DraggableRecipeList({
  recipes,
  onSelect,
  onTogglePin,
  onToggleHide,
  onTogglePublic,
  onReorder,
}: {
  recipes: Recipe[];
  onSelect: (r: Recipe) => void;
  onTogglePin: (r: Recipe) => void;
  onToggleHide: (r: Recipe) => void;
  onTogglePublic: (r: Recipe) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  const t = useT();
  const [menuRecipe, setMenuRecipe] = useState<Recipe | null>(null);
  // phase: null → "menu" (показано меню) → "drag" (перетаскивание)
  const [phase, setPhase] = useState<null | "menu" | "drag">(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchRef = useRef<{
    recipe: Recipe;
    idx: number;
    el: HTMLDivElement;
    startY: number;
    lastY: number;
  } | null>(null);
  const dragRef = useRef<{
    currentIdx: number;
    originalIdx: number;
    heights: number[];
  } | null>(null);
  const blockClick = useRef(false);
  const phaseRef = useRef<null | "menu" | "drag">(null);

  // Блокировка скролла через non-passive listener на document
  useEffect(() => {
    function preventScroll(e: TouchEvent) {
      if (phaseRef.current) e.preventDefault();
    }
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, []);

  function getChildren(): HTMLDivElement[] {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.children) as HTMLDivElement[];
  }

  // --- Фаза 1: touchstart / mousedown → запускаем таймер long press ---
  function handleTouchStart(e: React.TouchEvent, recipe: Recipe, idx: number) {
    const y = e.touches[0].clientY;
    const el = e.currentTarget as HTMLDivElement;
    touchRef.current = { recipe, idx, el, startY: y, lastY: y };

    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      e.preventDefault();
      window.getSelection()?.removeAllRanges();
      setMenuRecipe(recipe);
      setPhase("menu");
      phaseRef.current = "menu";
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  }

  function handleMouseDown(e: React.MouseEvent, recipe: Recipe) {
    if (e.button !== 0) return; // только левая кнопка
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      blockClick.current = true;
      setTimeout(() => { blockClick.current = false; }, 300);
      setMenuRecipe(recipe);
      setPhase("menu");
      phaseRef.current = "menu";
    }, 500);
  }

  function handleMouseUp() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  // --- Фаза 2: touchmove ---
  function handleTouchMove(e: React.TouchEvent) {
    const t = touchRef.current;
    if (!t) return;

    const y = e.touches[0].clientY;
    t.lastY = y;

    // До long press: если палец ушёл далеко — отменяем (это скролл)
    if (longPressTimer.current) {
      if (Math.abs(y - t.startY) > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        touchRef.current = null;
      }
      return;
    }

    // Фаза "menu": палец двигается → переходим в drag
    if (phase === "menu" && Math.abs(y - t.startY) > 8) {
      setMenuRecipe(null);
      setPhase("drag");
      phaseRef.current = "drag";

      // Инициализация drag
      const children = getChildren();
      const heights = children.map(c => c.getBoundingClientRect().height);
      dragRef.current = { currentIdx: t.idx, originalIdx: t.idx, heights };

      // Поднимаем карточку
      t.el.style.transition = "none";
      t.el.style.transform = "scale(1.03)";
      t.el.style.boxShadow = "0 8px 30px rgba(0,0,0,0.18)";
      t.el.style.zIndex = "30";
      t.el.style.position = "relative";

      // Обновляем startY чтобы drag начинался от текущей позиции пальца
      t.startY = y;
    }

    // Фаза "drag": двигаем карточку
    if (phase === "drag" || (dragRef.current)) {
      e.preventDefault();
      const d = dragRef.current;
      if (!d) return;

      const deltaY = y - t.startY;
      t.el.style.transform = `translateY(${deltaY}px) scale(1.03)`;

      // Вычисляем новую позицию
      const gap = 12;
      let accumulated = 0;
      let newIdx = d.originalIdx;

      if (deltaY > 0) {
        for (let i = d.originalIdx + 1; i < recipes.length; i++) {
          accumulated += d.heights[i] + gap;
          if (deltaY > accumulated - d.heights[i] / 2) newIdx = i;
          else break;
        }
      } else {
        for (let i = d.originalIdx - 1; i >= 0; i--) {
          accumulated -= d.heights[i] + gap;
          if (deltaY < accumulated + d.heights[i] / 2) newIdx = i;
          else break;
        }
      }

      if (newIdx !== d.currentIdx) {
        d.currentIdx = newIdx;
        const children = getChildren();
        for (let i = 0; i < children.length; i++) {
          if (i === d.originalIdx) continue;
          let shift = 0;
          if (d.originalIdx < d.currentIdx && i > d.originalIdx && i <= d.currentIdx) {
            shift = -(d.heights[d.originalIdx] + gap);
          } else if (d.originalIdx > d.currentIdx && i >= d.currentIdx && i < d.originalIdx) {
            shift = d.heights[d.originalIdx] + gap;
          }
          children[i].style.transition = "transform 200ms ease";
          children[i].style.transform = shift ? `translateY(${shift}px)` : "";
        }
      }
    }
  }

  // --- Фаза 3: touchend ---
  function handleTouchEnd() {
    // Отменяем таймер если ещё не сработал
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const t = touchRef.current;
    const d = dragRef.current;

    // Сброс стилей
    if (d && t) {
      const children = getChildren();
      for (const child of children) {
        child.style.transition = "";
        child.style.transform = "";
        child.style.boxShadow = "";
        child.style.zIndex = "";
        child.style.position = "";
      }

      if (d.currentIdx !== d.originalIdx) {
        const newOrder = recipes.map(r => r.id);
        const [moved] = newOrder.splice(d.originalIdx, 1);
        newOrder.splice(d.currentIdx, 0, moved);
        onReorder(newOrder);
      }

      blockClick.current = true;
      setTimeout(() => { blockClick.current = false; }, 200);
    }

    // Если фаза menu — меню уже показано, не трогаем его (пользователь нажмёт кнопку)
    if (phaseRef.current !== "menu") {
      setPhase(null); phaseRef.current = null;
    }

    touchRef.current = null;
    dragRef.current = null;
  }

  function handleClick(recipe: Recipe) {
    if (!blockClick.current && !phase) onSelect(recipe);
  }

  return (
    <>
      <div
        ref={containerRef}
        className="w-full max-w-sm space-y-3 select-none no-callout"
        style={{ touchAction: phase ? "none" : undefined } as React.CSSProperties}
      >
        {recipes.map((r, i) => (
          <div
            key={r.id}
            className={`bg-card rounded-2xl card-shadow border select-none cursor-pointer active:scale-[0.98] hover:card-shadow-lg hover:border-terracotta/30 will-change-transform ${
              r.hidden ? "opacity-50 border-warm-beige/40" : r.pinned ? "border-golden/40" : "border-warm-beige/60"
            }`}
            style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
            onTouchStart={(e) => handleTouchStart(e, r, i)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={(e) => handleMouseDown(e, r)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => handleClick(r)}
            onContextMenu={(e) => { e.preventDefault(); setMenuRecipe(r); setPhase("menu"); }}
          >
            <RecipeCardContent recipe={r} />
          </div>
        ))}
      </div>

      {/* Контекстное меню — появляется при долгом нажатии */}
      {menuRecipe && phase === "menu" && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setMenuRecipe(null); setPhase(null); phaseRef.current = null; }} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl card-shadow-lg border-2 border-warm-beige overflow-hidden min-w-[220px] animate-fade-up select-none">
            <p className="px-4 pt-3 pb-1.5 text-xs font-bold text-brown-light truncate">{menuRecipe.title}</p>
            <button
              onClick={() => { onTogglePin(menuRecipe); setMenuRecipe(null); setPhase(null); phaseRef.current = null; }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-brown hover:bg-warm-beige/50 transition-colors"
            >
              <Icon name={menuRecipe.pinned ? "bookmark-fill" : "bookmark"} size={18} className={menuRecipe.pinned ? "text-golden" : ""} />
              {menuRecipe.pinned ? t("recipes.unpin") : t("recipes.pin")}
            </button>
            <button
              onClick={() => { onToggleHide(menuRecipe); setMenuRecipe(null); setPhase(null); phaseRef.current = null; }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-brown hover:bg-warm-beige/50 transition-colors border-t border-warm-beige/60"
            >
              <Icon name={menuRecipe.hidden ? "eye" : "eye-off"} size={18} />
              {menuRecipe.hidden ? t("recipes.show") : t("recipes.hide")}
            </button>
            {!menuRecipe.isBuiltIn && (
            <button
              onClick={() => { onTogglePublic(menuRecipe); setMenuRecipe(null); setPhase(null); phaseRef.current = null; }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-brown hover:bg-warm-beige/50 transition-colors border-t border-warm-beige/60"
            >
              <Icon name="globe" size={18} className={menuRecipe.isPublic ? "text-terracotta" : ""} />
              {menuRecipe.isPublic ? t("recipes.unpublish") : t("recipes.publish")}
            </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

interface TranslatedFields {
  title: string;
  description: string | null;
  flour: string;
  ingredients: string | null;
  steps: string;
}

function RecipeDetail({
  recipe,
  onBack,
  onDeleted,
  onEdit,
  onConvert,
  onSelectVariant,
}: {
  recipe: Recipe;
  onBack: () => void;
  onDeleted: () => void;
  onEdit: () => void;
  onConvert: () => void;
  onSelectVariant: (r: Recipe) => void;
}) {
  const t = useT();
  const { lang } = useLang();
  const [deleting, setDeleting] = useState(false);
  const [viewPhotos, setViewPhotos] = useState<string[] | null>(null);
  const [viewPhotoIndex, setViewPhotoIndex] = useState(0);
  const [printWithPhotos, setPrintWithPhotos] = useState(true);
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  // Перевод рецепта (DeepL). Встроенные рецепты переводятся отдельно (в списке),
  // поэтому к моменту показа их название уже на нужном языке — кнопка не появится.
  const origLang = /[а-яё]/i.test(recipe.title) ? "ru" : "en";
  const needsTranslation = origLang !== lang;

  // Сохранённый в БД перевод (если есть) — читаем при рендере, без useEffect
  const savedTranslation: TranslatedFields | null = recipe.translations
    ? (JSON.parse(recipe.translations) as Record<string, TranslatedFields>)[lang] ?? null
    : null;

  // Свежий перевод по кнопке + переключатель «оригинал» привязаны к рецепту+языку
  // через viewKey: при смене рецепта или языка состояние само сбрасывается.
  const viewKey = `${recipe.id}:${lang}`;
  const [fresh, setFresh] = useState<{ key: string; tr: TranslatedFields } | null>(null);
  const [origToggle, setOrigToggle] = useState<{ key: string; on: boolean } | null>(null);
  const [translating, setTranslating] = useState(false);

  const translation = fresh?.key === viewKey ? fresh.tr : savedTranslation;
  const showOriginal = origToggle?.key === viewKey ? origToggle.on : false;
  const active = needsTranslation && !showOriginal ? translation : null;
  const dTitle = active?.title ?? recipe.title;
  const dDescription = active ? active.description : recipe.description;
  const dFlour = active?.flour ?? recipe.flour;
  const dIngredients = active?.ingredients ?? recipe.ingredients;
  const dSteps = active?.steps ?? recipe.steps;

  async function handleTranslate() {
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
      setFresh({ key: viewKey, tr: data });
      setOrigToggle({ key: viewKey, on: false });
    } catch (e) {
      alert(t("recipes.translateError") + ": " + String(e));
    } finally {
      setTranslating(false);
    }
  }

  function handleSharePdf() {
    const recipeSteps: string[] = JSON.parse(dSteps);
    const ings: Ingredient[] = dIngredients ? JSON.parse(dIngredients) : [];

    const photoUrls: string[] = recipe.photos ? JSON.parse(recipe.photos) : [];
    const photoHtml = printWithPhotos && photoUrls.length > 0
      ? `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">${photoUrls.map(u => `<img src="${u}" style="width:120px;height:120px;object-fit:cover;border-radius:12px">`).join("")}</div>`
      : "";

    let html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><title>${dTitle}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Nunito',system-ui,sans-serif;background:#FDF8F3;color:#5C4033;padding:32px 24px;max-width:500px;margin:0 auto}
h1{font-size:22px;font-weight:800;color:#3D2C1E;margin-bottom:6px}
.desc{color:#8B7355;font-size:14px;margin-bottom:16px;line-height:1.5}
.tags{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.tag{background:#EDE5D8;color:#5C4033;padding:6px 12px;border-radius:10px;font-size:12px;font-weight:600}
.section{background:white;border-radius:16px;padding:16px;margin-bottom:14px;border:1px solid #EDE5D8}
.section-title{font-size:14px;font-weight:800;color:#C67B5C;margin-bottom:10px}
.ing{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #F5EDE4}
.ing:last-child{border:none}
.ing-name{color:#5C4033}.ing-amount{color:#8B7355;font-weight:600}
.step{display:flex;gap:10px;margin-bottom:10px;font-size:13px;line-height:1.5}
.step-num{width:22px;height:22px;background:#C67B5C;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px}
.step-text{color:#5C4033}
.footer{text-align:center;margin-top:20px;font-size:11px;color:#B8A692}
@media print{body{padding:16px}@page{margin:10mm}}
</style></head><body>`;

    html += `<h1>${dTitle}</h1>`;
    if (dDescription) html += `<p class="desc">${dDescription}</p>`;
    html += `<div class="tags">
      <span class="tag">${dFlour}</span>
      <span class="tag"><svg style="display:inline-block;vertical-align:middle;margin-right:3px" width="12" height="12" viewBox="0 0 24 24" fill="#C67B5C"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z"/></svg>${t("recipes.hydration")} ${recipe.hydration}%</span>
      <span class="tag">${t("recipes.starter")} ${recipe.starterPct}%</span>
    </div>`;
    html += photoHtml;

    if (ings.length > 0) {
      html += `<div class="section"><div class="section-title">${t("recipes.ingredients")}</div>`;
      ings.forEach(ing => {
        html += `<div class="ing"><span class="ing-name">${ing.name}</span><span class="ing-amount">${ing.amount}${ing.unit}</span></div>`;
      });
      html += `</div>`;
    }

    if (recipeSteps.length > 0) {
      html += `<div class="section"><div class="section-title">${t("recipes.directions")}</div>`;
      recipeSteps.forEach((s, i) => {
        html += `<div class="step"><span class="step-num">${i + 1}</span><span class="step-text">${s}</span></div>`;
      });
      html += `</div>`;
    }

    html += `<div class="footer">Levain Lab — трекер закваски</div>`;
    html += `</body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  }

  async function handleDelete() {
    if (!confirm(t("recipes.deleteConfirm"))) return;
    setDeleting(true);
    await fetch("/api/recipes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id }),
    });
    onDeleted();
  }

  const [showDetailCalc, setShowDetailCalc] = useState(false);
  const savedStarterHydration = (() => {
    if (!dIngredients) return 100;
    const ings = JSON.parse(dIngredients) as Ingredient[];
    const starter = ings.find(ing => getRole(ing) === "starter");
    return starter?.hydration || 100;
  })();
  const [starterHydrationStr, setStarterHydrationStr] = useState(String(savedStarterHydration));
  const starterHydration = parseInt(starterHydrationStr) || 100;
  const [starterHydrationChanged, setStarterHydrationChanged] = useState(false);
  const steps: string[] = JSON.parse(dSteps);

  // Расчёт гидратации: вычислить из ингредиентов с учётом закваски
  const calcData: HydrationCalc | null = (() => {
    if (!dIngredients) {
      if (recipe.hydrationCalc) return JSON.parse(recipe.hydrationCalc) as HydrationCalc;
      return null;
    }

    const ings = JSON.parse(dIngredients) as Ingredient[];
    const flourItems: string[] = [];
    const liquidItems: string[] = [];
    let totalFlour = 0;
    let totalLiquid = 0;

    // Считаем компенсацию воды при смене гидратации закваски
    let calcWaterDiff = 0;
    if (starterHydrationChanged) {
      for (const ing of ings) {
        if (getRole(ing) === "starter") {
          const amount = parseFloat(ing.amount) || 0;
          const origH = ing.hydration || 100;
          const flour = amount / (1 + origH / 100);
          calcWaterDiff += (amount - flour) - flour * (starterHydration / 100);
        }
      }
    }
    let calcWaterDiffApplied = false;

    for (const ing of ings) {
      const amount = parseFloat(ing.amount) || 0;
      if (amount <= 0) continue;
      const role = getRole(ing);

      if (role === "starter") {
        const origH = ing.hydration || 100;
        const starterFlour = amount / (1 + origH / 100);
        const starterWater = starterFlour * (starterHydration / 100);
        flourItems.push(`${ing.name} (мука) ${Math.round(starterFlour)}г`);
        liquidItems.push(`${ing.name} (вода) ${Math.round(starterWater)}г`);
        totalFlour += starterFlour;
        totalLiquid += starterWater;
      } else if (role === "flour") {
        flourItems.push(`${ing.name} ${ing.amount}${ing.unit}`);
        totalFlour += amount;
      } else if (role === "liquid") {
        const adjusted = starterHydrationChanged && !calcWaterDiffApplied
          ? Math.round(amount + calcWaterDiff) : amount;
        if (starterHydrationChanged && !calcWaterDiffApplied) calcWaterDiffApplied = true;
        liquidItems.push(`${ing.name} ${adjusted}${ing.unit}`);
        totalLiquid += adjusted;
      }
    }

    if (totalFlour === 0) return null;
    const hydPct = Math.round(totalLiquid / totalFlour * 100);
    return {
      totalFlour: Math.round(totalFlour),
      flourItems,
      totalLiquid: Math.round(totalLiquid),
      liquidItems,
      formula: `${Math.round(totalLiquid)} / ${Math.round(totalFlour)} × 100 = ${hydPct}%`,
    };
  })();

  return (
    <div className="w-full max-w-sm space-y-4 animate-fade-up">
      <button
        onClick={onBack}
        className="text-terracotta font-bold text-sm hover:underline flex items-center gap-1"
      >
        <Icon name="back" size={16} /> {t("recipes.backToRecipes")}
      </button>

      <div className="bg-card rounded-2xl p-5 card-shadow border border-warm-beige/60">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-extrabold text-brown-dark">{dTitle}</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setShowPrintOptions(!showPrintOptions)}
              className={`transition-colors p-1 ${showPrintOptions ? "text-terracotta" : "text-brown-light hover:text-terracotta"}`}
              title={t("recipes.savePdf")}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 14l4 4 4-4M10 18V8M3 10V4a1 1 0 011-1h12a1 1 0 011 1v6" />
              </svg>
            </button>
            {!recipe.isBuiltIn && (<>
              <button
                onClick={onEdit}
                className="text-brown-light hover:text-terracotta transition-colors p-1"
                title={t("edit")}
              >
                <Icon name="pencil" size={20} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-brown-light hover:text-red-500 transition-colors p-1 disabled:opacity-50"
                title={t("recipes.deleteRecipe")}
              >
                <Icon name="trash" size={20} />
              </button>
            </>)}
          </div>
        </div>

        {needsTranslation && (
          <div className="mb-3">
            {translation ? (
              <button
                onClick={() => setOrigToggle({ key: viewKey, on: !showOriginal })}
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

        {showPrintOptions && (
          <div className="bg-warm-beige/30 rounded-xl p-3 mb-3 flex items-center justify-between animate-fade-up">
            {recipe.photos && (
              <label className="flex items-center gap-2 text-sm text-brown cursor-pointer">
                <input
                  type="checkbox"
                  checked={printWithPhotos}
                  onChange={(e) => setPrintWithPhotos(e.target.checked)}
                  className="accent-terracotta w-4 h-4"
                />
                {t("recipes.withPhoto")}
              </label>
            )}
            {!recipe.photos && <span />}
            <button
              onClick={() => { handleSharePdf(); setShowPrintOptions(false); }}
              className="px-4 py-1.5 bg-terracotta text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all"
            >
              {t("recipes.savePdf")}
            </button>
          </div>
        )}

        {dDescription && (
          <p className="text-brown-light mb-4">{dDescription}</p>
        )}

        {recipe.photos && (() => {
          const photoUrls: string[] = JSON.parse(recipe.photos);
          if (photoUrls.length === 0) return null;
          return (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {photoUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-28 h-28 object-cover rounded-xl border-2 border-warm-beige/60 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => { setViewPhotos(photoUrls); setViewPhotoIndex(i); }}
                />
              ))}
            </div>
          );
        })()}

        <div className="flex gap-3 flex-wrap mb-5">
          <div className="bg-warm-beige/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-brown-light">{t("recipes.flour")}</p>
            <p className="text-sm font-bold text-brown">{dFlour}</p>
          </div>
          <div className="bg-warm-beige/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-brown-light flex items-center gap-1 justify-center">
              <img src="/ear.png" alt="" className="h-3.5 w-auto inline opacity-60" /> {t("recipes.starter")}
            </p>
            <p className="text-sm font-bold text-brown">{recipe.starterPct}%</p>
          </div>
          {dIngredients && (() => {
            const ings = JSON.parse(dIngredients) as Ingredient[];
            const totalFlour = ings
              .filter(ing => getRole(ing) === "flour")
              .reduce((sum, ing) => sum + (parseFloat(ing.amount) || 0), 0);
            const pinned = ings.filter(ing => ing.pinned);
            return pinned.map((ing, i) => {
              const amount = parseFloat(ing.amount) || 0;
              const display = ing.pinnedUnit === "%" && totalFlour > 0
                ? `${Math.round(amount / totalFlour * 100)}%`
                : `${ing.amount}${ing.unit}`;
              return (
                <div key={i} className="bg-warm-beige/50 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-brown-light">{ing.name}</p>
                  <p className="text-sm font-bold text-brown">{display}</p>
                </div>
              );
            });
          })()}
          <div className="bg-warm-beige/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-brown-light flex items-center gap-1 justify-center">
              <Icon name="drop" size={14} /> {t("recipes.hydration")}
              {calcData && (
                <button
                  onClick={() => setShowDetailCalc(!showDetailCalc)}
                  className="text-terracotta hover:underline ml-1"
                >
                  {showDetailCalc ? "×" : "?"}
                </button>
              )}
            </p>
            <p className="text-sm font-bold text-brown">
              {calcData && starterHydrationChanged ? Math.round(calcData.totalLiquid / calcData.totalFlour * 100) : recipe.hydration}%
            </p>
          </div>
        </div>

        {showDetailCalc && calcData && (
          <div className="bg-warm-beige/40 rounded-xl p-3 text-sm space-y-2 animate-fade-up mb-4">
            <p className="font-bold text-brown-dark text-xs">{t("recipes.calcTitle")}</p>
            <div className="space-y-1">
              <p className="text-brown">
                <span className="font-medium">{t("recipes.flourLabel")} ({calcData.totalFlour}г):</span>{" "}
                {calcData.flourItems.join(", ")}
              </p>
              <p className="text-brown">
                <span className="font-medium">{t("recipes.liquidsLabel")} ({calcData.totalLiquid}г):</span>{" "}
                {calcData.liquidItems.join(", ")}
              </p>
              <p className="text-terracotta font-bold text-xs mt-1">
                {calcData.formula}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-warm-beige/60">
              <span className="text-xs text-brown-light shrink-0">{t("recipes.starterHydration")}</span>
              <input
                type="number"
                min="50"
                max="200"
                value={starterHydrationStr}
                onChange={(e) => { setStarterHydrationStr(e.target.value); setStarterHydrationChanged(true); }}
                className="w-16 px-2 py-1 border-2 border-warm-beige rounded-lg bg-cream text-sm font-bold text-brown-dark text-center focus:outline-none focus:border-terracotta transition-colors"
              />
              <span className="text-xs text-brown-light">%</span>
            </div>
          </div>
        )}

        {dIngredients && (() => {
          const ings = JSON.parse(dIngredients) as Ingredient[];
          const recipePhases = [...new Set(ings.map(ing => ing.phase).filter(Boolean))] as string[];
          const noPhase = ings.filter(ing => !ing.phase);
          // Считаем разницу воды при смене гидратации закваски
          let waterDiff = 0;
          if (starterHydrationChanged) {
            for (const ing of ings) {
              if (getRole(ing) === "starter") {
                const amount = parseFloat(ing.amount) || 0;
                const ingH = ing.hydration || 100;
                const flourInStarter = amount / (1 + ingH / 100);
                const originalWater = amount - flourInStarter;
                const newWater = flourInStarter * (starterHydration / 100);
                waterDiff = originalWater - newWater;
              }
            }
          }

          let waterDiffApplied = false;
          const renderIng = (ing: Ingredient, i: number) => {
            const role = getRole(ing);
            let displayAmount = ing.amount;
            if (role === "starter" && starterHydrationChanged) {
              const originalAmount = parseFloat(ing.amount) || 0;
              const ingH = ing.hydration || 100;
              const flourInStarter = originalAmount / (1 + ingH / 100);
              const newAmount = Math.round(flourInStarter * (1 + starterHydration / 100));
              displayAmount = String(newAmount);
            }
            if (role === "liquid" && starterHydrationChanged && waterDiff !== 0 && !waterDiffApplied) {
              const originalAmount = parseFloat(ing.amount) || 0;
              displayAmount = String(Math.round(originalAmount + waterDiff));
              waterDiffApplied = true;
            }
            return (
              <div key={i} className="flex justify-between items-center bg-warm-beige/30 rounded-lg px-3 py-1.5">
                <span className="text-sm text-brown">
                  {ing.name}
                  {role === "starter" && (
                    <span className="text-[10px] text-brown-light/70 bg-warm-beige/60 rounded-full px-1.5 py-0.5 ml-1.5">{starterHydration}%</span>
                  )}
                </span>
                <span className="text-sm font-bold text-brown-dark">{displayAmount} {ing.unit}</span>
              </div>
            );
          };

          return (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-brown-dark">{t("recipes.ingredients")}:</h3>
                <button
                  onClick={onConvert}
                  className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1"
                >
                  {t("recipes.recalculate")}
                </button>
              </div>
              <div className="space-y-3 mb-5">
                {noPhase.length > 0 && (
                  <div className="space-y-1.5">
                    {noPhase.map((ing, i) => renderIng(ing, i))}
                  </div>
                )}
                {recipePhases.map(phase => (
                  <div key={phase}>
                    <p className="text-xs font-bold text-golden mb-1">{phase}</p>
                    <div className="space-y-1.5 border-l-2 border-golden/30 pl-3">
                      {ings.filter(ing => ing.phase === phase).map((ing, i) => renderIng(ing, i))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}

        <h3 className="font-extrabold text-brown-dark mb-3">{t("recipes.directions")}:</h3>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-7 h-7 bg-terracotta text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-brown leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {/* Варианты рецепта */}
        {recipe.variants && recipe.variants.length > 0 && (
          <div className="mt-5 pt-4 border-t border-warm-beige">
            <h3 className="font-extrabold text-brown-dark mb-2">{t("recipes.variants")}</h3>
            <div className="space-y-1.5">
              {recipe.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelectVariant(v)}
                  className="w-full text-left bg-warm-beige/30 rounded-lg px-3 py-2 text-sm text-brown hover:bg-warm-beige/60 transition-colors flex justify-between items-center"
                >
                  <span>{v.title}</span>
                  <span className="text-xs text-brown-light">{v.hydration}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {viewPhotos && (
        <PhotoViewer
          photos={viewPhotos}
          startIndex={viewPhotoIndex}
          onClose={() => setViewPhotos(null)}
        />
      )}
    </div>
  );
}

interface HydrationCalc {
  totalFlour: number;
  flourItems: string[];
  totalLiquid: number;
  liquidItems: string[];
  formula: string;
}

interface ScannedRecipe {
  title?: string;
  description?: string | null;
  flour?: string;
  hydration?: number;
  hydrationCalc?: HydrationCalc;
  starterPct?: number;
  salt?: number | null;
  ingredients?: Ingredient[];
  steps?: string[];
}

const FLOUR_DB_VALUES = ["Пшеничная", "Ржаная"];
const FLOUR_EN: Record<string, string> = { "Пшеничная": "Wheat", "Ржаная": "Rye" };
const FLOUR_FROM_EN: Record<string, string> = { "Wheat": "Пшеничная", "Rye": "Ржаная" };

function AddRecipeForm({ onCreated, initial, editId, initialPhotos, initialPreviewHidden }: { onCreated: () => void; initial?: ScannedRecipe; editId?: string; initialPhotos?: string[]; initialPreviewHidden?: string[] }) {
  const t = useT();
  const { lang } = useLang();
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [flour, setFlour] = useState(initial?.flour || "Пшеничная");
  const [hydration, setHydration] = useState(initial?.hydration ? String(initial.hydration) : "");

  // Определяем, есть ли закваска в ингредиентах
  const hasStarter = (initial?.ingredients || []).some(ing =>
    ["закваска", "стартер", "левен", "leaven", "материнская", "культура"].some(k => ing.name.toLowerCase().includes(k))
  );

  const [starterPct, setStarterPct] = useState(() => {
    if (!hasStarter) return "";
    // Рассчитываем из ингредиентов: вес закваски / общий вес муки * 100
    const ings = initial?.ingredients || [];
    let totalFlour = 0;
    let totalStarter = 0;
    for (const ing of ings) {
      const amount = parseFloat(ing.amount) || 0;
      if (amount <= 0) continue;
      const role = getRole(ing);
      if (role === "flour") totalFlour += amount;
      if (role === "starter") totalStarter += amount;
    }
    if (totalFlour > 0 && totalStarter > 0) {
      return String(Math.round(totalStarter / totalFlour * 100));
    }
    if (initial?.starterPct != null && initial.starterPct > 0) return String(initial.starterPct);
    return "20";
  });
  const [salt, setSalt] = useState(() => {
    if (initial?.salt != null) return String(initial.salt);
    // Если соль не задана отдельно, но есть в ингредиентах — взять оттуда
    const saltIng = (initial?.ingredients || []).find(ing =>
      ing.name.toLowerCase().includes("соль") && !ing.name.toLowerCase().includes("солод")
    );
    if (saltIng?.amount) return String(saltIng.amount);
    return "";
  });
  const [showCalc, setShowCalc] = useState(false);
  const [showPhaseInput, setShowPhaseInput] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients || []
  );
  // Пересчёт процента закваски при изменении ингредиентов
  useEffect(() => {
    let totalFlour = 0;
    let totalStarter = 0;
    for (const ing of ingredients) {
      const amount = parseFloat(ing.amount) || 0;
      if (amount <= 0) continue;
      const role = getRole(ing);
      if (role === "flour") totalFlour += amount;
      if (role === "starter") totalStarter += amount;
    }
    if (totalFlour > 0 && totalStarter > 0) {
      setStarterPct(String(Math.round(totalStarter / totalFlour * 100)));
    }
  }, [ingredients]);

  const [stepsText, setStepsText] = useState(initial?.steps?.join("\n") || "");
  const [photos, setPhotos] = useState<string[]>(initialPhotos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);
  const [previewHidden, setPreviewHidden] = useState<string[]>(
    initialPreviewHidden || (!hasStarter && initial?.ingredients ? ["starter"] : [])
  );

  const savedStarterHydration = (() => {
    if (!hasStarter) return 0;
    const starter = (initial?.ingredients || []).find(ing => getRole(ing) === "starter");
    return starter?.hydration || 100;
  })();
  const [starterHydrationStr, setStarterHydrationStr] = useState(hasStarter ? String(savedStarterHydration) : "");
  const starterHydration = parseInt(starterHydrationStr) || 100;

  // Запоминаем оригинальные количества закваски и первой жидкости
  const [originalAmounts] = useState(() => {
    const starter: Record<number, number> = {};
    let firstLiquidIdx = -1;
    let firstLiquidAmount = 0;
    (initial?.ingredients || []).forEach((ing, i) => {
      if (getRole(ing) === "starter") starter[i] = parseFloat(ing.amount) || 0;
      if (getRole(ing) === "liquid" && firstLiquidIdx === -1) {
        firstLiquidIdx = i;
        firstLiquidAmount = parseFloat(ing.amount) || 0;
      }
    });
    return { starter, firstLiquidIdx, firstLiquidAmount };
  });

  function handleStarterHydrationChange(value: string) {
    setStarterHydrationStr(value);
    const newH = parseInt(value) || 100;

    // Считаем разницу воды от закваски
    let waterDiff = 0;
    for (const [idxStr, original] of Object.entries(originalAmounts.starter)) {
      const flourInStarter = original / (1 + savedStarterHydration / 100);
      const originalWater = original - flourInStarter;
      const newWater = flourInStarter * (newH / 100);
      waterDiff += originalWater - newWater;
    }

    setIngredients(prev => prev.map((ing, i) => {
      if (getRole(ing) === "starter") {
        const original = originalAmounts.starter[i];
        if (original === undefined) return ing;
        const flourInStarter = original / (1 + savedStarterHydration / 100);
        const newAmount = Math.round(flourInStarter * (1 + newH / 100));
        return { ...ing, amount: String(newAmount) };
      }
      // Компенсируем воду в первом жидком ингредиенте
      if (i === originalAmounts.firstLiquidIdx) {
        const newAmount = Math.round(originalAmounts.firstLiquidAmount + waterDiff);
        return { ...ing, amount: String(newAmount) };
      }
      return ing;
    }));
  }

  function pinAs(index: number, unit: "g" | "%") {
    setIngredients(prev => prev.map((ing, i) =>
      i === index ? { ...ing, pinned: true, pinnedUnit: unit } : ing
    ));
  }

  function unpin(index: number) {
    setIngredients(prev => prev.map((ing, i) =>
      i === index ? { ...ing, pinned: false, pinnedUnit: undefined } : ing
    ));
  }

  // Вычислить расчёт гидратации из текущих ингредиентов
  const liveCalcData: HydrationCalc | null = (() => {
    if (ingredients.length === 0) {
      if (initial?.hydrationCalc) return initial.hydrationCalc;
      return null;
    }

    const flourItems: string[] = [];
    const liquidItems: string[] = [];
    let totalFlour = 0;
    let totalLiquid = 0;

    for (const ing of ingredients) {
      const amount = parseFloat(ing.amount) || 0;
      if (amount <= 0) continue;
      const role = getRole(ing);

      if (role === "starter") {
        const sFlour = amount / (1 + starterHydration / 100);
        const sWater = amount - sFlour;
        flourItems.push(`${ing.name} (мука) ${Math.round(sFlour)}г`);
        liquidItems.push(`${ing.name} (вода) ${Math.round(sWater)}г`);
        totalFlour += sFlour;
        totalLiquid += sWater;
      } else if (role === "flour") {
        flourItems.push(`${ing.name} ${ing.amount}${ing.unit}`);
        totalFlour += amount;
      } else if (role === "liquid") {
        liquidItems.push(`${ing.name} ${ing.amount}${ing.unit}`);
        totalLiquid += amount;
      }
    }

    if (totalFlour === 0) return null;
    const hydPct = Math.round(totalLiquid / totalFlour * 100);
    return {
      totalFlour: Math.round(totalFlour),
      flourItems,
      totalLiquid: Math.round(totalLiquid),
      liquidItems,
      formula: `${Math.round(totalLiquid)} / ${Math.round(totalFlour)} × 100 = ${hydPct}%`,
    };
  })();

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
  }

  function removeIngredient(index: number) {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }

  function addIngredient(phase?: string) {
    setIngredients(prev => [...prev, { name: "", amount: "", unit: "г", phase: phase || undefined }]);
  }

  const phases = [...new Set(ingredients.map(ing => ing.phase).filter(Boolean))] as string[];

  function calcWaterFromHydration(newHydration: string) {
    const h = parseFloat(newHydration) || 0;
    if (h <= 0 || ingredients.length === 0) return;

    // Находим индекс первого ингредиента "вода" — его будем пересчитывать
    const mainWaterIdx = ingredients.findIndex(ing =>
      ing.name.toLowerCase().includes("вода")
    );
    if (mainWaterIdx < 0) return;

    let totalFlour = 0;
    let otherLiquid = 0;

    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      const amount = parseFloat(ing.amount) || 0;
      if (amount <= 0) continue;
      const role = getRole(ing);

      if (role === "starter") {
        const sFlour = amount / (1 + starterHydration / 100);
        totalFlour += sFlour;
        otherLiquid += amount - sFlour;
      } else if (role === "flour") {
        totalFlour += amount;
      } else if (role === "liquid" && i !== mainWaterIdx) {
        otherLiquid += amount;
      }
    }
    if (totalFlour <= 0) return;

    const totalNeededLiquid = Math.round(totalFlour * h / 100);
    const neededWater = Math.max(0, Math.round(totalNeededLiquid - otherLiquid));

    setIngredients(prev => prev.map((ing, i) =>
      i === mainWaterIdx ? { ...ing, amount: String(neededWater) } : ing
    ));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 3 - photos.length;
    if (remaining <= 0) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("type", "recipe");
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      formData.append("photos", files[i]);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.urls) {
        setPhotos(prev => [...prev, ...data.urls].slice(0, 3));
      } else {
        alert(t("recipes.photoUploadError") + ": " + (data.error || t("recipes.unknownError")));
      }
    } catch (err) {
      alert(t("recipes.photoUploadFailed") + ": " + String(err));
    }
    setUploadingPhoto(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const steps = stepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const filteredIngredients = ingredients.filter(ing => ing.name.trim()).map(ing => {
      if (getRole(ing) === "starter") {
        return { ...ing, hydration: starterHydration };
      }
      const { hydration: _h, ...rest } = ing;
      return rest;
    });

    const res = await fetch("/api/recipes", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(editId ? { id: editId } : {}),
        title: title.trim(),
        description: description.trim() || null,
        flour,
        hydration: liveCalcData ? Math.round(liveCalcData.totalLiquid / liveCalcData.totalFlour * 100) : (parseInt(hydration) || 70),
        starterPct: Math.max(0, parseInt(starterPct) || 0),
        salt: salt ? parseFloat(salt) : null,
        ingredients: filteredIngredients.length > 0 ? JSON.stringify(filteredIngredients) : null,
        hydrationCalc: initial?.hydrationCalc ? JSON.stringify(initial.hydrationCalc) : null,
        steps: JSON.stringify(steps),
        photos: photos.length > 0 ? JSON.stringify(photos) : null,
        previewHidden: previewHidden.length > 0 ? JSON.stringify(previewHidden) : null,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(t("recipes.saveError") + ": " + (err.error || t("recipes.unknownError")));
      setLoading(false);
      return;
    }

    setLoading(false);
    setTitle("");
    setDescription("");
    setStepsText("");
    onCreated();
  }

  const inputClass =
    "w-full mt-1 px-3 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm focus:outline-none focus:border-terracotta transition-colors";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card rounded-2xl p-5 card-shadow border border-warm-beige/60 space-y-4 animate-fade-up">
      <h3 className="text-lg font-extrabold text-brown-dark">{editId ? t("recipes.editTitle") : t("recipes.addTitle")}</h3>

      <div>
        <label className="text-sm font-medium text-brown">{t("recipes.nameLabel")}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("recipes.titlePlaceholder")}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-brown">{t("recipes.descLabel")}</label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
          onFocus={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
          placeholder={t("recipes.descPlaceholder")}
          rows={1}
          className={`${inputClass} resize-none overflow-hidden`}
        ></textarea>
      </div>

      <div>
        <label className="text-sm font-medium text-brown">{t("recipes.flourTypeLabel")}</label>
        <Dropdown
          value={lang === "en" ? (FLOUR_EN[flour] || flour) : flour}
          options={lang === "en" ? FLOUR_DB_VALUES.map(v => FLOUR_EN[v] || v) : FLOUR_DB_VALUES}
          onChange={(v) => setFlour(lang === "en" ? (FLOUR_FROM_EN[v] || v) : v)}
          allowCustom
        />
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <div>
          <label className="text-xs font-medium text-brown">{t("recipes.starterPct")}</label>
          <input
            type="number"
            value={starterPct}
            onChange={(e) => setStarterPct(e.target.value)}
            readOnly={ingredients.some(ing => getRole(ing) === "starter" && parseFloat(ing.amount) > 0)}
            className={`${inputClass}${ingredients.some(ing => getRole(ing) === "starter" && parseFloat(ing.amount) > 0) ? " opacity-60" : ""}`}
            title={ingredients.some(ing => getRole(ing) === "starter" && parseFloat(ing.amount) > 0) ? t("recipes.calculatedFromIngs") : ""}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">{t("recipes.starterHydrationPct")}</label>
          <input
            type="number"
            min="50"
            max="200"
            value={starterHydrationStr}
            onChange={(e) => handleStarterHydrationChange(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 items-end">
        <div>
          <label className="text-xs font-medium text-brown">{t("recipes.saltG")}</label>
          <input
            type="number"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-brown">{t("recipes.hydrationPct")}</label>
            {liveCalcData && (
              <button
                type="button"
                onClick={() => setShowCalc(!showCalc)}
                className="text-[10px] text-terracotta hover:underline"
              >
                {showCalc ? "×" : "?"}
              </button>
            )}
          </div>
          <input
            type="number"
            value={liveCalcData ? Math.round(liveCalcData.totalLiquid / liveCalcData.totalFlour * 100) : hydration}
            onChange={(e) => { setHydration(e.target.value); calcWaterFromHydration(e.target.value); }}
            className={inputClass}
          />
        </div>
      </div>

      {showCalc && (
        <div className="bg-warm-beige/40 rounded-xl p-3 text-sm space-y-2 animate-fade-up">
          <p className="font-bold text-brown-dark text-xs">{t("recipes.calcTitle")}</p>
          <p className="text-[10px] text-brown-light">{t("recipes.clickToChange")}</p>

          {/* Ингредиенты с ролями */}
          <div className="space-y-1">
            {ingredients.filter(ing => (parseFloat(ing.amount) || 0) > 0).map((ing, idx) => {
              const realIdx = ingredients.indexOf(ing);
              const role = getRole(ing);
              const isAuto = !ing.role;
              return (
                <div key={realIdx} className="flex items-center justify-between gap-2 bg-white/50 rounded-lg px-2 py-1">
                  <span className="text-xs text-brown truncate flex-1">{ing.name} — {ing.amount}{ing.unit}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = ROLE_ORDER[(ROLE_ORDER.indexOf(role) + 1) % ROLE_ORDER.length];
                      setIngredients(prev => prev.map((v, i) => i === realIdx ? { ...v, role: next } : v));
                    }}
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${ROLE_COLORS[role]} ${isAuto ? "border-dashed" : ""}`}
                    title={isAuto ? t("recipes.auto") : t("recipes.manual")}
                  >
                    {getRoleLabel(role, t)}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Итог */}
          {liveCalcData && (
            <div className="space-y-1 pt-2 border-t border-warm-beige/60">
              <p className="text-brown">
                <span className="font-medium">{t("recipes.flourLabel")} ({liveCalcData.totalFlour}г):</span>{" "}
                {liveCalcData.flourItems.join(", ")}
              </p>
              <p className="text-brown">
                <span className="font-medium">{t("recipes.liquidsLabel")} ({liveCalcData.totalLiquid}г):</span>{" "}
                {liveCalcData.liquidItems.join(", ")}
              </p>
              <p className="text-terracotta font-bold text-xs mt-1">
                {liveCalcData.formula}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-warm-beige/60">
            <span className="text-xs text-brown-light shrink-0">{t("recipes.starterHydration")}</span>
            <input
              type="number"
              min="50"
              max="200"
              value={starterHydrationStr}
              onChange={(e) => handleStarterHydrationChange(e.target.value)}
              className="w-16 px-2 py-1 border-2 border-warm-beige rounded-lg bg-cream text-sm font-bold text-brown-dark text-center focus:outline-none focus:border-terracotta transition-colors"
            />
            <span className="text-xs text-brown-light">%</span>
          </div>
        </div>
      )}

      {/* Ингредиенты */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-brown">{t("recipes.ingredientsLabel")}</label>

        {/* Ингредиенты без фазы */}
        {ingredients.filter(ing => !ing.phase).length > 0 && (
          <div className="space-y-1.5">
            {ingredients.map((ing, i) => !ing.phase && (
              <div key={i} className={`flex gap-1 items-center min-w-0 rounded-xl px-1 py-0.5 transition-colors ${ing.pinned ? "bg-golden/10 ring-1 ring-golden/30" : ""}`}>
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  placeholder={t("recipes.namePlaceholder")}
                  className="flex-1 min-w-0 px-2 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm focus:outline-none focus:border-terracotta transition-colors"
                />
                <input
                  type="text"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                  placeholder="000"
                  className="w-18 shrink-0 px-1.5 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                />
                <input
                  type="text"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                  placeholder={t("recipes.unitPlaceholder")}
                  className="w-10 shrink-0 px-1 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                />
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenMenuIdx(openMenuIdx === i ? null : i)}
                    className="p-1 text-brown-light/40 hover:text-brown-light transition-colors"
                  >
                    <svg width={16} height={16} viewBox="0 0 32 32" fill="currentColor"><circle cx="16" cy="6" r="3"/><circle cx="16" cy="16" r="3"/><circle cx="16" cy="26" r="3"/></svg>
                  </button>
                  {openMenuIdx === i && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setOpenMenuIdx(null)} />
                      <div className="absolute right-0 top-full mt-1 bg-card border-2 border-warm-beige rounded-xl overflow-hidden card-shadow-lg z-30 min-w-[160px] animate-fade-up">
                        <button
                          type="button"
                          onClick={() => { pinAs(i, "g"); setOpenMenuIdx(null); }}
                          className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium transition-colors ${ing.pinned && ing.pinnedUnit === "g" ? "text-golden bg-golden/10" : "text-brown hover:bg-warm-beige/50"}`}
                        >
                          <Icon name="pin" size={14} />
                          {t("recipes.pinToHeaderG")}
                        </button>
                        <button
                          type="button"
                          onClick={() => { pinAs(i, "%"); setOpenMenuIdx(null); }}
                          className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium border-t border-warm-beige/60 transition-colors ${ing.pinned && ing.pinnedUnit === "%" ? "text-golden bg-golden/10" : "text-brown hover:bg-warm-beige/50"}`}
                        >
                          <Icon name="pin" size={14} />
                          {t("recipes.pinToHeaderPct")}
                        </button>
                        {ing.pinned && (
                          <button
                            type="button"
                            onClick={() => { unpin(i); setOpenMenuIdx(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-brown-light hover:bg-warm-beige/50 transition-colors border-t border-warm-beige/60"
                          >
                            <Icon name="close" size={14} />
                            {t("recipes.unpin")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { removeIngredient(i); setOpenMenuIdx(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border-t border-warm-beige/60"
                        >
                          <Icon name="trash" size={14} />
                          {t("delete")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Фазы */}
        {phases.map(phase => (
          <div key={phase} className="border-2 border-golden/20 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-golden">{phase}</span>
              <button
                type="button"
                onClick={() => {
                  setIngredients(prev => prev.map(ing => ing.phase === phase ? { ...ing, phase: undefined } : ing));
                }}
                className="text-xs text-brown-light hover:text-red-500"
              >
                {t("recipes.removePhase")}
              </button>
            </div>
            {ingredients.map((ing, i) => ing.phase === phase && (
              <div key={i} className={`flex gap-1 items-center min-w-0 rounded-xl px-1 py-0.5 transition-colors ${ing.pinned ? "bg-golden/10 ring-1 ring-golden/30" : ""}`}>
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  placeholder={t("recipes.namePlaceholder")}
                  className="flex-1 min-w-0 px-2 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm focus:outline-none focus:border-terracotta transition-colors"
                />
                <input
                  type="text"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                  placeholder="000"
                  className="w-18 shrink-0 px-1.5 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                />
                <input
                  type="text"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                  placeholder={t("recipes.unitPlaceholder")}
                  className="w-10 shrink-0 px-1 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                />
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenMenuIdx(openMenuIdx === i ? null : i)}
                    className="p-1 text-brown-light/40 hover:text-brown-light transition-colors"
                  >
                    <svg width={16} height={16} viewBox="0 0 32 32" fill="currentColor"><circle cx="16" cy="6" r="3"/><circle cx="16" cy="16" r="3"/><circle cx="16" cy="26" r="3"/></svg>
                  </button>
                  {openMenuIdx === i && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setOpenMenuIdx(null)} />
                      <div className="absolute right-0 top-full mt-1 bg-card border-2 border-warm-beige rounded-xl overflow-hidden card-shadow-lg z-30 min-w-[160px] animate-fade-up">
                        <button
                          type="button"
                          onClick={() => { pinAs(i, "g"); setOpenMenuIdx(null); }}
                          className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium transition-colors ${ing.pinned && ing.pinnedUnit === "g" ? "text-golden bg-golden/10" : "text-brown hover:bg-warm-beige/50"}`}
                        >
                          <Icon name="pin" size={14} />
                          {t("recipes.pinToHeaderG")}
                        </button>
                        <button
                          type="button"
                          onClick={() => { pinAs(i, "%"); setOpenMenuIdx(null); }}
                          className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium border-t border-warm-beige/60 transition-colors ${ing.pinned && ing.pinnedUnit === "%" ? "text-golden bg-golden/10" : "text-brown hover:bg-warm-beige/50"}`}
                        >
                          <Icon name="pin" size={14} />
                          {t("recipes.pinToHeaderPct")}
                        </button>
                        {ing.pinned && (
                          <button
                            type="button"
                            onClick={() => { unpin(i); setOpenMenuIdx(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-brown-light hover:bg-warm-beige/50 transition-colors border-t border-warm-beige/60"
                          >
                            <Icon name="close" size={14} />
                            {t("recipes.unpin")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { removeIngredient(i); setOpenMenuIdx(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border-t border-warm-beige/60"
                        >
                          <Icon name="trash" size={14} />
                          {t("delete")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addIngredient(phase)}
              className="text-xs text-golden hover:underline"
            >
              {t("recipes.addIngToPhase")} «{phase}»
            </button>
          </div>
        ))}

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => addIngredient()}
            className="text-sm text-terracotta font-medium hover:underline"
          >
            {t("recipes.addIngredient")}
          </button>
          <button
            type="button"
            onClick={() => setShowPhaseInput(true)}
            className="text-sm text-golden font-medium hover:underline"
          >
            {t("recipes.addPhase")}
          </button>
        </div>

        {showPhaseInput && (
          <div className="bg-golden/5 border-2 border-golden/30 rounded-xl p-3 space-y-2 animate-fade-up">
            <p className="text-xs font-bold text-golden">{t("recipes.newPhase")}</p>
            <input
              type="text"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              placeholder={t("recipes.phasePlaceholder")}
              autoFocus
              className="w-full px-3 py-2 border-2 border-golden/30 rounded-xl bg-cream text-brown-dark text-sm focus:outline-none focus:border-golden transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newPhaseName.trim()) {
                    addIngredient(newPhaseName.trim());
                    setNewPhaseName("");
                    setShowPhaseInput(false);
                  }
                }
                if (e.key === "Escape") {
                  setShowPhaseInput(false);
                  setNewPhaseName("");
                }
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (newPhaseName.trim()) {
                    addIngredient(newPhaseName.trim());
                    setNewPhaseName("");
                    setShowPhaseInput(false);
                  }
                }}
                disabled={!newPhaseName.trim()}
                className="px-3 py-1.5 bg-golden text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all"
              >
                {t("recipes.add")}
              </button>
              <button
                type="button"
                onClick={() => { setShowPhaseInput(false); setNewPhaseName(""); }}
                className="px-3 py-1.5 text-xs text-brown-light hover:text-brown transition-colors"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-brown">{t("recipes.stepsLabel")}</label>
        <textarea
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
          placeholder={t("recipes.stepPlaceholder")}
          rows={5}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Фото */}
      <div>
        <label className="text-sm font-medium text-brown">{t("recipes.photosLabel")}</label>
        {photos.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {photos.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-warm-beige">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {photos.length < 3 && (
          <label className="mt-2 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-warm-beige rounded-xl text-brown-light hover:border-terracotta/40 hover:text-terracotta cursor-pointer transition-colors">
            <Icon name="camera" size={18} />
            <span className="text-sm font-medium">{uploadingPhoto ? t("recipes.uploading") : t("recipes.addPhoto")}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto}
            />
          </label>
        )}
      </div>

      {/* Превью-поля */}
      <div>
        <label className="text-sm font-medium text-brown">{t("recipes.showInPreview")}</label>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {([["flour", t("recipes.flour")], ["starter", t("recipes.starter")], ["hydration", t("recipes.hydration")]] as [string, string][]).map(([key, label]) => {
            const hidden = previewHidden.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPreviewHidden(prev =>
                  hidden ? prev.filter(k => k !== key) : [...prev, key]
                )}
                className={`px-3 py-1.5 text-sm font-medium rounded-xl border-2 transition-all ${
                  hidden
                    ? "border-warm-beige/60 text-brown-light/40 bg-warm-beige/20"
                    : "border-golden/40 text-golden bg-golden/10"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full py-4 bg-terracotta text-white text-lg font-bold rounded-xl card-shadow-lg hover:bg-terracotta-light active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? t("recipes.saving") : (editId ? t("recipes.saveChanges") : t("recipes.saveRecipe"))}
      </button>
    </form>
  );
}

function RecipeConverter({
  recipe,
  onClose,
  onSaved,
}: {
  recipe: Recipe;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const originalIngs: Ingredient[] = recipe.ingredients ? JSON.parse(recipe.ingredients) : [];
  const originalTotal = originalIngs.reduce((sum, ing) => sum + (parseFloat(ing.amount) || 0), 0);

  const [targetWeight, setTargetWeight] = useState(String(Math.round(originalTotal)));
  const [showPercents, setShowPercents] = useState(false);
  const [saving, setSaving] = useState(false);

  const target = parseFloat(targetWeight) || 0;
  const scale = originalTotal > 0 ? target / originalTotal : 1;

  // Найти общую муку для пекарских процентов
  const flourKeywords = ["мука", "солод"];
  const totalFlour = originalIngs
    .filter((ing) => flourKeywords.some((k) => ing.name.toLowerCase().includes(k)))
    .reduce((sum, ing) => sum + (parseFloat(ing.amount) || 0), 0);

  const scaledIngs = originalIngs.map((ing) => {
    const original = parseFloat(ing.amount) || 0;
    const scaled = Math.round(original * scale);
    const pct = totalFlour > 0 ? Math.round((original / totalFlour) * 100) : 0;
    return { ...ing, scaled, pct, original };
  });

  async function handleSave(mode: "replace" | "new" | "variant") {
    setSaving(true);
    const newIngredients = scaledIngs.map((ing) => ({
      name: ing.name,
      amount: String(ing.scaled),
      unit: ing.unit,
      ...(ing.phase ? { phase: ing.phase } : {}),
    }));

    const body: Record<string, unknown> = {
      title: mode === "replace" ? recipe.title : `${recipe.title} — ${target}г`,
      description: recipe.description,
      flour: recipe.flour,
      hydration: recipe.hydration,
      starterPct: recipe.starterPct,
      salt: recipe.salt ? Math.round((recipe.salt as number) * scale) : null,
      ingredients: JSON.stringify(newIngredients),
      hydrationCalc: recipe.hydrationCalc,
      steps: recipe.steps,
    };

    if (mode === "replace") {
      body.id = recipe.id;
      await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      if (mode === "variant") {
        body.parentId = recipe.parentId || recipe.id;
      }
      await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      track("add_recipe");
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-up" onClick={onClose}>
      <div className="bg-card w-full sm:rounded-2xl sm:max-w-sm h-full sm:h-auto sm:max-h-[85vh] flex flex-col card-shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-lg font-extrabold text-brown-dark flex items-center gap-2">
            <Icon name="calculator" size={22} className="text-terracotta" />
            {t("recipes.recalculate")}
          </h3>
          <button onClick={onClose} className="text-brown-light hover:text-brown transition-colors">
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 space-y-4 flex-1">
        {/* Целевой вес */}
        <div>
          <label className="text-sm font-medium text-brown">{t("recipes.totalWeightG")}</label>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="w-full mt-1 px-4 py-3 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark font-bold text-center text-lg focus:outline-none focus:border-terracotta transition-colors"
          />
          {originalTotal > 0 && scale !== 1 && (
            <p className="text-xs text-brown-light mt-1 text-center">
              {t("recipes.coefficient")}: ×{scale.toFixed(2)}
            </p>
          )}
        </div>

        {/* Переключатель граммы / проценты */}
        <div className="flex bg-warm-beige/50 rounded-xl p-1">
          <button
            onClick={() => setShowPercents(false)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              !showPercents ? "bg-white text-terracotta card-shadow" : "text-brown-light"
            }`}
          >
            {t("recipes.grams")}
          </button>
          <button
            onClick={() => setShowPercents(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              showPercents ? "bg-white text-terracotta card-shadow" : "text-brown-light"
            }`}
          >
            {t("recipes.bakersPct")}
          </button>
        </div>

        {/* Таблица ингредиентов */}
        <div className="space-y-1.5">
          {scaledIngs.map((ing, i) => (
            <div key={i} className="flex justify-between items-center bg-warm-beige/30 rounded-lg px-3 py-2">
              <span className="text-sm text-brown">{ing.name}</span>
              <span className="text-sm font-bold text-brown-dark">
                {showPercents ? `${ing.pct}%` : `${ing.scaled} ${ing.unit}`}
              </span>
            </div>
          ))}
        </div>

        {showPercents && totalFlour > 0 && (
          <p className="text-xs text-brown-light text-center">
            {t("recipes.pctOfFlour")} ({Math.round(totalFlour * scale)}г)
          </p>
        )}

        </div>

        {/* Кнопки сохранения */}
        <div className="space-y-2 p-5 pt-2 border-t border-warm-beige/60">
          {!recipe.isBuiltIn && (
            <button
              onClick={() => handleSave("replace")}
              disabled={saving || target <= 0}
              className="w-full py-3 bg-terracotta text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {t("recipes.saveAsMain")}
            </button>
          )}
          <button
            onClick={() => handleSave("new")}
            disabled={saving || target <= 0}
            className="w-full py-3 bg-golden text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {t("recipes.saveAsNew")}
          </button>
          <button
            onClick={() => handleSave("variant")}
            disabled={saving || target <= 0}
            className="w-full py-3 bg-warm-beige text-brown font-bold rounded-xl hover:bg-warm-beige/80 active:scale-95 transition-all disabled:opacity-50"
          >
            {t("recipes.saveAsVariant")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecipesTab({ goToListSignal }: { goToListSignal?: number }) {
  const t = useT();
  const { lang } = useLang();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showList, setShowList] = useState(true);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [scanned, setScanned] = useState<ScannedRecipe | undefined>();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [converting, setConverting] = useState<Recipe | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  async function handleTogglePin(recipe: Recipe) {
    const newPinned = !recipe.pinned;
    await fetch("/api/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id, pinned: newPinned }),
    });
    setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, pinned: newPinned } : r));
  }

  async function handleToggleHide(recipe: Recipe) {
    const newHidden = !recipe.hidden;
    setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, hidden: newHidden } : r));
    fetch("/api/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id, hidden: newHidden }),
    });
  }

  async function handleTogglePublic(recipe: Recipe) {
    const newPublic = !recipe.isPublic;
    await fetch("/api/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id, isPublic: newPublic }),
    });
    setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, isPublic: newPublic } : r));
  }

  function handleReorder(orderedIds: string[]) {
    // Сразу обновляем локальный порядок
    setRecipes(prev => {
      const map = new Map(prev.map(r => [r.id, r]));
      return orderedIds.map(id => map.get(id)!).concat(prev.filter(r => !orderedIds.includes(r.id)));
    });
    // Сохраняем на сервер в фоне
    fetch("/api/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder: orderedIds }),
    });
  }

  // При повторном нажатии на вкладку — вернуться к списку
  useEffect(() => {
    if (goToListSignal) {
      setSelected(null);
      setShowList(true);
    }
  }, [goToListSignal]);

  const loadRecipes = useCallback(async () => {
    const res = await fetch("/api/recipes");
    if (!res.ok) {
      console.error("Recipes API error:", res.status, await res.text());
      setLoading(false);
      return;
    }
    const data = await res.json();
    // Переводим встроенные рецепты
    const translated = data.map((r: Recipe) => {
      if (!r.isBuiltIn) return r;
      const tr = translateBuiltInRecipe(r, lang);
      return { ...r, ...tr };
    });
    setRecipes(translated);
    setLoading(false);
  }, [lang]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Сжатие фото перед отправкой — телефонные фото слишком большие для Gemini API
  function compressImage(file: File, maxSize = 1600, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Compression failed")),
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error(t("recipes.imageLoadError")));
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleScanPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setScanning(true);
    setScanError("");

    const formData = new FormData();
    try {
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        formData.append("photo", compressed, files[i].name || `photo-${i}.jpg`);
      }
    } catch (err) {
      setScanError(t("recipes.scanPhotoError") + ": " + String(err));
      setScanning(false);
      e.target.value = "";
      return;
    }

    try {
      const res = await fetch("/api/recipes/scan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let msg = `${t("recipes.scanServerError")} (${res.status})`;
        try { const err = await res.json(); msg = err.error + (err.details ? ": " + err.details : ""); } catch {}
        setScanError(msg);
        setScanning(false);
        return;
      }

      const data = await res.json();

      if (data.error) {
        setScanError(data.error + (data.details ? ": " + data.details : ""));
        setScanning(false);
        return;
      }

      setScanned(data);
      setShowAdd(true);
      setShowList(false);
    } catch (err) {
      setScanError(t("recipes.scanRecognizeError") + ": " + String(err));
    }
    setScanning(false);
    // Сброс input чтобы можно было загрузить тот же файл повторно
    e.target.value = "";
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-up">
          <Icon name="recipe-page" size={48} className="mb-4 animate-bounce text-terracotta mx-auto" />
          <p className="text-brown-light text-lg">{t("recipes.loadingRecipes")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-4 gap-4 pb-24 animate-fade-up">

      {converting && (
        <RecipeConverter
          recipe={converting}
          onClose={() => setConverting(null)}
          onSaved={() => { loadRecipes(); }}
        />
      )}

      {/* Детали рецепта */}
      {selected && !showList && (
        <RecipeDetail
          recipe={selected}
          onBack={() => { setSelected(null); setShowList(true); }}
          onDeleted={() => { setSelected(null); setShowList(true); loadRecipes(); }}
          onEdit={() => {
            setEditing(selected);
            setSelected(null);
          }}
          onConvert={() => setConverting(selected)}
          onSelectVariant={(v) => setSelected(v)}
        />
      )}

      {/* Форма редактирования — скрыта через CSS, чтобы сохранять черновик */}
      {editing && (
        <div className={`flex flex-col items-center gap-4 ${showList || selected ? "hidden" : ""}`}>
          <AddRecipeForm
            key={editing.id}
            editId={editing.id}
            initial={{
              title: editing.title,
              description: editing.description,
              flour: editing.flour,
              hydration: editing.hydration,
              starterPct: editing.starterPct,
              salt: editing.salt,
              ingredients: editing.ingredients ? JSON.parse(editing.ingredients) : undefined,
              hydrationCalc: editing.hydrationCalc ? JSON.parse(editing.hydrationCalc) : undefined,
              steps: JSON.parse(editing.steps),
            }}
            initialPhotos={editing.photos ? JSON.parse(editing.photos) : undefined}
            initialPreviewHidden={editing.previewHidden ? JSON.parse(editing.previewHidden) : undefined}
            onCreated={() => {
              loadRecipes();
              setEditing(null);
              setShowList(true);
            }}
          />
          <button
            onClick={() => { setEditing(null); setShowList(true); }}
            className="text-brown-light hover:text-brown text-sm transition-colors mt-4"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      {/* Форма добавления — скрыта через CSS, чтобы сохранять черновик */}
      {showAdd && !editing && (
        <div className={`flex flex-col items-center gap-4 ${showList || selected ? "hidden" : ""}`}>
          <AddRecipeForm
            key={JSON.stringify(scanned)}
            initial={scanned}
            onCreated={() => {
              loadRecipes();
              setShowAdd(false);
              setScanned(undefined);
              setShowList(true);
            }}
          />
          <button
            onClick={() => { setShowAdd(false); setScanned(undefined); setShowList(true); }}
            className="text-brown-light hover:text-brown text-sm transition-colors mt-4"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      {/* Список рецептов */}
      {showList && !selected && (
        <>
          <div className="w-full max-w-sm space-y-2">
            {(editing || showAdd) && (
              <button
                onClick={() => setShowList(false)}
                className="w-full py-4 bg-card rounded-2xl border-2 border-terracotta/40 text-terracotta font-bold hover:bg-terracotta/5 transition-all"
              >
                {t("recipes.backToDraft")}
              </button>
            )}
            <button
              onClick={() => { setShowAdd(true); setShowList(false); setEditing(null); }}
              className="w-full py-4 bg-card rounded-2xl border-2 border-dashed border-terracotta/30 text-terracotta font-bold hover:border-terracotta/60 hover:bg-terracotta/5 transition-all"
            >
              {t("recipes.addOwn")}
            </button>

            <label className="w-full py-4 bg-card rounded-2xl border-2 border-dashed border-golden/30 text-golden font-bold hover:border-golden/60 hover:bg-golden/5 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Icon name="notebook" size={20} />
              {scanning ? t("recipes.scanning") : t("recipes.scanFromPhoto")}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleScanPhoto}
                className="hidden"
                disabled={scanning}
              />
            </label>
          </div>

          {scanError && (
            <p className="text-red-500 text-sm text-center">{scanError}</p>
          )}

          {(() => {
            // Скрываем только варианты, чей родитель есть в списке (встроенные)
            const parentIds = new Set(recipes.map(r => r.id));
            const isVariant = (r: Recipe) => r.parentId && parentIds.has(r.parentId);
            const visible = recipes.filter(r => !isVariant(r) && (showHidden || !r.hidden)).sort((a, b) => Number(b.pinned) - Number(a.pinned));
            const hiddenCount = recipes.filter(r => !isVariant(r) && r.hidden).length;
            return (
              <>
                <DraggableRecipeList
                  recipes={visible}
                  onSelect={(r) => { setSelected(r); setShowList(false); }}
                  onTogglePin={handleTogglePin}
                  onToggleHide={handleToggleHide}
                  onTogglePublic={handleTogglePublic}
                  onReorder={handleReorder}
                />

                {hiddenCount > 0 && (
                  <button
                    onClick={() => setShowHidden(!showHidden)}
                    className="flex items-center gap-1.5 text-sm text-brown-light hover:text-brown transition-colors"
                  >
                    <Icon name={showHidden ? "eye-off" : "eye"} size={16} />
                    {showHidden ? t("recipes.hideHidden") : `${t("recipes.showHidden")} (${hiddenCount})`}
                  </button>
                )}

                {visible.length === 0 && !hiddenCount && (
                  <p className="text-brown-light text-center py-8">
                    {t("recipes.noRecipes")}
                  </p>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
