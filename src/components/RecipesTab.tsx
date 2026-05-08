"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  flour: string;
  hydration: number;
  starterPct: number;
  salt: number | null;
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
}: {
  recipe: Recipe;
  onBack: () => void;
}) {
  const steps: string[] = JSON.parse(recipe.steps);

  return (
    <div className="w-full max-w-sm space-y-4 animate-fade-up">
      <button
        onClick={onBack}
        className="text-terracotta font-bold text-sm hover:underline flex items-center gap-1"
      >
        <Icon name="back" size={16} /> Назад к рецептам
      </button>

      <div className="bg-card rounded-2xl p-5 card-shadow border border-warm-beige/60">
        <h2 className="text-xl font-extrabold text-brown-dark mb-2">{recipe.title}</h2>
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
              <Icon name="drop" size={12} /> Гидратация
            </p>
            <p className="text-sm font-bold text-brown">{recipe.hydration}%</p>
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
        </div>

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

function AddRecipeForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flour, setFlour] = useState("Пшеничная");
  const [hydration, setHydration] = useState("70");
  const [starterPct, setStarterPct] = useState("20");
  const [salt, setSalt] = useState("10");
  const [stepsText, setStepsText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !stepsText.trim()) return;

    setLoading(true);
    const steps = stepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        flour,
        hydration: parseInt(hydration),
        starterPct: parseInt(starterPct),
        salt: salt ? parseFloat(salt) : null,
        steps: JSON.stringify(steps),
      }),
    });

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
      <h3 className="text-lg font-extrabold text-brown-dark">Добавить рецепт</h3>

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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-brown">Мука</label>
          <Dropdown
            value={flour}
            options={["Пшеничная", "Ржаная"]}
            onChange={setFlour}
            allowCustom
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brown">Гидратация %</label>
          <input
            type="number"
            value={hydration}
            onChange={(e) => setHydration(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brown">Закваска %</label>
          <input
            type="number"
            value={starterPct}
            onChange={(e) => setStarterPct(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brown">Соль (г)</label>
          <input
            type="number"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-brown">Шаги (каждый с новой строки)</label>
        <textarea
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
          placeholder={"Смешать муку и воду\nДобавить закваску\nВымесить тесто\n..."}
          rows={5}
          required
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim() || !stepsText.trim()}
        className="w-full py-4 bg-terracotta text-white text-lg font-bold rounded-xl card-shadow-lg hover:bg-terracotta-light active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? "Сохраняю..." : "Сохранить рецепт"}
      </button>
    </form>
  );
}

export function RecipesTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const loadRecipes = useCallback(async () => {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    setRecipes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

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
        <RecipeDetail recipe={selected} onBack={() => setSelected(null)} />
      ) : showAdd ? (
        <>
          <AddRecipeForm
            onCreated={() => {
              loadRecipes();
              setShowAdd(false);
            }}
          />
          <button
            onClick={() => setShowAdd(false)}
            className="text-brown-light hover:text-brown text-sm transition-colors"
          >
            Отмена
          </button>
        </>
      ) : (
        <>
          {/* Кнопка добавления */}
          <button
            onClick={() => setShowAdd(true)}
            className="w-full max-w-sm py-4 bg-card rounded-2xl border-2 border-dashed border-terracotta/30 text-terracotta font-bold hover:border-terracotta/60 hover:bg-terracotta/5 transition-all"
          >
            + Добавить свой рецепт
          </button>

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
