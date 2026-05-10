"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  phase?: string;
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
  isBuiltIn: boolean;
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
      </div>
    </button>
  );
}

function RecipeDetail({
  recipe,
  onBack,
  onDeleted,
  onEdit,
}: {
  recipe: Recipe;
  onBack: () => void;
  onDeleted: () => void;
  onEdit: () => void;
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
  const steps: string[] = JSON.parse(recipe.steps);

  // Расчёт гидратации: из сохранённого или вычислить из ингредиентов
  const calcData: HydrationCalc | null = (() => {
    if (recipe.hydrationCalc) return JSON.parse(recipe.hydrationCalc) as HydrationCalc;
    if (!recipe.ingredients) return null;

    const ings = JSON.parse(recipe.ingredients) as Ingredient[];
    const flourKeywords = ["мука", "солод"];
    const liquidKeywords = ["вода", "молоко", "кефир", "пахта", "сыворотка", "сок", "йогурт"];

    const flourItems: string[] = [];
    const liquidItems: string[] = [];
    let totalFlour = 0;
    let totalLiquid = 0;

    for (const ing of ings) {
      const nameLower = ing.name.toLowerCase();
      const amount = parseFloat(ing.amount) || 0;
      if (amount <= 0) continue;

      if (flourKeywords.some(k => nameLower.includes(k))) {
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
      totalFlour,
      flourItems,
      totalLiquid,
      liquidItems,
      formula: `${totalLiquid} / ${totalFlour} × 100 = ${hydPct}%`,
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

        <div className="flex gap-3 flex-wrap mb-5">
          <div className="bg-warm-beige/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-brown-light">Мука</p>
            <p className="text-sm font-bold text-brown">{recipe.flour}</p>
          </div>
          <div className="bg-warm-beige/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-brown-light flex items-center gap-1 justify-center">
              <Icon name="wheat" size={12} /> Закваска
            </p>
            <p className="text-sm font-bold text-brown">{recipe.starterPct}%</p>
          </div>
          {recipe.salt && (
            <div className="bg-warm-beige/50 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-brown-light">Соль</p>
              <p className="text-sm font-bold text-brown">{recipe.salt}г</p>
            </div>
          )}
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
            <p className="text-sm font-bold text-brown">{recipe.hydration}%</p>
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
          </div>
        )}

        {recipe.ingredients && (() => {
          const ings = JSON.parse(recipe.ingredients) as Ingredient[];
          const recipePhases = [...new Set(ings.map(ing => ing.phase).filter(Boolean))] as string[];
          const noPhase = ings.filter(ing => !ing.phase);
          return (
            <>
              <h3 className="font-extrabold text-brown-dark mb-2">Ингредиенты:</h3>
              <div className="space-y-3 mb-5">
                {noPhase.length > 0 && (
                  <div className="space-y-1.5">
                    {noPhase.map((ing, i) => (
                      <div key={i} className="flex justify-between items-center bg-warm-beige/30 rounded-lg px-3 py-1.5">
                        <span className="text-sm text-brown">{ing.name}</span>
                        <span className="text-sm font-bold text-brown-dark">{ing.amount} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
                {recipePhases.map(phase => (
                  <div key={phase}>
                    <p className="text-xs font-bold text-golden mb-1">{phase}</p>
                    <div className="space-y-1.5 border-l-2 border-golden/30 pl-3">
                      {ings.filter(ing => ing.phase === phase).map((ing, i) => (
                        <div key={i} className="flex justify-between items-center bg-warm-beige/30 rounded-lg px-3 py-1.5">
                          <span className="text-sm text-brown">{ing.name}</span>
                          <span className="text-sm font-bold text-brown-dark">{ing.amount} {ing.unit}</span>
                        </div>
                      ))}
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

function AddRecipeForm({ onCreated, initial, editId }: { onCreated: () => void; initial?: ScannedRecipe; editId?: string }) {
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
  const [loading, setLoading] = useState(false);

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
    const liquidKeywords = ["вода"];

    let totalFlour = 0;
    for (const ing of ingredients) {
      if (flourKeywords.some(k => ing.name.toLowerCase().includes(k))) {
        totalFlour += parseFloat(ing.amount) || 0;
      }
    }
    if (totalFlour <= 0) return;

    const neededWater = Math.round(totalFlour * h / 100);
    // Обновить первый ингредиент "вода"
    const waterIdx = ingredients.findIndex(ing =>
      liquidKeywords.some(k => ing.name.toLowerCase().includes(k))
    );
    if (waterIdx >= 0) {
      setIngredients(prev => prev.map((ing, i) =>
        i === waterIdx ? { ...ing, amount: String(neededWater) } : ing
      ));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const steps = stepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const filteredIngredients = ingredients.filter(ing => ing.name.trim());

    const res = await fetch("/api/recipes", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(editId ? { id: editId } : {}),
        title: title.trim(),
        description: description.trim() || null,
        flour,
        hydration: parseInt(hydration) || 70,
        starterPct: parseInt(starterPct) || 20,
        salt: salt ? parseFloat(salt) : null,
        ingredients: filteredIngredients.length > 0 ? JSON.stringify(filteredIngredients) : null,
        hydrationCalc: initial?.hydrationCalc ? JSON.stringify(initial.hydrationCalc) : null,
        steps: JSON.stringify(steps),
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

      <div className="grid grid-cols-3 gap-2 items-end">
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
            <label className="text-xs font-medium text-brown">Гидр. %</label>
            {initial?.hydrationCalc && (
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

      {showCalc && initial?.hydrationCalc && (
        <div className="bg-warm-beige/40 rounded-xl p-3 text-sm space-y-2 animate-fade-up">
          <p className="font-bold text-brown-dark text-xs">Расчёт гидратации:</p>
          <div className="space-y-1">
            <p className="text-brown">
              <span className="font-medium">Мука ({initial.hydrationCalc.totalFlour}г):</span>{" "}
              {initial.hydrationCalc.flourItems.join(", ")}
            </p>
            <p className="text-brown">
              <span className="font-medium">Жидкости ({initial.hydrationCalc.totalLiquid}г):</span>{" "}
              {initial.hydrationCalc.liquidItems.join(", ")}
            </p>
            <p className="text-terracotta font-bold text-xs mt-1">
              {initial.hydrationCalc.formula}
            </p>
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
                  className="w-14 shrink-0 px-1.5 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
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
                  className="w-14 shrink-0 px-1.5 py-2 border-2 border-warm-beige rounded-xl bg-cream text-brown-dark text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
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

export function RecipesTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [scanned, setScanned] = useState<ScannedRecipe | undefined>();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

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
          <Icon name="bread" size={48} className="mb-4 animate-bounce text-terracotta mx-auto" />
          <p className="text-brown-light text-lg">Загрузка рецептов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-4 gap-4 pb-24 animate-fade-up">
      <Icon name="bread" size={40} className="text-terracotta" />
      <h2 className="text-xl font-extrabold text-brown-dark">Рецепты</h2>

      {selected ? (
        <RecipeDetail
          recipe={selected}
          onBack={() => setSelected(null)}
          onDeleted={() => { setSelected(null); loadRecipes(); }}
          onEdit={() => {
            setEditing(selected);
            setSelected(null);
          }}
        />
      ) : editing ? (
        <>
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
            onCreated={() => {
              loadRecipes();
              setEditing(null);
            }}
          />
          <button
            onClick={() => setEditing(null)}
            className="text-brown-light hover:text-brown text-sm transition-colors"
          >
            Отмена
          </button>
        </>
      ) : showAdd ? (
        <>
          <AddRecipeForm
            key={JSON.stringify(scanned)}
            initial={scanned}
            onCreated={() => {
              loadRecipes();
              setShowAdd(false);
              setScanned(undefined);
            }}
          />
          <button
            onClick={() => { setShowAdd(false); setScanned(undefined); }}
            className="text-brown-light hover:text-brown text-sm transition-colors"
          >
            Отмена
          </button>
        </>
      ) : (
        <>
          {/* Кнопки добавления */}
          <div className="w-full max-w-sm space-y-2">
            <button
              onClick={() => setShowAdd(true)}
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

          {/* Список рецептов */}
          <div className="w-full max-w-sm space-y-3">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} onSelect={setSelected} />
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
