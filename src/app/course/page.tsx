"use client";

import { useState, useEffect } from "react";

const DAYS = [
  { num: 1, title: "Знакомство", ready: true },
  { num: 2, title: "Наблюдаем", ready: true },
  { num: 3, title: "Продолжаем", ready: false },
  { num: 4, title: "На что смотреть", ready: false },
  { num: 5, title: "Закваска оживает", ready: false },
  { num: 6, title: "Проверяем готовность", ready: false },
  { num: 7, title: "Что дальше", ready: false },
];

const DAY_COMPONENTS: Record<number, () => React.ReactNode> = {
  1: () => <Day1 />,
  2: () => <Day2 />,
};

export default function CoursePage() {
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const day = Math.min(Math.max(Number(params.get("day")) || 1, 1), 7);
    setCurrentDay(day);
  }, []);

  function goToDay(day: number) {
    setCurrentDay(day);
    window.history.replaceState(null, "", `/course?day=${day}`);
    window.scrollTo(0, 0);
  }

  const DayContent = DAY_COMPONENTS[currentDay];

  return (
    <div className="min-h-screen bg-cream">
      {/* Шапка */}
      <header className="pt-8 pb-6 px-4 text-center max-w-2xl mx-auto">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <a href="/login" className="text-sm text-brown-light hover:text-terracotta transition-colors">Levain Lab</a>
          <a
            href="/course/en"
            className="text-sm font-bold text-brown-light hover:text-terracotta transition-colors"
          >
            EN
          </a>
        </div>
        <h1 className="text-3xl font-extrabold text-brown-dark mt-3 leading-tight">
          Первая закваска
          <br />
          <span className="text-terracotta">за 7 дней</span>
        </h1>
        <p className="text-brown-light mt-2 text-sm max-w-md mx-auto">
          Бесплатный мини-курс для начинающих. Один урок в день — и через
          неделю у тебя будет своя живая закваска.
        </p>
      </header>

      {/* Прогресс-бар по дням */}
      <nav className="px-4 pb-6 max-w-2xl mx-auto">
        <div className="flex gap-1.5 justify-center flex-wrap">
          {DAYS.map((day) =>
            day.ready ? (
              <button
                key={day.num}
                onClick={() => goToDay(day.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  day.num === currentDay
                    ? "bg-terracotta text-white ring-2 ring-terracotta/30 ring-offset-2"
                    : "bg-terracotta/70 text-white hover:bg-terracotta"
                }`}
              >
                <span>{day.num}</span>
                <span className="hidden sm:inline">· {day.title}</span>
              </button>
            ) : (
              <div
                key={day.num}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-warm-beige/60 text-brown-light"
              >
                <span>{day.num}</span>
                <span className="hidden sm:inline">· {day.title}</span>
              </div>
            )
          )}
        </div>
      </nav>

      {/* Контент выбранного дня */}
      <main className="px-4 pb-16 max-w-2xl mx-auto">
        {DayContent ? (
          <article className="course-content bg-card rounded-2xl card-shadow p-5 sm:p-8">
            <DayContent />
          </article>
        ) : (
          <div className="text-center py-12">
            <div className="px-5 py-3 rounded-xl bg-warm-beige/40 text-brown-light text-sm">
              День {currentDay} будет доступен скоро
            </div>
          </div>
        )}

        {/* Навигация вперёд/назад */}
        <div className="flex justify-center gap-3 mt-8">
          {currentDay > 1 && (
            <button
              onClick={() => goToDay(currentDay - 1)}
              className="px-5 py-3 rounded-xl bg-warm-beige/60 text-brown text-sm font-bold hover:bg-warm-beige transition-colors"
            >
              ← День {currentDay - 1}
            </button>
          )}
          {currentDay < 7 && DAYS[currentDay]?.ready ? (
            <button
              onClick={() => goToDay(currentDay + 1)}
              className="px-5 py-3 rounded-xl bg-terracotta text-white text-sm font-bold hover:bg-terracotta-light transition-colors"
            >
              День {currentDay + 1} →
            </button>
          ) : currentDay < 7 ? (
            <div className="px-5 py-3 rounded-xl bg-warm-beige/40 text-brown-light text-sm">
              День {currentDay + 1} будет доступен скоро
            </div>
          ) : null}
        </div>
      </main>

      {/* Подвал */}
      <footer className="text-center pb-8 px-4">
        <p className="text-xs text-brown-light/60">
          Levain Lab · Мини-курс «Первая закваска за 7 дней»
        </p>
      </footer>
    </div>
  );
}

/* ========== UI-компоненты ========== */

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`mb-8 last:mb-0 ${className}`}>{children}</section>;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-extrabold text-brown-dark mb-3">{children}</h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-brown mb-2">{children}</h3>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-golden/10 border-l-3 border-golden rounded-r-lg p-3 my-4 text-sm text-brown">
      {children}
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer group">
      <input
        type="checkbox"
        className="mt-0.5 w-5 h-5 rounded border-2 border-warm-beige accent-terracotta flex-shrink-0"
      />
      <span className="text-sm text-brown group-has-checked:line-through group-has-checked:text-brown-light transition-colors">
        {children}
      </span>
    </label>
  );
}

function Details({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group my-4">
      <summary className="cursor-pointer text-sm font-bold text-terracotta hover:text-terracotta-light transition-colors list-none flex items-center gap-1.5">
        <span className="text-xs transition-transform group-open:rotate-90">▶</span>
        {title}
      </summary>
      <div className="mt-3 pl-4 border-l-2 border-warm-beige text-sm text-brown leading-relaxed">
        {children}
      </div>
    </details>
  );
}

function PhotoGallery({ images, priority = false }: { images: { src: string; alt: string }[]; priority?: boolean }) {
  return (
    <div className={`my-4 grid gap-2 ${images.length === 1 ? '' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {images.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          className="rounded-xl w-full h-auto object-cover aspect-square"
          loading={priority ? "eager" : "lazy"}
          {...(priority ? { fetchPriority: "high" as const } : {})}
          width={400}
          height={400}
          decoding={priority ? "sync" : "async"}
        />
      ))}
    </div>
  );
}

/* ========== Контент Дня 1 ========== */

function Day1() {
  return (
    <>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">ДЕНЬ 1</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Знакомство: что мы будем делать и зачем
        </h2>
      </div>

      {/* Крючок — результат */}
      <Section>
        <PhotoGallery priority images={[
          { src: "/course/IMG_2232.webp", alt: "Хлеб на закваске с сыром" },
          { src: "/course/EFBD9C7D-66B7-4D2B-8D3D-059F0F23B6E3.webp", alt: "Буль на закваске" },
          { src: "/course/IMG_4807.webp", alt: "Разрез хлеба на закваске" },
        ]} />
        <p className="text-brown text-sm leading-relaxed">
          Через 5-7 дней у тебя будет своя закваска — живой организм, который
          может жить годами и давать невероятный хлеб. Всё, что нужно — мука,
          вода и немного терпения.
        </p>
        <p className="text-brown text-sm leading-relaxed mt-3">
          Каждый день — один короткий урок и одно простое действие. Сегодня
          подготовим всё необходимое и сделаем первый замес.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что понадобится — сразу к делу */}
      <Section>
        <H2>Что понадобится</H2>

        <H3>Мука</H3>
        <p className="text-brown text-sm leading-relaxed mb-2">
          Для старта лучше <strong>ржаная и пшеничная цельнозерновая</strong>{" "}
          (или обойная ржаная) мука. Почему именно она:
        </p>
        <ul className="space-y-1 mb-3 text-sm text-brown list-disc pl-5">
          <li>
            В цельнозерновой муке сохранены оболочка и зародыш зерна — именно
            там живут ферменты, которые расщепляют крахмал в еду для
            бактерий.
          </li>
          <li>
            Ржаная мука содержит больше «еды» для микроорганизмов — она
            запускает ферментацию быстрее и прощает ошибки.
          </li>
        </ul>

        <H3>Вода</H3>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Обычная вода из-под крана или фильтрованная. Температура — комнатная,
          21-25°C.
        </p>

        <H3>Банка</H3>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Сосуд объёмом с пластиковый стаканчик, желательно ровные стенки и
          наличие предмета, которым можно прикрыть горлышко.
        </p>

        <H3>Крышка</H3>
        <p className="text-brown text-sm leading-relaxed">
          Накрыть, но <strong>не закручивать</strong>! В процессе брожения
          выделяется газ, ему нужно куда-то выходить. Можно положить крышку
          сверху не закручивая, накрыть блюдцем или плотной тканью с резинкой.
        </p>

        <PhotoGallery images={[
          { src: "/course/IMG_4774.webp", alt: "Закваска в банке — пузыри и подъём" },
          { src: "/course/IMG_1778.webp", alt: "Закваска в стеклянной баночке" },
        ]} />
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Где поставить */}
      <Section>
        <H2>Где поставить банку</H2>
        <ul className="space-y-2 text-sm text-brown">
          <li>
            <strong>Температура 21-26°C</strong> — тёплое место на кухне.
          </li>
          <li>
            <strong>Не у батареи</strong> — нагрев с одной стороны создаёт
            неравномерную среду.
          </li>
          <li>
            <strong>Не на подоконнике</strong> — перепады температуры днём/ночью
            замедляют процесс.
          </li>
          <li>
            <strong>Не под прямыми лучами</strong> — может начать подсыхать,
            может перегреться.
          </li>
        </ul>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Первый замес */}
      <Section>
        <H2>Делаем первый замес</H2>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Два варианта — выбирай, какой ближе:
        </p>

        {/* Интуитивный */}
        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>
            Вариант 1: интуитивный (без весов) — рекомендую!
          </H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Налей в банку воду — примерно рюмку (30-50 мл)</li>
            <li>Добавь столовую ложку ржаной цельнозерновой муки</li>
            <li>
              Досыпь пшеничную муку, помешивая, до консистенции{" "}
              <strong>густого теста на оладьи</strong> — прям густого, ложка
              стоит, но масса ещё пластичная
            </li>
            <li>Хорошо перемешай, чтобы не было комочков</li>
            <li>Накрой (не закручивай!) и поставь в тёплое место</li>
          </ol>
          <PhotoGallery images={[
            { src: "/course/IMG_4686.webp", alt: "Хлеб на закваске — результат" },
            { src: "/course/IMG_6618.webp", alt: "Буль на крафтовой бумаге" },
            { src: "/course/IMG_9006.webp", alt: "Зелёный хлеб в разрезе" },
          ]} />
          <Tip>
            Почему без весов? Так ты учишься чувствовать закваску — её
            консистенцию, запах, поведение. Это пригодится потом, когда будешь
            печь хлеб.
          </Tip>
        </div>

        {/* С весами */}
        <div className="bg-warm-beige/30 rounded-xl p-4">
          <H3>Вариант 2: с весами (точные пропорции)</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>
              На весах отмерь <strong>50 г воды</strong> комнатной температуры
            </li>
            <li>
              Добавь <strong>5 г ржаной цельнозерновой</strong> +{" "}
              <strong>45 г пшеничной</strong> 1 сорта (или 50 г чисто ржаной
              цельнозерновой)
            </li>
            <li>Перемешай до однородности</li>
            <li>Накрой и поставь в тёплое место</li>
          </ol>
          <p className="text-xs text-brown-light mt-3">
            Это закваска 100% влажности — соотношение муки и воды 1:1 по весу.
          </p>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что будет происходить */}
      <Section>
        <H2>Что будет происходить</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          В ближайшие 24-48 часов внутри банки начнётся настоящая борьба за
          территорию. На муке живут десятки видов микроорганизмов. Когда ты
          добавляешь воду, ферменты активируются и начинают расщеплять крахмал
          на сахара — и на эти сахара сбегаются все «жители».
        </p>
        <p className="text-brown text-sm leading-relaxed mb-3">
          На этом этапе может появиться странный запах. Это нормально — это
          временные «гости», которых потом вытеснят молочнокислые бактерии.
        </p>
        <div className="bg-terracotta/8 rounded-xl p-4 text-sm text-brown font-medium">
          <strong>Твоя задача на сегодня:</strong> замесить и забыть до завтра.
          Серьёзно — не надо открывать, мешать и проверять каждый час. Просто дай
          микроорганизмам время.
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Чек-лист */}
      <Section>
        <H2>Чек-лист дня</H2>
        <div className="space-y-1">
          <CheckItem>Купить ржаную и (или) пшеничную цельнозерновую муку</CheckItem>
          <CheckItem>Подготовить банку и крышку</CheckItem>
          <CheckItem>Сделать первый замес</CheckItem>
          <CheckItem>Поставить в тёплое место (21-26°C)</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Теория — сворачиваемые блоки */}
      <Section>
        <H2>Хочу знать больше</H2>
        <p className="text-brown-light text-xs mb-3">
          Необязательно для начала, но полезно для понимания процесса
        </p>

        <Details title="Что такое закваска с точки зрения науки">
          <p className="mb-3">
            Закваска — это мука и вода, в которых поселились два вида
            микроорганизмов:
          </p>
          <p className="mb-2">
            🔸 <strong>Дрожжи</strong> — поднимают тесто. Они едят простые
            сахара из муки и выделяют углекислый газ.
          </p>
          <p className="mb-3">
            🔸 <strong>Молочнокислые бактерии (МКБ)</strong> — отвечают за вкус
            и сохранность. Они производят молочную и уксусную кислоты — отсюда
            характерная кислинка и устойчивость к плесени.
          </p>
          <p>
            Эти два вида живут в симбиозе: бактерии создают кислую среду, которая
            убивает всё «плохое», а дрожжи делятся с бактериями витаминами и
            аминокислотами.
          </p>
        </Details>

        <Details title="Почему закваска лучше магазинных дрожжей">
          <p className="mb-3">
            Магазинные дрожжи — это один штамм (Saccharomyces cerevisiae),
            заточенный под скорость. А в закваске — целое сообщество. Что это
            даёт:
          </p>
          <p className="mb-2">
            <strong>Вкус и аромат.</strong> Бактерии и дрожжи вместе производят
            десятки ароматических соединений. При выпечке остаточные сахара
            участвуют в реакции Майяра — она даёт корочке золотистый цвет и тот
            самый «хлебный» запах.
          </p>
          <p className="mb-2">
            <strong>Хранение.</strong> Кислая среда — естественный консервант.
            Хлеб на закваске хранится в разы дольше без плесени.
          </p>
          <p>
            <strong>Усвоение.</strong> Длительное брожение расщепляет сложные
            соединения в муке. Белки легче усваиваются, высвобождаются витамины
            группы B, снижается гликемический индекс.
          </p>
        </Details>

        <Details title="Зачем нужна именно цельнозерновая мука">
          <p>
            В цельнозерновой муке сохранены оболочка и зародыш зерна — именно
            там живут ферменты (амилазы), которые расщепляют крахмал в еду для
            бактерий. В белой муке высшего сорта эти части удалены, поэтому
            ферментация стартует медленнее и менее стабильно.
          </p>
        </Details>
      </Section>

    </>
  );
}

