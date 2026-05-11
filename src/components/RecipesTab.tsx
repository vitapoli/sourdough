"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  phase?: string;
  hydration?: number;
  pinned?: boolean;
  pinnedUnit?: "g" | "%";
}

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
  photos: string | null;
  isBuiltIn: boolean;
  parentId: string | null;
  variants?: Recipe[];
}

function RecipeCard({
  recipe,
  onSelect,
}: {
  recipe: Recipe;
  onSelect: (r: Recipe) => void;
}) {
  return (
    <button
      onClick={() => onSelect(recipe)}
      className="w-full bg-card rounded-2xl p-4 card-shadow border border-warm-beige/60 text-left hover:card-shadow-lg hover:border-terracotta/30 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex gap-3">
        {recipe.photos && (() => {
          const urls: string[] = JSON.parse(recipe.photos);
          return urls.length > 0 ? (
            <img src={urls[0]} alt="" className="w-16 h-16 object-cover rounded-xl shrink-0" />
          ) : null;
        })()}
        <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-extrabold text-brown-dark text-lg leading-tight">
          {recipe.title}
        </h3>
        {recipe.isBuiltIn && (
          <span className="text-xs bg-golden/15 text-golden px-2.5 py-0.5 rounded-full font-bold shrink-0 ml-2 border border-golden/30">
            Базовый
          </span>
        )}
      </div>
      {recipe.description && (
        <p className="text-sm text-brown-light mb-3">{recipe.description}</p>
      )}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium">
          {recipe.flour}
        </span>
        <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1">
          <Icon name="drop" size={12} /> {recipe.hydration}%
        </span>
        <span className="text-xs bg-warm-beige/70 text-brown px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1">
          <Icon name="wheat" size={12} /> {recipe.starterPct}%
        </span>
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
      </div>{/* flex-1 */}
      </div>{/* flex gap-3 */}
    </button>
  );
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
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Удалить этот рецепт?")) return;
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
    if (!recipe.ingredients) return 100;
    const ings = JSON.parse(recipe.ingredients) as Ingredient[];
    const starterKeywords = ["закваска", "стартер", "левен"];
    const starter = ings.find(ing => starterKeywords.some(k => ing.name.toLowerCase().includes(k)));
    return starter?.hydration || 100;
  })();
  const [starterHydrationStr, setStarterHydrationStr] = useState(String(savedStarterHydration));
  const starterHydration = parseInt(starterHydrationStr) || 100;
  const [starterHydrationChanged, setStarterHydrationChanged] = useState(false);
  const steps: string[] = JSON.parse(recipe.steps);

  // Расчёт гидратации: вычислить из ингредиентов с учётом закваски
  const calcData: HydrationCalc | null = (() => {
    if (!recipe.ingredients) {
      if (recipe.hydrationCalc) return JSON.parse(recipe.hydrationCalc) as HydrationCalc;
      return null;
    }

    const ings = JSON.parse(recipe.ingredients) as Ingredient[];
    const flourKeywords = ["мука", "солод"];
    const liquidKeywords = ["вода", "молоко", "кефир", "пахта", "сыворотка", "сок", "йогурт"];
    const starterKeywords = ["закваска", "стартер", "левен"];

    const flourItems: string[] = [];
    const liquidItems: string[] = [];
    let totalFlour = 0;
    let totalLiquid = 0;

    for (const ing of ings) {
      const nameLower = ing.name.toLowerCase();
      const amount = parseFloat(ing.amount) || 0;
      if (amount <= 0) continue;

      if (starterKeywords.some(k => nameLower.includes(k))) {
        // Разбиваем закваску на муку и воду по её гидратации
        const ingH = ing.hydration || starterHydration;
        const starterFlour = amount / (1 + ingH / 100);
        const starterWater = amount - starterFlour;
        flourItems.push(`${ing.name} (мука) ${Math.round(starterFlour)}г`);
        liquidItems.push(`${ing.name} (вода) ${Math.round(starterWater)}г`);
        totalFlour += starterFlour;
        totalLiquid += starterWater;
      } else if (flourKeywords.some(k => nameLower.includes(k))) {
        flourItems.push(`${ing.name} ${ing.amount}${ing.unit}`);
        totalFlour += amount;
      } else if (liquidKeywords.some(k => nameLower.includes(k))) {
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

  return (
    <div className="w-full max-w-sm space-y-4 animate-fade-up">
      <button
        onClick={onBack}
        className="text-terracotta font-bold text-sm hover:underline flex items-center gap-1"
      >
        <Icon name="back" size={16} /> Назад к рецептам
      </button>

      <div className="bg-card rounded-2xl p-5 card-shadow border border-warm-beige/60">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-extrabold text-brown-dark">{recipe.title}</h2>
          {!recipe.isBuiltIn && (
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="text-brown-light hover:text-terracotta transition-colors p-1"
                title="Редактировать"
              >
                <Icon name="notebook" size={20} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-brown-light hover:text-red-500 transition-colors p-1 disabled:opacity-50"
                title="Удалить рецепт"
              >
                <Icon name="trash" size={20} />
              </button>
            </div>
          )}
        </div>
        {recipe.description && (
          <p className="text-brown-light mb-4">{recipe.description}</p>
        )}

        {recipe.photos && (() => {
          const photoUrls: string[] = JSON.parse(recipe.photos);
          if (photoUrls.length === 0) return null;
          return (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {photoUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="w-28 h-28 object-cover rounded-xl border-2 border-warm-beige/60 shrink-0" />
              ))}
            </div>
          );
        })()}

        <div className="flex gap-3 flex-wrap mb-5">
          <div className="bg-warm-beige/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-brown-light">Мука</p>
            <p className="text-sm font-bold text-brown">{recipe.flour}</p>
          </div>
          <div className="bg-warm-beige/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-brown-light flex items-center gap-1 justify-center">
              <Icon name="leaven" size={12} /> Закваска
            </p>
            <p className="text-sm font-bold text-brown">{recipe.starterPct}%</p>
          </div>
          {recipe.ingredients && (() => {
            const ings = JSON.parse(recipe.ingredients) as Ingredient[];
            const flourKeywords = ["мука", "солод"];
            const totalFlour = ings
              .filter(ing => flourKeywords.some(k => ing.name.toLowerCase().includes(k)))
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
              <Icon name="drop" size={12} /> Гидратация
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
            <p className="font-bold text-brown-dark text-xs">Расчёт гидратации:</p>
            <div className="space-y-1">
              <p className="text-brown">
                <span className="font-medium">Мука ({calcData.totalFlour}г):</span>{" "}
                {calcData.flourItems.join(", ")}
              </p>
              <p className="text-brown">
                <span className="font-medium">Жидкости ({calcData.totalLiquid}г):</span>{" "}
                {calcData.liquidItems.join(", ")}
              </p>
              <p className="text-terracotta font-bold text-xs mt-1">
                {calcData.formula}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-warm-beige/60">
              <span className="text-xs text-brown-light shrink-0">Гидратация закваски:</span>
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

        {recipe.ingredients && (() => {
          const ings = JSON.parse(recipe.ingredients) as Ingredient[];
          const recipePhases = [...new Set(ings.map(ing => ing.phase).filter(Boolean))] as string[];
          const noPhase = ings.filter(ing => !ing.phase);
          const starterKeywords = ["закваска", "стартер", "левен"];
          const liquidKeywords = ["вода", "молоко", "кефир", "пахта", "сыворотка", "сок", "йогурт"];
          const isStarter = (name: string) => starterKeywords.some(k => name.toLowerCase().includes(k));
          const isLiquid = (name: string) => liquidKeywords.some(k => name.toLowerCase().includes(k));

          // Считаем разницу воды при смене гидратации закваски
          let waterDiff = 0;
          if (starterHydrationChanged) {
            for (const ing of ings) {
              if (isStarter(ing.name)) {
                const amount = parseFloat(ing.amount) || 0;
                const ingH = ing.hydration || 100;
                const flourInStarter = amount / (1 + ingH / 100);
                const originalWater = amount - flourInStarter;
                const newWater = flourInStarter * (starterHydration / 100);
                waterDiff = originalWater - newWater; // положительное = нужно добавить воды
              }
            }
          }

          let waterDiffApplied = false;
          const renderIng = (ing: Ingredient, i: number) => {
            const starter = isStarter(ing.name);
            const liquid = isLiquid(ing.name);
            let displayAmount = ing.amount;
            if (starter && starterHydrationChanged) {
              const originalAmount = parseFloat(ing.amount) || 0;
              const ingH = ing.hydration || 100;
              const flourInStarter = originalAmount / (1 + ingH / 100);
              const newAmount = Math.round(flourInStarter * (1 + starterHydration / 100));
              displayAmount = String(newAmount);
            }
            if (liquid && starterHydrationChanged && waterDiff !== 0 && !waterDiffApplied) {
              // Компенсируем разницу воды в первом жидком ингредиенте
              const originalAmount = parseFloat(ing.amount) || 0;
              displayAmount = String(Math.round(originalAmount + waterDiff));
              waterDiffApplied = true;
            }
            return (
              <div key={i} className="flex justify-between items-center bg-warm-beige/30 rounded-lg px-3 py-1.5">
                <span className="text-sm text-brown">
                  {ing.name}
                  {starter && (
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
                <h3 className="font-extrabold text-brown-dark">Ингредиенты:</h3>
                <button
                  onClick={onConvert}
                  className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1"
                >
                  Пересчитать
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

        <h3 className="font-extrabold text-brown-dark mb-3">Приготовление:</h3>
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
            <h3 className="font-extrabold text-brown-dark mb-2">Варианты:</h3>
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

function AddRecipeForm({ onCreated, initial, editId, initialPhotos }: { onCreated: () => void; initial?: ScannedRecipe; editId?: string; initialPhotos?: string[] }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [flour, setFlour] = useState(initial?.flour || "Пшеничная");
  const [hydration, setHydration] = useState(String(initial?.hydration || "70"));
  const [starterPct, setStarterPct] = useState(String(initial?.starterPct || "20"));
  const [salt, setSalt] = useState(initial?.salt ? String(initial.salt) : "10");
  const [showCalc, setShowCalc] = useState(false);
  const [showPhaseInput, setShowPhaseInput] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients || []
  );
  const [stepsText, setStepsText] = useState(initial?.steps?.join("\n") || "");
  const [photos, setPhotos] = useState<string[]>(initialPhotos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);

  const starterKeywords = ["закваска", "стартер", "левен"];
  const isStarter = (name: string) => starterKeywords.some(k => name.toLowerCase().includes(k));

  const savedStarterHydration = (() => {
    const starter = (initial?.ingredients || []).find(ing => isStarter(ing.name));
    return starter?.hydration || 100;
  })();
  const [starterHydrationStr, setStarterHydrationStr] = useState(String(savedStarterHydration));
  const starterHydration = parseInt(starterHydrationStr) || 100;

  const liquidKeywords = ["вода", "молоко", "кефир", "пахта", "сыворотка", "сок", "йогурт"];
  const isLiquid = (name: string) => liquidKeywords.some(k => name.toLowerCase().includes(k));

  // Запоминаем оригинальные количества закваски и первой жидкости
  const [originalAmounts] = useState(() => {
    const starter: Record<number, number> = {};
    let firstLiquidIdx = -1;
    let firstLiquidAmount = 0;
    (initial?.ingredients || []).forEach((ing, i) => {
      if (isStarter(ing.name)) starter[i] = parseFloat(ing.amount) || 0;
      if (isLiquid(ing.name) && firstLiquidIdx === -1) {
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
      if (isStarter(ing.name)) {
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

  function togglePin(index: number) {
    setIngredients(prev => prev.map((ing, i) => {
      if (i !== index) return ing;
      if (!ing.pinned) {
        return { ...ing, pinned: true, pinnedUnit: "g" };
      }
      if (ing.pinnedUnit === "g") {
        return { ...ing, pinnedUnit: "%" };
      }
      return { ...ing, pinned: false, pinnedUnit: undefined };
    }));
  }

  // Вычислить расчёт гидратации из текущих ингредиентов
  const liveCalcData: HydrationCalc | null = (() => {
    if (ingredients.length === 0) {
      if (initial?.hydrationCalc) return initial.hydrationCalc;
      return null;
    }

    const flourKeywords = ["мука", "солод"];
    const liquidKeywords = ["вода", "молоко", "кефир", "пахта", "сыворотка", "сок", "йогурт"];
    const starterKeywords = ["закваска", "стартер", "левен"];

    const flourItems: string[] = [];
    const liquidItems: string[] = [];
    let totalFlour = 0;
    let totalLiquid = 0;

    for (const ing of ingredients) {
      const nameLower = ing.name.toLowerCase();
      const amount = parseFloat(ing.amount) || 0;
      if (amount <= 0) continue;

      if (starterKeywords.some(k => nameLower.includes(k))) {
        const sFlour = amount / (1 + starterHydration / 100);
        const sWater = amount - sFlour;
        flourItems.push(`${ing.name} (мука) ${Math.round(sFlour)}г`);
        liquidItems.push(`${ing.name} (вода) ${Math.round(sWater)}г`);
        totalFlour += sFlour;
        totalLiquid += sWater;
      } else if (flourKeywords.some(k => nameLower.includes(k))) {
        flourItems.push(`${ing.name} ${ing.amount}${ing.unit}`);
        totalFlour += amount;
      } else if (liquidKeywords.some(k => nameLower.includes(k))) {
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

    const flourKeywords = ["мука", "солод"];

    // Находим индекс первого ингредиента "вода" — его будем пересчитывать
    const mainWaterIdx = ingredients.findIndex(ing =>
      ing.name.toLowerCase().includes("вода")
    );
    if (mainWaterIdx < 0) return;

    let totalFlour = 0;
    let otherLiquid = 0;

    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      const nameLower = ing.name.toLowerCase();
      const amount = parseFloat(ing.amount) || 0;
      if (amount <= 0) continue;

      if (starterKeywords.some(k => nameLower.includes(k))) {
        const sFlour = amount / (1 + starterHydration / 100);
        totalFlour += sFlour;
        otherLiquid += amount - sFlour;
      } else if (flourKeywords.some(k => nameLower.includes(k))) {
        totalFlour += amount;
      } else if (isLiquid(ing.name) && i !== mainWaterIdx) {
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
      }
    } catch (err) {
      console.error("Photo upload error:", err);
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
      if (isStarter(ing.name)) {
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
        starterPct: parseInt(starterPct) || 20,
        salt: salt ? parseFloat(salt) : null,
        ingredients: filteredIngredients.length > 0 ? JSON.stringify(filteredIngredients) : null,
        hydrationCalc: initial?.hydrationCalc ? JSON.stringify(initial.hydrationCalc) : null,
        steps: JSON.stringify(steps),
        photos: photos.length > 0 ? JSON.stringify(photos) : null,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert("Ошибка сохранения: " + (err.error || "неизвестная ошибка"));
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
    "w-full mt-1 px-4 py-3 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark focus:outline-none focus:border-terracotta transition-colors";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card rounded-2xl p-5 card-shadow border border-warm-beige/60 space-y-4 animate-fade-up">
      <h3 className="text-lg font-extrabold text-brown-dark">{editId ? "Редактировать рецепт" : "Добавить рецепт"}</h3>

      <div>
        <label className="text-sm font-medium text-brown">Название</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Мой любимый хлеб"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-brown">Описание</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Краткое описание"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-brown">Мука</label>
        <Dropdown
          value={flour}
          options={["Пшеничная", "Ржаная"]}
          onChange={setFlour}
          allowCustom
        />
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <div>
          <label className="text-xs font-medium text-brown">Закваска %</label>
          <input
            type="number"
            value={starterPct}
            onChange={(e) => setStarterPct(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">Гидр. закваски %</label>
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
          <label className="text-xs font-medium text-brown">Соль (г)</label>
          <input
            type="number"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-brown">Гидратация %</label>
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
            value={hydration}
            onChange={(e) => { setHydration(e.target.value); calcWaterFromHydration(e.target.value); }}
            className={inputClass}
          />
        </div>
      </div>

      {showCalc && liveCalcData && (
        <div className="bg-warm-beige/40 rounded-xl p-3 text-sm space-y-2 animate-fade-up">
          <p className="font-bold text-brown-dark text-xs">Расчёт гидратации:</p>
          <div className="space-y-1">
            <p className="text-brown">
              <span className="font-medium">Мука ({liveCalcData.totalFlour}г):</span>{" "}
              {liveCalcData.flourItems.join(", ")}
            </p>
            <p className="text-brown">
              <span className="font-medium">Жидкости ({liveCalcData.totalLiquid}г):</span>{" "}
              {liveCalcData.liquidItems.join(", ")}
            </p>
            <p className="text-terracotta font-bold text-xs mt-1">
              {liveCalcData.formula}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-warm-beige/60">
            <span className="text-xs text-brown-light shrink-0">Гидратация закваски:</span>
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
        <label className="text-sm font-medium text-brown">Ингредиенты</label>

        {/* Ингредиенты без фазы */}
        {ingredients.filter(ing => !ing.phase).length > 0 && (
          <div className="space-y-1.5">
            {ingredients.map((ing, i) => !ing.phase && (
              <div key={i} className="flex gap-1 items-center min-w-0">
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  placeholder="Название"
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
                  placeholder="ед"
                  className="w-10 shrink-0 px-1 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                />
                <button
                  type="button"
                  onClick={() => togglePin(i)}
                  className={`shrink-0 p-0.5 transition-colors text-xs font-bold rounded ${
                    ing.pinned
                      ? ing.pinnedUnit === "%" ? "text-terracotta" : "text-golden"
                      : "text-brown-light/40 hover:text-brown-light"
                  }`}
                  title={ing.pinned ? (ing.pinnedUnit === "g" ? "В шапке (г) → нажми для %" : "В шапке (%) → нажми чтобы убрать") : "Закрепить в шапке"}
                >
                  {ing.pinned ? (ing.pinnedUnit === "%" ? "%" : "г") : "📌"}
                </button>
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="shrink-0 text-brown-light hover:text-red-500 transition-colors p-0.5"
                >
                  <Icon name="trash" size={14} />
                </button>
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
                убрать фазу
              </button>
            </div>
            {ingredients.map((ing, i) => ing.phase === phase && (
              <div key={i} className="flex gap-1 items-center min-w-0">
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  placeholder="Название"
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
                  placeholder="ед"
                  className="w-10 shrink-0 px-1 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                />
                <button
                  type="button"
                  onClick={() => togglePin(i)}
                  className={`shrink-0 p-0.5 transition-colors text-xs font-bold rounded ${
                    ing.pinned
                      ? ing.pinnedUnit === "%" ? "text-terracotta" : "text-golden"
                      : "text-brown-light/40 hover:text-brown-light"
                  }`}
                  title={ing.pinned ? (ing.pinnedUnit === "g" ? "В шапке (г) → нажми для %" : "В шапке (%) → нажми чтобы убрать") : "Закрепить в шапке"}
                >
                  {ing.pinned ? (ing.pinnedUnit === "%" ? "%" : "г") : "📌"}
                </button>
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="shrink-0 text-brown-light hover:text-red-500 transition-colors p-0.5"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addIngredient(phase)}
              className="text-xs text-golden hover:underline"
            >
              + ингредиент в «{phase}»
            </button>
          </div>
        ))}

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => addIngredient()}
            className="text-sm text-terracotta font-medium hover:underline"
          >
            + Ингредиент
          </button>
          <button
            type="button"
            onClick={() => setShowPhaseInput(true)}
            className="text-sm text-golden font-medium hover:underline"
          >
            + Фаза
          </button>
        </div>

        {showPhaseInput && (
          <div className="bg-golden/5 border-2 border-golden/30 rounded-xl p-3 space-y-2 animate-fade-up">
            <p className="text-xs font-bold text-golden">Новая фаза</p>
            <input
              type="text"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              placeholder="Заварка, Опара, Основное тесто..."
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
                Добавить
              </button>
              <button
                type="button"
                onClick={() => { setShowPhaseInput(false); setNewPhaseName(""); }}
                className="px-3 py-1.5 text-xs text-brown-light hover:text-brown transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-brown">Шаги (каждый с новой строки)</label>
        <textarea
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
          placeholder={"Смешать муку и воду\nДобавить закваску\nВымесить тесто\n..."}
          rows={5}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Фото */}
      <div>
        <label className="text-sm font-medium text-brown">Фото (до 3)</label>
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
            <span className="text-sm font-medium">{uploadingPhoto ? "Загрузка..." : "Добавить фото"}</span>
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

      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full py-4 bg-terracotta text-white text-lg font-bold rounded-xl card-shadow-lg hover:bg-terracotta-light active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? "Сохраняю..." : (editId ? "Сохранить изменения" : "Сохранить рецепт")}
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
            Пересчитать
          </h3>
          <button onClick={onClose} className="text-brown-light hover:text-brown transition-colors">
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 space-y-4 flex-1">
        {/* Целевой вес */}
        <div>
          <label className="text-sm font-medium text-brown">Общий вес ингредиентов (г)</label>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="w-full mt-1 px-4 py-3 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark font-bold text-center text-lg focus:outline-none focus:border-terracotta transition-colors"
          />
          {originalTotal > 0 && scale !== 1 && (
            <p className="text-xs text-brown-light mt-1 text-center">
              Коэффициент: ×{scale.toFixed(2)}
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
            Граммы
          </button>
          <button
            onClick={() => setShowPercents(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              showPercents ? "bg-white text-terracotta card-shadow" : "text-brown-light"
            }`}
          >
            Пекарские %
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
            Проценты от общего веса муки ({Math.round(totalFlour * scale)}г)
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
              Сохранить как основной
            </button>
          )}
          <button
            onClick={() => handleSave("new")}
            disabled={saving || target <= 0}
            className="w-full py-3 bg-golden text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            Сохранить как новый рецепт
          </button>
          <button
            onClick={() => handleSave("variant")}
            disabled={saving || target <= 0}
            className="w-full py-3 bg-warm-beige text-brown font-bold rounded-xl hover:bg-warm-beige/80 active:scale-95 transition-all disabled:opacity-50"
          >
            Сохранить как вариант
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecipesTab({ goToListSignal }: { goToListSignal?: number }) {
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

  // При повторном нажатии на вкладку — вернуться к списку
  useEffect(() => {
    if (goToListSignal) {
      setSelected(null);
      setShowList(true);
    }
  }, [goToListSignal]);

  const loadRecipes = useCallback(async () => {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    setRecipes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  async function handleScanPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setScanning(true);
    setScanError("");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("photo", files[i]);
    }

    try {
      const res = await fetch("/api/recipes/scan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setScanError(data.error + (data.details ? ": " + data.details : ""));
        setScanning(false);
        return;
      }

      setScanned(data);
      setShowAdd(true);
    } catch (err) {
      setScanError("Ошибка при распознавании: " + String(err));
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
          <p className="text-brown-light text-lg">Загрузка рецептов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-4 gap-4 pb-24 animate-fade-up">
      <Icon name="recipe-page" size={40} className="text-terracotta" />
      <h2 className="text-xl font-extrabold text-brown-dark">Рецепты</h2>

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
            Отмена
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
            Отмена
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
                Вернуться к черновику
              </button>
            )}
            <button
              onClick={() => { setShowAdd(true); setShowList(false); setEditing(null); }}
              className="w-full py-4 bg-card rounded-2xl border-2 border-dashed border-terracotta/30 text-terracotta font-bold hover:border-terracotta/60 hover:bg-terracotta/5 transition-all"
            >
              + Добавить свой рецепт
            </button>

            <label className="w-full py-4 bg-card rounded-2xl border-2 border-dashed border-golden/30 text-golden font-bold hover:border-golden/60 hover:bg-golden/5 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Icon name="notebook" size={20} />
              {scanning ? "Распознаю..." : "Распознать с фото"}
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

          <div className="w-full max-w-sm space-y-3">
            {recipes.filter((r) => !r.parentId).map((r) => (
              <RecipeCard key={r.id} recipe={r} onSelect={(r) => { setSelected(r); setShowList(false); }} />
            ))}
          </div>

          {recipes.length === 0 && (
            <p className="text-brown-light text-center py-8">
              Пока нет рецептов. Добавь свой первый!
            </p>
          )}
        </>
      )}
    </div>
  );
}
