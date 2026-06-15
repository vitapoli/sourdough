"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "ru" | "en";

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "ru",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "en" || saved === "ru") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/* Функция для получения перевода */
export function useT() {
  const { lang } = useLang();
  return function t(key: string): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry.ru || key;
  };
}

// Маппинг русских значений из БД на ключи переводов
const dbFlourMap: Record<string, string> = {
  "Ржаная": "create.rye",
  "Пшеничная": "create.wheat",
};

export function useFlourLabel() {
  const t = useT();
  return (dbValue: string | null | undefined) => {
    if (!dbValue) return "";
    const key = dbFlourMap[dbValue];
    return key ? t(key) : dbValue;
  };
}

/* ========== Словарь ========== */

const translations: Record<string, { ru: string; en: string }> = {
  // --- Общие ---
  "loading": { ru: "Загрузка...", en: "Loading..." },
  "cancel": { ru: "Отмена", en: "Cancel" },
  "save": { ru: "Сохранить", en: "Save" },
  "delete": { ru: "Удалить", en: "Delete" },
  "edit": { ru: "Редактировать", en: "Edit" },
  "back": { ru: "Назад", en: "Back" },
  "close": { ru: "Закрыть", en: "Close" },
  "show": { ru: "Показать", en: "Show" },
  "hide": { ru: "Скрыть", en: "Hide" },
  "error": { ru: "Ошибка", en: "Error" },

  // --- Шапка ---
  "app.subtitle": { ru: "трекер закваски", en: "starter tracker" },
  "mode.simple": { ru: "Простой", en: "Simple" },
  "mode.detailed": { ru: "Подробный", en: "Detailed" },

  // --- TabBar ---
  "tab.tracker": { ru: "Трекер", en: "Tracker" },
  "tab.calculator": { ru: "Калькулятор", en: "Calculator" },
  "tab.recipes": { ru: "Рецепты", en: "Recipes" },
  "tab.community": { ru: "Пекари", en: "Bakers" },

  // --- Гостевой режим (проба без регистрации) ---
  "guest.banner": { ru: "Демо-режим — закваска живёт только в этом браузере", en: "Demo mode — your starter lives only in this browser" },
  "guest.bannerCta": { ru: "Сохранить", en: "Save" },
  "guest.detailedHint": { ru: "Есть подробный режим: настройка подъёма закваски и таймер кормления — откроется после регистрации →", en: "There's a detailed mode: starter rise tracking and a feeding timer — unlocks after sign up →" },
  "guest.login": { ru: "Уже есть аккаунт? Войти", en: "Already have an account? Log in" },
  "guest.gate.recipesTitle": { ru: "Рецепты — после регистрации", en: "Recipes — after sign up" },
  "guest.gate.communityTitle": { ru: "Лента пекарей — после регистрации", en: "Bakers' feed — after sign up" },
  "guest.gate.desc": { ru: "Зарегистрируйтесь бесплатно, чтобы открыть рецепты, ленту пекарей и сохранить свою закваску.", en: "Sign up free to unlock recipes, the bakers' feed and save your starter." },
  "guest.gate.cta": { ru: "Создать аккаунт", en: "Create account" },

  // --- Трекер ---
  "tracker.hello": { ru: "Привет, пекарь!", en: "Hello, baker!" },
  "tracker.createFirst": { ru: "Давай создадим твою первую закваску", en: "Let's create your first starter" },
  "tracker.newStarter": { ru: "Новая закваска", en: "New starter" },
  "tracker.addAnother": { ru: "Добавь ещё одну закваску", en: "Add another starter" },
  "tracker.elapsed": { ru: "Прошло", en: "Elapsed" },
  "tracker.toPeak": { ru: "До пика", en: "To peak" },
  "tracker.atPeak": { ru: "На пике", en: "At peak" },
  "tracker.flour": { ru: "Мука", en: "Flour" },
  "tracker.age": { ru: "Возраст", en: "Age" },
  "tracker.days": { ru: "дн.", en: "d" },
  "tracker.feedings": { ru: "Кормлений", en: "Feedings" },
  "tracker.deleteConfirm": { ru: "Удалить закваску \"{name}\"? Это действие нельзя отменить.", en: "Delete starter \"{name}\"? This cannot be undone." },
  "tracker.fed": { ru: "Покормлена!", en: "Fed!" },
  "tracker.noFeedings": { ru: "Ещё ни одного кормления", en: "No feedings yet" },
  "tracker.noDayFeedings": { ru: "Нет кормлений в этот день", en: "No feedings on this day" },
  "tracker.lastFeedings": { ru: "Последние кормления", en: "Recent feedings" },
  "tracker.addFeeding": { ru: "+ Добавить кормление", en: "+ Add feeding" },
  "tracker.add": { ru: "Добавить", en: "Add" },
  "tracker.time": { ru: "Время:", en: "Time:" },
  "tracker.water": { ru: "Вода", en: "Water" },
  "day.mon": { ru: "Пн", en: "Mo" },
  "day.tue": { ru: "Вт", en: "Tu" },
  "day.wed": { ru: "Ср", en: "We" },
  "day.thu": { ru: "Чт", en: "Th" },
  "day.fri": { ru: "Пт", en: "Fr" },
  "day.sat": { ru: "Сб", en: "Sa" },
  "day.sun": { ru: "Вс", en: "Su" },

  // --- Форма кормления ---
  "feeding.starter": { ru: "Закваска", en: "Starter" },
  "feeding.starterG": { ru: "Закв.", en: "Str." },
  "feeding.flourG": { ru: "Мука, г", en: "Flour, g" },
  "feeding.waterG": { ru: "Вода, г", en: "Water, g" },
  "feeding.ratio": { ru: "Соотн.", en: "Ratio" },
  "feeding.feed": { ru: "Покормить", en: "Feed" },
  "feeding.tempNotes": { ru: "Темп. и заметки", en: "Temp. & notes" },
  "feeding.notesPlaceholder": { ru: "Заметки: запах, консистенция...", en: "Notes: smell, consistency..." },
  "feeding.photoError": { ru: "Не удалось загрузить фото", en: "Failed to upload photo" },

  // --- Создание закваски ---
  "create.title": { ru: "Создай свою закваску", en: "Create your starter" },
  "create.name": { ru: "Имя закваски", en: "Starter name" },
  "create.namePlaceholder": { ru: "Например: Ржанка, Малышка...", en: "e.g. Rye Girl, Bubbles..." },
  "create.flourType": { ru: "Тип муки", en: "Flour type" },
  "create.rye": { ru: "Ржаная", en: "Rye" },
  "create.wheat": { ru: "Пшеничная", en: "Wheat" },
  "create.creating": { ru: "Создаю...", en: "Creating..." },
  "create.start": { ru: "Начать!", en: "Start!" },
  "create.nameTooLong": { ru: "Имя должно содержать менее 30 символов", en: "Name must be under 30 characters" },
  "create.flourTooLong": { ru: "Тип муки должен содержать менее 30 символов", en: "Flour type must be under 30 characters" },

  // --- История кормлений ---
  "history.title": { ru: "История кормлений", en: "Feeding history" },
  "history.noFeedings": { ru: "Ещё ни одного кормления", en: "No feedings yet" },
  "history.observation": { ru: "наблюдение", en: "observation" },
  "history.recordResult": { ru: "Записать результат", en: "Record result" },
  "history.editResult": { ru: "Изменить результат", en: "Edit result" },
  "history.starterG": { ru: "Закваска (г)", en: "Starter (g)" },
  "history.flourG": { ru: "Мука (г)", en: "Flour (g)" },
  "history.waterG": { ru: "Вода (г)", en: "Water (g)" },
  "history.flourType": { ru: "Тип муки", en: "Flour type" },
  "history.tempC": { ru: "Температура °C", en: "Temperature °C" },
  "history.notes": { ru: "Заметки", en: "Notes" },
  "history.notesPlaceholder": { ru: "Запах, консистенция...", en: "Smell, consistency..." },
  "history.photo": { ru: "Фото", en: "Photo" },
  "history.remove": { ru: "Убрать", en: "Remove" },
  "history.peak": { ru: "Пик:", en: "Peak:" },
  "history.hours": { ru: "ч", en: "h" },
  "history.minutes": { ru: "мин", en: "min" },
  "history.rise": { ru: "Подъём:", en: "Rise:" },
  "history.times": { ru: "раз", en: "x" },
  "history.gStarter": { ru: "г зак.", en: "g starter" },
  "history.gFlour": { ru: "г муки", en: "g flour" },
  "history.gWater": { ru: "г воды", en: "g water" },
  "history.peakLabel": { ru: "пик:", en: "peak:" },

  // --- Калькулятор ---
  "calc.title": { ru: "Калькулятор закваски", en: "Starter calculator" },
  "calc.current": { ru: "Текущая закваска", en: "Current starter" },
  "calc.flourG": { ru: "Мука, г", en: "Flour, g" },
  "calc.waterG": { ru: "Вода, г", en: "Water, g" },
  "calc.weightG": { ru: "Вес, г", en: "Weight, g" },
  "calc.hydrPct": { ru: "Гидр, %", en: "Hydr, %" },
  "calc.targetHydration": { ru: "Нужная гидратация", en: "Target hydration" },
  "calc.specifyAmount": { ru: "Указать кол-во закваски", en: "Specify starter amount" },
  "calc.amountG": { ru: "Кол-во закваски, г", en: "Starter amount, g" },
  "calc.enterData": { ru: "Введи данные закваски выше", en: "Enter starter data above" },
  "calc.alreadyMatch": { ru: "Гидратация уже совпадает!", en: "Hydration already matches!" },
  "calc.add": { ru: "Добавь", en: "Add" },
  "calc.water": { ru: "воды", en: "water" },
  "calc.flour": { ru: "муки", en: "flour" },
  "calc.total": { ru: "Итого", en: "Total" },
  "calc.remove": { ru: "Убери", en: "Remove" },
  "calc.eg100": { ru: "напр. 100", en: "e.g. 100" },

  // --- Рецепты ---
  "recipes.builtin": { ru: "Базовый", en: "Built-in" },
  "recipes.by": { ru: "от", en: "by" },
  "recipes.translate": { ru: "Перевести", en: "Translate" },
  "recipes.translating": { ru: "Перевод…", en: "Translating…" },
  "recipes.showOriginal": { ru: "Показать оригинал", en: "Show original" },
  "recipes.showTranslation": { ru: "Показать перевод", en: "Show translation" },
  "recipes.translateError": { ru: "Не удалось перевести", en: "Translation failed" },
  "recipes.roleFlour": { ru: "Мука", en: "Flour" },
  "recipes.roleLiquid": { ru: "Жидкость", en: "Liquid" },
  "recipes.roleStarter": { ru: "Закваска", en: "Starter" },
  "recipes.roleNone": { ru: "—", en: "—" },
  "recipes.unpin": { ru: "Открепить", en: "Unpin" },
  "recipes.pin": { ru: "Закрепить", en: "Pin" },
  "recipes.show": { ru: "Показать", en: "Show" },
  "recipes.hide": { ru: "Скрыть", en: "Hide" },
  "recipes.publish": { ru: "Опубликовать", en: "Publish" },
  "recipes.unpublish": { ru: "Снять с публикации", en: "Unpublish" },
  "recipes.deleteConfirm": { ru: "Удалить этот рецепт?", en: "Delete this recipe?" },
  "recipes.editTitle": { ru: "Редактировать рецепт", en: "Edit recipe" },
  "recipes.addTitle": { ru: "Добавить рецепт", en: "Add recipe" },
  "recipes.titlePlaceholder": { ru: "Мой любимый хлеб", en: "My favorite bread" },
  "recipes.descPlaceholder": { ru: "Краткое описание", en: "Short description" },
  "recipes.saving": { ru: "Сохраняю...", en: "Saving..." },
  "recipes.saveChanges": { ru: "Сохранить изменения", en: "Save changes" },
  "recipes.saveRecipe": { ru: "Сохранить рецепт", en: "Save recipe" },
  "recipes.addPhoto": { ru: "Добавить фото", en: "Add photo" },
  "recipes.uploading": { ru: "Загрузка...", en: "Uploading..." },
  "recipes.flour": { ru: "Мука", en: "Flour" },
  "recipes.starter": { ru: "Закваска", en: "Starter" },
  "recipes.hydration": { ru: "Гидратация", en: "Hydration" },
  "recipes.namePlaceholder": { ru: "Название", en: "Name" },
  "recipes.unitPlaceholder": { ru: "ед", en: "u" },
  "recipes.stepPlaceholder": { ru: "Смешать муку и воду\nДобавить закваску\nВымесить тесто\n...", en: "Mix flour and water\nAdd starter\nKnead the dough\n..." },
  "recipes.phasePlaceholder": { ru: "Заварка, Опара, Основное тесто...", en: "Brew, Poolish, Main dough..." },
  "recipes.savePdf": { ru: "Сохранить PDF", en: "Save PDF" },
  "recipes.deleteRecipe": { ru: "Удалить рецепт", en: "Delete recipe" },
  "recipes.backToRecipes": { ru: "Назад к рецептам", en: "Back to recipes" },
  "recipes.loadingRecipes": { ru: "Загрузка рецептов...", en: "Loading recipes..." },
  "recipes.photoUploadError": { ru: "Не удалось загрузить фото", en: "Failed to upload photo" },
  "recipes.unknownError": { ru: "неизвестная ошибка", en: "unknown error" },
  "recipes.photoUploadFailed": { ru: "Ошибка загрузки фото", en: "Photo upload error" },
  "recipes.saveError": { ru: "Ошибка сохранения", en: "Save error" },
  "recipes.ingredients": { ru: "Ингредиенты", en: "Ingredients" },
  "recipes.directions": { ru: "Приготовление", en: "Directions" },
  "recipes.calcTitle": { ru: "Расчёт гидратации:", en: "Hydration calculation:" },
  "recipes.flourLabel": { ru: "Мука", en: "Flour" },
  "recipes.liquidsLabel": { ru: "Жидкости", en: "Liquids" },
  "recipes.starterHydration": { ru: "Гидратация закваски:", en: "Starter hydration:" },
  "recipes.clickToChange": { ru: "Нажми на роль, чтобы изменить", en: "Click the role to change" },
  "recipes.auto": { ru: "Авто", en: "Auto" },
  "recipes.manual": { ru: "Вручную", en: "Manual" },
  "recipes.recalculate": { ru: "Пересчитать", en: "Recalculate" },
  "recipes.variants": { ru: "Варианты:", en: "Variants:" },
  "recipes.withPhoto": { ru: "С фото", en: "With photos" },
  "recipes.nameLabel": { ru: "Название", en: "Title" },
  "recipes.descLabel": { ru: "Описание", en: "Description" },
  "recipes.flourTypeLabel": { ru: "Мука", en: "Flour" },
  "recipes.starterPct": { ru: "Закваска %", en: "Starter %" },
  "recipes.starterHydrationPct": { ru: "Гидр. закваски %", en: "Starter hydr. %" },
  "recipes.saltG": { ru: "Соль (г)", en: "Salt (g)" },
  "recipes.hydrationPct": { ru: "Гидратация %", en: "Hydration %" },
  "recipes.calculatedFromIngs": { ru: "Рассчитывается из ингредиентов", en: "Calculated from ingredients" },
  "recipes.ingredientsLabel": { ru: "Ингредиенты", en: "Ingredients" },
  "recipes.pinToHeaderG": { ru: "В шапку (г)", en: "Pin to header (g)" },
  "recipes.pinToHeaderPct": { ru: "В шапку (%)", en: "Pin to header (%)" },
  "recipes.removePhase": { ru: "убрать фазу", en: "remove phase" },
  "recipes.addIngToPhase": { ru: "+ ингредиент в", en: "+ ingredient in" },
  "recipes.addIngredient": { ru: "+ Ингредиент", en: "+ Ingredient" },
  "recipes.addPhase": { ru: "+ Фаза", en: "+ Phase" },
  "recipes.newPhase": { ru: "Новая фаза", en: "New phase" },
  "recipes.add": { ru: "Добавить", en: "Add" },
  "recipes.stepsLabel": { ru: "Шаги (каждый с новой строки)", en: "Steps (one per line)" },
  "recipes.photosLabel": { ru: "Фото (до 3)", en: "Photos (up to 3)" },
  "recipes.showInPreview": { ru: "Показывать в превью", en: "Show in preview" },
  "recipes.totalWeightG": { ru: "Общий вес ингредиентов (г)", en: "Total ingredients weight (g)" },
  "recipes.coefficient": { ru: "Коэффициент", en: "Coefficient" },
  "recipes.grams": { ru: "Граммы", en: "Grams" },
  "recipes.bakersPct": { ru: "Пекарские %", en: "Baker's %" },
  "recipes.pctOfFlour": { ru: "Проценты от общего веса муки", en: "Percentages of total flour weight" },
  "recipes.saveAsMain": { ru: "Сохранить как основной", en: "Save as main" },
  "recipes.saveAsNew": { ru: "Сохранить как новый рецепт", en: "Save as new recipe" },
  "recipes.saveAsVariant": { ru: "Сохранить как вариант", en: "Save as variant" },
  "recipes.backToDraft": { ru: "Вернуться к черновику", en: "Back to draft" },
  "recipes.addOwn": { ru: "+ Добавить свой рецепт", en: "+ Add your own recipe" },
  "recipes.scanning": { ru: "Распознаю...", en: "Scanning..." },
  "recipes.scanFromPhoto": { ru: "Распознать с фото", en: "Scan from photo" },
  "recipes.hideHidden": { ru: "Скрыть спрятанные", en: "Hide hidden" },
  "recipes.showHidden": { ru: "Показать скрытые", en: "Show hidden" },
  "recipes.noRecipes": { ru: "Пока нет рецептов. Добавь свой первый!", en: "No recipes yet. Add your first!" },
  "recipes.scanPhotoError": { ru: "Ошибка при обработке фото", en: "Photo processing error" },
  "recipes.scanServerError": { ru: "Ошибка сервера", en: "Server error" },
  "recipes.scanRecognizeError": { ru: "Ошибка при распознавании", en: "Recognition error" },
  "recipes.imageLoadError": { ru: "Не удалось загрузить изображение", en: "Failed to load image" },
  "recipes.appSubtitle": { ru: "трекер закваски", en: "starter tracker" },

  // --- Сообщество ---
  "community.justNow": { ru: "только что", en: "just now" },
  "community.minAgo": { ru: "мин", en: "min" },
  "community.hAgo": { ru: "ч", en: "h" },
  "community.dAgo": { ru: "д", en: "d" },
  "community.monthAgo": { ru: "мес", en: "mo" },
  "community.new": { ru: "Новое", en: "New" },
  "community.popular": { ru: "Популярное", en: "Popular" },
  "community.searchPlaceholder": { ru: "Поиск рецептов...", en: "Search recipes..." },
  "community.nothingFound": { ru: "Ничего не найдено", en: "Nothing found" },
  "community.noRecipes": { ru: "Пока нет публичных рецептов. Поделитесь своим первым!", en: "No public recipes yet. Share yours first!" },
  "community.anon": { ru: "Аноним", en: "Anonymous" },
  "community.saved": { ru: "Сохранён", en: "Saved" },
  "community.ingredients": { ru: "Ингредиенты", en: "Ingredients" },
  "community.steps": { ru: "Приготовление", en: "Directions" },
  "community.comments": { ru: "Комментарии", en: "Comments" },
  "community.noComments": { ru: "Пока нет комментариев", en: "No comments yet" },
  "community.commentPlaceholder": { ru: "Написать комментарий...", en: "Write a comment..." },

  // --- Настройки подъёма ---
  "rise.settings": { ru: "Настройки шкалы подъёма", en: "Rise scale settings" },
  "rise.customData": { ru: "свои данные", en: "custom data" },
  "rise.howItWorks": { ru: "Как работает брожение", en: "How fermentation works" },
  "rise.scaleTitle": { ru: "Шкала подъёма", en: "Rise scale" },
  "rise.whichData": { ru: "Какие данные использовать?", en: "Which data to use?" },
  "rise.general": { ru: "Общие", en: "General" },
  "rise.myData": { ru: "Мои данные", en: "My data" },
  "rise.noObservations": { ru: "Пока нет наблюдений. Записать результат можно в истории кормлений.", en: "No observations yet. You can record results in the feeding history." },
  "rise.myObservations": { ru: "Мои наблюдения:", en: "My observations:" },
  "rise.all": { ru: "Все", en: "All" },
  "rise.h": { ru: "ч", en: "h" },
  "rise.calcOne": { ru: "Расчёт по одному наблюдению", en: "Calculated from one observation" },
  "rise.calcAvg": { ru: "Расчёт усредняет {n} выбранных наблюдений", en: "Averaged across {n} selected observations" },
  "rise.calcGeneral": { ru: "Средние значения из пекарских источников", en: "Average values from baking sources" },
  "rise.basedOn": { ru: "На чём основан расчёт?", en: "What is this based on?" },
  "rise.peakAt22": { ru: "Время до пика при 22°C:", en: "Time to peak at 22°C:" },
  "rise.ratio": { ru: "Соотношение", en: "Ratio" },
  "rise.ryeFaster": { ru: "Ржаная на 20-25% быстрее за счёт большего содержания свободных сахаров и активных ферментов", en: "Rye is 20-25% faster thanks to its higher content of free sugars and active enzymes" },
  "rise.visualRise": { ru: "Визуальный подъём:", en: "Visual rise:" },
  "rise.wheatHigher": { ru: "Пшеничная поднимается выше за счёт глютеновой сетки. Ржаная ниже — газ удерживают пентозаны, а не глютен", en: "Wheat rises higher thanks to the gluten network. Rye rises less — gas is held by pentosans, not gluten" },
  "rise.tempEffect": { ru: "Влияние температуры:", en: "Temperature effect:" },
  "rise.tempDesc": { ru: "Каждые +5.5°C время сокращается вдвое. При 28°C пшеничная 1:2:2 достигнет пика за ~3.5 ч, при 16°C — за ~14 ч.", en: "Every +5.5°C halves the time. At 28°C wheat 1:2:2 peaks in ~3.5 h, at 16°C — in ~14 h." },
  "rise.sources": { ru: "Источники:", en: "Sources:" },
  "rise.sourceJourney": { ru: "эксперимент с CO₂-датчиком, сравнение пшеничной и ржаной муки при 20°C", en: "CO₂-sensor experiment comparing wheat and rye flour at 20°C" },
  "rise.empirical": { ru: "Эмпирические данные: King Arthur Baking (2025), Brod & Taylor, The Bread Code, Weekend Bakery, Catchymeals", en: "Empirical data: King Arthur Baking (2025), Brod & Taylor, The Bread Code, Weekend Bakery, Catchymeals" },
  "rise.hideHelp": { ru: "Скрыть подсказку", en: "Hide tip" },
  "rise.howToAdd": { ru: "Как добавить свои данные?", en: "How to add your own data?" },
  "rise.step1": { ru: "Покормите закваску и запишите кормление", en: "Feed your starter and log the feeding" },
  "rise.step2": { ru: "Когда закваска достигнет пика — откройте это кормление в истории", en: "When the starter reaches its peak — open that feeding in the history" },
  "rise.step3": { ru: "Укажите время до пика и во сколько раз она поднялась", en: "Enter the time to peak and how many times it rose" },
  "rise.step4": { ru: "Данные появятся здесь — чем больше наблюдений, тем точнее расчёт", en: "The data will appear here — the more observations, the more accurate the calculation" },
  "rise.at": { ru: "при", en: "at" },

  // --- Авторизация ---
  "auth.loginTitle": { ru: "Войди в свой аккаунт", en: "Sign in to your account" },
  "auth.loginError": { ru: "Ошибка входа", en: "Login error" },
  "auth.password": { ru: "Пароль", en: "Password" },
  "auth.passwordMin": { ru: "Минимум 6 символов", en: "At least 6 characters" },
  "auth.loggingIn": { ru: "Вхожу...", en: "Signing in..." },
  "auth.login": { ru: "Войти", en: "Sign in" },
  "auth.forgotPassword": { ru: "Забыл пароль?", en: "Forgot password?" },
  "auth.noAccount": { ru: "Нет аккаунта?", en: "No account?" },
  "auth.register": { ru: "Зарегистрируйся", en: "Sign up" },
  "auth.registerTitle": { ru: "Создай аккаунт", en: "Create account" },
  "auth.name": { ru: "Имя", en: "Name" },
  "auth.namePlaceholder": { ru: "Как тебя зовут?", en: "What's your name?" },
  "auth.nameEmpty": { ru: "Введите имя", en: "Enter your name" },
  "auth.nameTooLong": { ru: "Имя должно содержать менее 30 символов", en: "Name must be under 30 characters" },
  "auth.nameInvalid": { ru: "Имя должно состоять только из букв", en: "Name must contain only letters" },
  "auth.passwordShort": { ru: "Пароль минимум 6 символов", en: "Password must be at least 6 characters" },
  "auth.passwordWeak": { ru: "Пароль должен содержать как буквы так и цифры", en: "Password must contain both letters and numbers" },
  "auth.passwordMismatch": { ru: "Пароли не совпадают", en: "Passwords don't match" },
  "auth.registerError": { ru: "Ошибка регистрации", en: "Registration error" },
  "auth.repeatPassword": { ru: "Повтори пароль", en: "Repeat password" },
  "auth.repeatPlaceholder": { ru: "Ещё раз", en: "One more time" },
  "auth.registering": { ru: "Регистрация...", en: "Signing up..." },
  "auth.createAccount": { ru: "Создать аккаунт", en: "Create account" },
  "auth.hasAccount": { ru: "Уже есть аккаунт?", en: "Already have an account?" },
  "auth.forgotTitle": { ru: "Забыл пароль?", en: "Forgot password?" },
  "auth.forgotDesc": { ru: "Введи email и мы отправим ссылку для сброса", en: "Enter your email and we'll send a reset link" },
  "auth.sending": { ru: "Отправляю...", en: "Sending..." },
  "auth.sendLink": { ru: "Отправить ссылку", en: "Send link" },
  "auth.checkEmail": { ru: "Проверь почту", en: "Check your email" },
  "auth.checkEmailDesc": { ru: "Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.", en: "If an account with this email exists, we've sent a password reset link." },
  "auth.backToLogin": { ru: "Вернуться ко входу", en: "Back to login" },
  "auth.resetTitle": { ru: "Новый пароль", en: "New password" },
  "auth.newPassword": { ru: "Новый пароль", en: "New password" },
  "auth.saving": { ru: "Сохраняю...", en: "Saving..." },
  "auth.savePassword": { ru: "Сохранить пароль", en: "Save password" },
  "auth.invalidLink": { ru: "Недействительная ссылка", en: "Invalid link" },
  "auth.invalidLinkDesc": { ru: "Попробуйте запросить сброс пароля заново.", en: "Try requesting a password reset again." },
  "auth.passwordChanged": { ru: "Пароль изменён", en: "Password changed" },
  "auth.passwordChangedDesc": { ru: "Теперь можешь войти с новым паролем.", en: "You can now sign in with your new password." },

  // --- Профиль ---
  "profile.logout": { ru: "Выйти из аккаунта", en: "Sign out" },
  "profile.delete": { ru: "Удалить аккаунт", en: "Delete account" },
  "profile.deleteWarning": { ru: "Все данные будут удалены безвозвратно: закваски, кормления, рецепты.", en: "All data will be permanently deleted: starters, feedings, recipes." },
  "profile.confirmPassword": { ru: "Введите пароль для подтверждения", en: "Enter password to confirm" },
  "profile.deleting": { ru: "Удаляю...", en: "Deleting..." },
  "profile.confirmDelete": { ru: "Да, удалить всё", en: "Yes, delete everything" },
  "profile.enterPassword": { ru: "Введите пароль", en: "Enter password" },

  // --- Dropdown ---
  "dropdown.flourType": { ru: "Тип муки", en: "Flour type" },
  "dropdown.select": { ru: "Выбрать...", en: "Select..." },
  "dropdown.other": { ru: "Другая...", en: "Other..." },

  // --- Настроения ---
  "mood.happy": { ru: "Довольна", en: "Happy" },
  "mood.hungry": { ru: "Голодная", en: "Hungry" },
  "mood.sleepy": { ru: "Спит", en: "Sleeping" },
  "mood.new": { ru: "Новая", en: "New" },
  "tracker.pause": { ru: "На паузу", en: "Pause" },
  "tracker.resume": { ru: "Возобновить", en: "Resume" },
  "tracker.paused": { ru: "На паузе", en: "Paused" },
  "tracker.pausedSince": { ru: "с", en: "since" },
  "mood.label.paused": { ru: "На паузе", en: "Paused" },
  "mood.msg.paused": { ru: "В холодильнике, отдыхаю...", en: "In the fridge, resting..." },
  "mood.label.new": { ru: "Новенькая", en: "Brand new" },
  "mood.msg.new": { ru: "Покорми меня в первый раз!", en: "Feed me for the first time!" },
  "mood.label.fed": { ru: "Покормлена", en: "Just fed" },
  "mood.msg.fed": { ru: "Только покормили, работаю!", en: "Just fed, working!" },
  "mood.label.ready": { ru: "Готова!", en: "Ready!" },
  "mood.msg.ready": { ru: "Можно использовать в тесто!", en: "Ready to use in dough!" },
  "mood.label.peak": { ru: "На пике!", en: "At peak!" },
  "mood.msg.peak": { ru: "Я на максимуме! Используй меня!", en: "I'm at my peak! Use me!" },
  "mood.label.falling": { ru: "Опадает", en: "Falling" },
  "mood.msg.falling": { ru: "Прошла пик... покорми меня!", en: "Past peak... feed me!" },
  "mood.label.happy": { ru: "Счастливая", en: "Happy" },
  "mood.msg.happy": { ru: "Я сытая и пузырюсь!", en: "I'm full and bubbly!" },
  "mood.label.hungry": { ru: "Голодная", en: "Hungry" },
  "mood.msg.hungry": { ru: "Пора бы подкрепиться...", en: "Time for a feed..." },
};