/* ========== Контент Дня 2 ========== */

function Day2() {
  return (
    <>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">ДЕНЬ 2</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Наблюдаем
        </h2>
      </div>

      {/* Вступление */}
      <Section>
        <p className="text-brown text-sm leading-relaxed">
          Прошло 24ч. Сегодня главное — не паниковать.
        </p>
        <p className="text-brown text-sm leading-relaxed mt-3">
          Закваски ведут себя по-разному: одни уже бурлят через 24 часа, другие
          ещё молчат. Оба варианта — ок. Важно добавлять в кормления
          цельнозерновую муку, ведь в ней содержится больше ферментов (амилаз),
          расщепляющих крахмал на мальтозу — то, чем питаются дрожжи и
          большинство молочнокислых (некоторые МКБ сами вырабатывают ферменты для
          расщепления крахмала — амилопуллуланазы).
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что ты можешь увидеть */}
      <Section>
        <H2>Что ты можешь увидеть</H2>

        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>Есть пузырьки и подъём</H3>
            <p className="text-brown text-sm leading-relaxed">
              Отлично! Это значит, что микроорганизмы уже начали работать. Масса
              могла немного подняться, на поверхности или по стенкам видны мелкие
              пузырьки.
            </p>
          </div>

          <div className="bg-warm-beige/30 rounded-xl p-4">
            <H3>Ничего не происходит</H3>
            <p className="text-brown text-sm leading-relaxed">
              Тоже нормально. Некоторым закваскам нужно больше времени — до 48
              часов. Причины: чуть прохладнее на кухне, другая мука. Не трогай
              банку — просто подожди ещё сутки.
            </p>
          </div>
        </div>

        <Tip>
          Если через 48 часов всё ещё тишина — переставь банку в место потеплее
          (25-28°C), добавь немного цельнозерновой муки и подожди ещё день.
          Активность обязательно появится. Если нет — пиши, разберёмся!
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Про запах */}
      <Section>
        <H2>Про запах</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Открой банку и понюхай. Скорее всего, запах будет{" "}
          <strong>странным</strong> — непривычным, может быть неприятным. Это
          абсолютно нормально.
        </p>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Сейчас внутри банки идёт <strong>фаза хаоса</strong>: размножается всё
          подряд. Среда ещё нейтральная, и хорошие бактерии пока не набрали силу.
        </p>
        <p className="text-brown text-sm leading-relaxed">
          Через пару дней молочнокислые бактерии начнут вырабатывать кислоту,
          среда станет кислой — и все плохие соседи погибнут. Это естественный
          процесс.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что делать */}
      <Section>
        <H2>Что делать сегодня</H2>

        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>Если есть активность (пузырьки, подъём)</H3>

          <div className="bg-cream/50 rounded-lg p-3 mb-3">
            <p className="text-xs font-bold text-terracotta mb-2">БЕЗ ВЕСОВ (ИНТУИТИВНЫЙ)</p>
            <ol className="space-y-1.5 text-sm text-brown list-decimal pl-5">
              <li>Убери из банки примерно половину массы (НУЖНО выбросить)</li>
              <li>Добавь столовую ложку муки (ржаная + пшеничная, как вчера)</li>
              <li>Добавь воды до прежней консистенции — густое тесто на оладьи</li>
              <li>Перемешай и накрой</li>
            </ol>
          </div>

          <div className="bg-cream/50 rounded-lg p-3">
            <p className="text-xs font-bold text-brown-light mb-2">С ВЕСАМИ</p>
            <ol className="space-y-1.5 text-sm text-brown list-decimal pl-5">
              <li>Оставь в банке 20-25 г закваски, остальное убери</li>
              <li>Добавь 50 г воды комнатной температуры</li>
              <li>Добавь 50 г муки (можно 5 г ржаной цельнозерновой + 45 г пшеничной)</li>
              <li>Перемешай и накрой</li>
            </ol>
          </div>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Температура */}
      <Section>
        <H2>Напоминание: температура</H2>
        <ul className="space-y-2 text-sm text-brown">
          <li>
            <strong>24-26°C</strong> — мезофильные бактерии активно размножаются
            и дают мягкую молочную кислоту.
          </li>
          <li>
            <strong>При 20°C</strong> — процесс замедляется, фаза хаоса
            затягивается до 4-5 дней вместо двух.
          </li>
          <li>
            <strong>Выше 30°C</strong> — начинают доминировать другие бактерии,
            вырабатывающие больше уксусной кислоты. Закваска будет резче.
          </li>
        </ul>
        <Tip>
          Не ставь банку у батареи или на подоконнике. Нужна стабильная
          температура без скачков. Кухонный стол, полка шкафа — отличные варианты.
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Чек-лист */}
      <Section>
        <H2>Чек-лист дня</H2>
        <div className="space-y-1">
          <CheckItem>Открыть банку, посмотреть и понюхать</CheckItem>
          <CheckItem>Есть пузырьки — покормить (убрать половину + мука + вода)</CheckItem>
          <CheckItem>Нет активности — оставить ещё на сутки</CheckItem>
          <CheckItem>Проверить температуру в месте, где стоит банка</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Хочу знать больше */}
      <Section>
        <H2>Хочу знать больше</H2>
        <p className="text-brown-light text-xs mb-3">
          Для любопытных — что на самом деле происходит внутри банки
        </p>

        <Details title="Три фазы жизни закваски">
          <p className="mb-2">
            <strong>Фаза 1 (день 1-2): хаос.</strong> Размножается всё подряд.
            Среда ещё нейтральная (pH около 6). Именно поэтому запах может быть
            неприятным.
          </p>
          <p className="mb-2">
            <strong>Фаза 2 (день 3-5): набор кислотности.</strong> Молочнокислые
            бактерии начинают доминировать. Они выделяют кислоту, pH падает до
            4.5 — плохие бактерии не выживают.
          </p>
          <p>
            <strong>Фаза 3 (день 5-7): стабильное сообщество.</strong> Дрожжи и
            МКБ находят баланс.
          </p>
        </Details>

        <Details title="Почему дрожжи и бактерии не конкурируют">
          <p>
            Закваска — это сложная экосистема из множества видов дрожжей и
            молочнокислых бактерий, которые не конкурируют, так как бактерии
            предпочитают мальтозу, а дрожжи — глюкозу, часто выделяемую самими
            бактериями. Этот симбиоз укрепляется тем, что бактерии питаются
            аминокислотами дрожжей, а вырабатываемая ими кислота защищает всю
            микрофлору от опасных микробов.
          </p>
        </Details>

        <Details title="Почему температура так важна">
          <p className="mb-2">
            <strong>21-25°C:</strong> мягкая молочная кислота, деликатная кислинка.
          </p>
          <p className="mb-2">
            <strong>30-35°C:</strong> больше уксусной кислоты, хлеб будет резче и
            кислее.
          </p>
          <p>
            <strong>38-42°C:</strong> термофильные бактерии берут верх, дрожжи
            угнетены. Так делают КМКЗ — ржаную закваску с ярким ароматом алычи,
            но она не может поднять тесто. Если интересно про КМКЗ — пишите,
            расскажу подробнее.
          </p>
        </Details>
      </Section>
    </>
  );
}