/* ========== Переводы встроенных рецептов ========== */

interface RecipeTranslation {
  title: string;
  description: string;
  ingredients: { name: string; amount: string; unit: string }[];
  steps: string[];
}

const builtInRecipeTranslations: Record<string, RecipeTranslation> = {
  "Классический белый на закваске": {
    title: "Classic White Sourdough",
    description: "Simple white bread with a crispy crust and soft crumb",
    ingredients: [
      { name: "Bread flour", amount: "500", unit: "g" },
      { name: "Water", amount: "350", unit: "g" },
      { name: "Starter", amount: "100", unit: "g" },
      { name: "Salt", amount: "10", unit: "g" },
    ],
    steps: [
      "Mix flour and water, rest for 30 min (autolyse)",
      "Add starter and salt, knead the dough",
      "Stretch and fold every 30 min, 3-4 times",
      "Bulk fermentation 4-6 hours at room temperature",
      "Shape and proof in the fridge for 8-12 hours",
      "Bake in preheated oven at 250°C with steam for 20 min",
      "Reduce to 220°C, bake for another 20-25 min",
    ],
  },
  "Ржаной хлеб": {
    title: "Rye Bread",
    description: "Dark rye bread with a rich flavor",
    ingredients: [
      { name: "Rye flour", amount: "500", unit: "g" },
      { name: "Water", amount: "375", unit: "g" },
      { name: "Starter", amount: "150", unit: "g" },
      { name: "Salt", amount: "10", unit: "g" },
    ],
    steps: [
      "Mix rye flour, water and starter",
      "Add salt, mix well",
      "Bulk fermentation for 3-4 hours",
      "Transfer to a loaf pan, smooth with wet hands",
      "Proof for 1-2 hours until doubled in size",
      "Bake at 230°C for 10 min, then 200°C for 40-50 min",
    ],
  },
  "Чиабатта": {
    title: "Ciabatta",
    description: "Italian bread with large holes and a crispy crust",
    ingredients: [
      { name: "Bread flour", amount: "500", unit: "g" },
      { name: "Water", amount: "400", unit: "g" },
      { name: "Starter", amount: "100", unit: "g" },
      { name: "Salt", amount: "10", unit: "g" },
    ],
    steps: [
      "Mix flour, water and starter (dough will be very wet)",
      "Add salt after 30 min",
      "Stretch and fold every 30 min, 4-5 times",
      "Bulk fermentation 5-7 hours until doubled",
      "Gently turn out onto flour, divide into 2 pieces",
      "Minimal proof for 30 min",
      "Bake at 250°C with steam for 20-25 min",
    ],
  },
  "Цельнозерновой хлеб": {
    title: "Whole Wheat Bread",
    description: "Healthy bread made with whole grain flour",
    ingredients: [
      { name: "Whole wheat flour", amount: "500", unit: "g" },
      { name: "Water", amount: "375", unit: "g" },
      { name: "Starter", amount: "125", unit: "g" },
      { name: "Salt", amount: "10", unit: "g" },
    ],
    steps: [
      "Mix flour and water, autolyse for 1 hour",
      "Add starter and salt, knead",
      "Stretch and fold every 30 min, 3 times",
      "Bulk fermentation for 4-5 hours",
      "Shape, proof in the fridge for 8-10 hours",
      "Bake at 240°C with steam for 20 min",
      "Reduce to 210°C, bake for another 25-30 min",
    ],
  },
};

const flourTranslations: Record<string, string> = {
  "Пшеничная": "Wheat",
  "Ржаная": "Rye",
  "Цельнозерновая": "Whole Wheat",
};

export function translateBuiltInRecipe(
  recipe: { title: string; flour?: string; description?: string | null; ingredients?: string | null; steps: string },
  lang: Lang
): { title: string; flour?: string; description: string | null; ingredients: string | null; steps: string } {
  if (lang === "ru") return { title: recipe.title, flour: recipe.flour, description: recipe.description ?? null, ingredients: recipe.ingredients ?? null, steps: recipe.steps };
  const tr = builtInRecipeTranslations[recipe.title];
  const flour = recipe.flour ? (flourTranslations[recipe.flour] || recipe.flour) : recipe.flour;
  if (!tr) return { title: recipe.title, flour, description: recipe.description ?? null, ingredients: recipe.ingredients ?? null, steps: recipe.steps };
  return {
    title: tr.title,
    flour,
    description: tr.description,
    ingredients: JSON.stringify(tr.ingredients),
    steps: JSON.stringify(tr.steps),
  };
}
