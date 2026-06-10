"use client";

import { useState, useEffect } from "react";

const DAYS = [
  { num: 1, title: "Getting Started", ready: true },
  { num: 2, title: "Observe", ready: true },
  { num: 3, title: "The Starter Wakes Up", ready: true },
  { num: 4, title: "What to Look For", ready: false },
  { num: 5, title: "It's Alive!", ready: false },
  { num: 6, title: "Ready Check", ready: false },
  { num: 7, title: "What's Next", ready: false },
];

const DAY_COMPONENTS: Record<number, () => React.ReactNode> = {
  1: () => <Day1En />,
  2: () => <Day2En />,
  3: () => <Day3En />,
};

export default function CoursePageEn() {
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const day = Math.min(Math.max(Number(params.get("day")) || 1, 1), 7);
    setCurrentDay(day);
  }, []);

  function goToDay(day: number) {
    setCurrentDay(day);
    window.history.replaceState(null, "", `/course/en?day=${day}`);
    window.scrollTo(0, 0);
  }

  const DayContent = DAY_COMPONENTS[currentDay];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="pt-8 pb-6 px-4 text-center max-w-2xl mx-auto">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <a href="/login" className="text-sm text-brown-light hover:text-terracotta transition-colors">Levain Lab</a>
          <a
            href={`/course?day=${currentDay}`}
            className="text-sm font-bold text-brown-light hover:text-terracotta transition-colors"
          >
            RU
          </a>
        </div>
        <h1 className="text-3xl font-extrabold text-brown-dark mt-3 leading-tight">
          Your First Starter
          <br />
          <span className="text-terracotta">in 7 Days</span>
        </h1>
        <p className="text-brown-light mt-2 text-sm max-w-md mx-auto">
          A free mini-course for beginners. One lesson a day — and in a week
          you'll have your own living sourdough starter.
        </p>
      </header>

      {/* Progress bar */}
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

      {/* Content */}
      <main className="px-4 pb-16 max-w-2xl mx-auto">
        {DayContent ? (
          <article className="course-content bg-card rounded-2xl card-shadow p-5 sm:p-8">
            <DayContent />
          </article>
        ) : (
          <div className="text-center py-12">
            <div className="px-5 py-3 rounded-xl bg-warm-beige/40 text-brown-light text-sm">
              Day {currentDay} coming soon
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center gap-3 mt-8">
          {currentDay > 1 && (
            <button
              onClick={() => goToDay(currentDay - 1)}
              className="px-5 py-3 rounded-xl bg-warm-beige/60 text-brown text-sm font-bold hover:bg-warm-beige transition-colors"
            >
              ← Day {currentDay - 1}
            </button>
          )}
          {currentDay < 7 && DAYS[currentDay]?.ready ? (
            <button
              onClick={() => goToDay(currentDay + 1)}
              className="px-5 py-3 rounded-xl bg-terracotta text-white text-sm font-bold hover:bg-terracotta-light transition-colors"
            >
              Day {currentDay + 1} →
            </button>
          ) : currentDay < 7 ? (
            <div className="px-5 py-3 rounded-xl bg-warm-beige/40 text-brown-light text-sm">
              Day {currentDay + 1} coming soon
            </div>
          ) : null}
        </div>
      </main>

      <footer className="text-center pb-8 px-4">
        <p className="text-xs text-brown-light/60">
          Levain Lab · Mini-course "Your First Starter in 7 Days"
        </p>
      </footer>
    </div>
  );
}

/* ========== UI Components ========== */

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

/* ========== Day 1 Content ========== */

function Day1En() {
  return (
    <>
      {/* Title */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">DAY 1</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Getting Started: What We're Doing and Why
        </h2>
      </div>

      {/* Hook — show the result */}
      <Section>
        <PhotoGallery priority images={[
          { src: "/course/IMG_2232.webp", alt: "Sourdough bread with cheese" },
          { src: "/course/EFBD9C7D-66B7-4D2B-8D3D-059F0F23B6E3.webp", alt: "Sourdough boule" },
          { src: "/course/IMG_4807.webp", alt: "Sourdough bread crumb" },
        ]} />
        <p className="text-brown text-sm leading-relaxed">
          In 5-7 days you'll have your own sourdough starter — a living organism
          that can last for years and produce incredible bread. All you need is
          flour, water, and a little patience.
        </p>
        <p className="text-brown text-sm leading-relaxed mt-3">
          Each day — one short lesson and one simple action. Today we'll prepare
          everything we need and make our first mix.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* What you'll need */}
      <Section>
        <H2>What You'll Need</H2>

        <H3>Flour</H3>
        <p className="text-brown text-sm leading-relaxed mb-2">
          For the best start, use{" "}
          <strong>whole grain rye and/or whole wheat</strong> flour:
        </p>
        <ul className="space-y-1 mb-3 text-sm text-brown list-disc pl-5">
          <li>
            Whole grain flour retains the bran and germ — that's where the
            enzymes live, which break down starch into food for bacteria.
          </li>
          <li>
            Rye flour contains more "food" for microorganisms — it kicks off
            fermentation faster and is more forgiving.
          </li>
        </ul>

        <H3>Water</H3>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Regular tap water or filtered water. Room temperature, 70-77°F
          (21-25°C).
        </p>

        <H3>Jar</H3>
        <p className="text-brown text-sm leading-relaxed mb-4">
          A container about the size of a plastic cup, preferably with straight
          walls and something to cover the opening.
        </p>

        <H3>Lid</H3>
        <p className="text-brown text-sm leading-relaxed">
          Cover it, but <strong>don't seal it tight</strong>! Fermentation
          produces gas that needs to escape. Place a lid loosely on top, cover
          with a saucer, or use a cloth secured with a rubber band.
        </p>

        <PhotoGallery images={[
          { src: "/course/IMG_4774.webp", alt: "Starter in a jar — bubbles and rise" },
          { src: "/course/IMG_1778.webp", alt: "Starter in a glass jar" },
        ]} />
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Where to place */}
      <Section>
        <H2>Where to Place the Jar</H2>
        <ul className="space-y-2 text-sm text-brown">
          <li>
            <strong>Temperature 70-79°F (21-26°C)</strong> — a warm spot in the
            kitchen.
          </li>
          <li>
            <strong>Not next to a heater</strong> — one-sided heating creates an
            uneven environment.
          </li>
          <li>
            <strong>Not on a windowsill</strong> — day/night temperature swings
            slow things down.
          </li>
          <li>
            <strong>Not in direct sunlight</strong> — it may dry out or
            overheat.
          </li>
        </ul>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* First mix */}
      <Section>
        <H2>Making the First Mix</H2>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Two methods — pick whichever feels right:
        </p>

        {/* Intuitive */}
        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>Method 1: Intuitive (no scale) — recommended!</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Pour water into your jar — roughly a shot glass (30-50 ml)</li>
            <li>Add a tablespoon of whole grain rye flour</li>
            <li>
              Gradually add wheat flour, stirring, until you reach the
              consistency of{" "}
              <strong>thick pancake batter</strong> — really thick, where a
              spoon stands up but the mass is still pliable
            </li>
            <li>Mix well to eliminate lumps</li>
            <li>Cover (don't seal!) and place in a warm spot</li>
          </ol>
          <PhotoGallery images={[
            { src: "/course/IMG_4686.webp", alt: "Sourdough bread result" },
            { src: "/course/IMG_6618.webp", alt: "Boule on parchment paper" },
            { src: "/course/IMG_9006.webp", alt: "Green bread cross-section" },
          ]} />
          <Tip>
            Why no scale? This way you learn to feel your starter — its
            consistency, smell, behavior. This will come in handy later when you
            bake bread.
          </Tip>
        </div>

        {/* With scale */}
        <div className="bg-warm-beige/30 rounded-xl p-4">
          <H3>Method 2: With a Scale (exact proportions)</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>
              Weigh out <strong>50 g of water</strong> at room temperature
            </li>
            <li>
              Add <strong>5 g whole grain rye</strong> +{" "}
              <strong>45 g wheat flour</strong> (or 50 g of pure whole grain
              rye)
            </li>
            <li>Mix until smooth</li>
            <li>Cover and place in a warm spot</li>
          </ol>
          <p className="text-xs text-brown-light mt-3">
            This is a 100% hydration starter — equal parts flour and water by
            weight.
          </p>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* What will happen */}
      <Section>
        <H2>What Will Happen</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Over the next 24-48 hours, a real battle for territory will begin
          inside the jar. Flour hosts dozens of microorganism species. When you
          add water, enzymes activate and start breaking down starch into
          sugars — and all the "residents" rush to those sugars.
        </p>
        <p className="text-brown text-sm leading-relaxed mb-3">
          At this stage, a strange smell may appear. That's normal — these are
          temporary "guests" that will later be displaced by lactic acid
          bacteria.
        </p>
        <div className="bg-terracotta/8 rounded-xl p-4 text-sm text-brown font-medium">
          <strong>Your task for today:</strong> mix it and forget about it until
          tomorrow. Seriously — no need to open, stir, or check every hour. Just
          give the microorganisms time.
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Checklist */}
      <Section>
        <H2>Today's Checklist</H2>
        <div className="space-y-1">
          <CheckItem>Buy whole grain rye and/or whole wheat flour</CheckItem>
          <CheckItem>Prepare a jar and lid</CheckItem>
          <CheckItem>Make the first mix</CheckItem>
          <CheckItem>Place in a warm spot (70-79°F / 21-26°C)</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Learn more — collapsible */}
      <Section>
        <H2>Want to Know More?</H2>
        <p className="text-brown-light text-xs mb-3">
          Not required to get started, but helpful for understanding the process
        </p>

        <Details title="What is a starter from a scientific perspective">
          <p className="mb-3">
            A starter is flour and water inhabited by two types of
            microorganisms:
          </p>
          <p className="mb-2">
            🔸 <strong>Yeast</strong> — makes the dough rise by feeding on
            simple sugars and producing carbon dioxide.
          </p>
          <p className="mb-3">
            🔸 <strong>Lactic acid bacteria (LAB)</strong> — responsible for
            flavor and preservation. They produce lactic and acetic acids,
            creating the signature tanginess and mold resistance.
          </p>
          <p>
            These two live in symbiosis: bacteria create an acidic environment
            that kills harmful organisms, while yeast shares vitamins and amino
            acids with the bacteria.
          </p>
        </Details>

        <Details title="Why sourdough beats commercial yeast">
          <p className="mb-3">
            Commercial yeast is a single strain (Saccharomyces cerevisiae) bred
            for speed. A sourdough starter hosts an entire community. What does
            that give you:
          </p>
          <p className="mb-2">
            <strong>Flavor and aroma.</strong> Bacteria and yeast together
            produce dozens of aromatic compounds. During baking, residual sugars
            participate in the Maillard reaction — that's what gives the crust
            its golden color and the classic bread smell.
          </p>
          <p className="mb-2">
            <strong>Shelf life.</strong> The acidic environment is a natural
            preservative. Sourdough bread lasts much longer without mold.
          </p>
          <p>
            <strong>Digestibility.</strong> Long fermentation breaks down complex
            compounds. Proteins become easier to digest, B vitamins are released,
            and the glycemic index drops.
          </p>
        </Details>

        <Details title="Why whole grain flour specifically">
          <p>
            Whole grain flour retains the bran and germ — that's where the
            enzymes (amylases) live. These enzymes break down starch into food
            for bacteria. White refined flour has most of these parts removed,
            so fermentation starts slower and is less stable.
          </p>
        </Details>
      </Section>

    </>
  );
}

/* ========== Day 2 Content ========== */

function Day2En() {
  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">DAY 2</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Observe
        </h2>
      </div>

      <Section>
        <p className="text-brown text-sm leading-relaxed">
          It's been 24 hours. Today the main thing is — don't panic.
        </p>
        <p className="text-brown text-sm leading-relaxed mt-3">
          Starters behave differently: some are already bubbling after 24 hours,
          others are still quiet. Both are fine. It's important to add whole
          grain flour to your feedings — it contains more enzymes (amylases)
          that break down starch into maltose, which is what yeast and most
          lactic acid bacteria feed on (some LAB even produce their own
          starch-degrading enzymes — amylopullulanases).
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>What You Might See</H2>

        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>Bubbles and rise</H3>
            <p className="text-brown text-sm leading-relaxed">
              Great! Microorganisms have started working. The mass may have risen
              slightly, with small bubbles visible on the surface or along the
              walls.
            </p>
          </div>

          <div className="bg-warm-beige/30 rounded-xl p-4">
            <H3>Nothing happening</H3>
            <p className="text-brown text-sm leading-relaxed">
              Also normal. Some starters need more time — up to 48 hours.
              Reasons: slightly cooler kitchen, different flour. Don't touch
              the jar — just wait another day.
            </p>
          </div>
        </div>

        <Tip>
          If after 48 hours it's still quiet — move the jar somewhere warmer
          (77-82°F / 25-28°C), add a bit more whole grain flour and wait another
          day. Activity will come. If not — write to us, we'll figure it out!
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>About the Smell</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Open the jar and smell it. Most likely, the smell will be{" "}
          <strong>strange</strong> — unusual, maybe unpleasant. This is
          completely normal.
        </p>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Right now, a <strong>chaos phase</strong> is happening inside the jar:
          everything is multiplying. The environment is still neutral, and the
          good bacteria haven't gained strength yet.
        </p>
        <p className="text-brown text-sm leading-relaxed">
          In a couple of days, lactic acid bacteria will start producing acid,
          the environment will become acidic — and all the bad neighbors will
          die off. This is a natural process.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>What to Do Today</H2>

        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>If there's activity (bubbles, rise)</H3>

          <div className="bg-cream/50 rounded-lg p-3 mb-3">
            <p className="text-xs font-bold text-terracotta mb-2">INTUITIVE (NO SCALE)</p>
            <ol className="space-y-1.5 text-sm text-brown list-decimal pl-5">
              <li>Remove roughly half the mass from the jar (MUST discard it)</li>
              <li>Add a tablespoon of flour (rye + wheat, like yesterday)</li>
              <li>Add water to the previous consistency — thick pancake batter</li>
              <li>Mix and cover</li>
            </ol>
          </div>

          <div className="bg-cream/50 rounded-lg p-3">
            <p className="text-xs font-bold text-brown-light mb-2">WITH A SCALE</p>
            <ol className="space-y-1.5 text-sm text-brown list-decimal pl-5">
              <li>Keep 20-25 g of starter in the jar, remove the rest</li>
              <li>Add 50 g of water at room temperature</li>
              <li>Add 50 g of flour (5 g whole grain rye + 45 g wheat)</li>
              <li>Mix and cover</li>
            </ol>
          </div>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>Temperature Reminder</H2>
        <ul className="space-y-2 text-sm text-brown">
          <li>
            <strong>75-79°F (24-26°C)</strong> — mesophilic bacteria actively
            multiply and produce mild lactic acid.
          </li>
          <li>
            <strong>At 68°F (20°C)</strong> — the process slows down, the chaos
            phase stretches to 4-5 days instead of two.
          </li>
          <li>
            <strong>Above 86°F (30°C)</strong> — other bacteria start to
            dominate, producing more acetic acid. The starter will be sharper.
          </li>
        </ul>
        <Tip>
          Don't place the jar near a heater or on a windowsill. You need stable
          temperature without swings. Kitchen counter, shelf — great options.
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>Today's Checklist</H2>
        <div className="space-y-1">
          <CheckItem>Open the jar, look and smell</CheckItem>
          <CheckItem>See bubbles — feed it (remove half + flour + water)</CheckItem>
          <CheckItem>No activity — leave for another day</CheckItem>
          <CheckItem>Check the temperature where the jar sits</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>Want to Know More?</H2>
        <p className="text-brown-light text-xs mb-3">
          For the curious — what's actually happening inside the jar
        </p>

        <Details title="Three phases of starter life">
          <p className="mb-2">
            <strong>Phase 1 (day 1-2): chaos.</strong> Everything multiplies.
            The environment is still neutral (pH ~6). That's why the smell can
            be unpleasant.
          </p>
          <p className="mb-2">
            <strong>Phase 2 (day 3-5): acidity buildup.</strong> Lactic acid
            bacteria start to dominate. They produce acid, pH drops to 4.5 —
            bad bacteria can't survive.
          </p>
          <p>
            <strong>Phase 3 (day 5-7): stable community.</strong> Yeast and LAB
            find balance.
          </p>
        </Details>

        <Details title="Why yeast and bacteria don't compete">
          <p>
            A starter is a complex ecosystem of many species of yeast and lactic
            acid bacteria that don't compete because bacteria prefer maltose
            while yeast prefers glucose — often released by the bacteria
            themselves. This symbiosis is strengthened by bacteria feeding on
            amino acids from yeast, while the acid they produce protects the
            entire microflora from dangerous microbes.
          </p>
        </Details>

        <Details title="Why temperature matters so much">
          <p className="mb-2">
            <strong>70-77°F (21-25°C):</strong> mild lactic acid, delicate
            tanginess.
          </p>
          <p className="mb-2">
            <strong>86-95°F (30-35°C):</strong> more acetic acid, bread will be
            sharper and more sour.
          </p>
          <p>
            <strong>100-108°F (38-42°C):</strong> thermophilic bacteria take
            over, yeast is suppressed. This is how CLCS (concentrated lactic
            culture starter) is made — a rye starter with a bright plum-like
            aroma, but it can't raise dough. Interested in CLCS? Write to us,
            we'll tell you more.
          </p>
        </Details>
      </Section>
    </>
  );
}

/* ========== Day 3 Content ========== */

function Day3En() {
  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">DAY 3</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          The Starter Wakes Up
        </h2>
      </div>

      <Section>
        <p className="text-brown text-sm leading-relaxed">
          Another 24 hours have passed. Today your starter should be showing
          activity — more bubbles, a noticeable rise, and a sharper smell.
        </p>
        <PhotoGallery priority images={[
          { src: "/course/day-3-1.webp", alt: "Active starter on day 3 — bubbles and rise" },
        ]} />
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>What You Might See</H2>

        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>Good activity (this is how it should be)</H3>
            <p className="text-brown text-sm leading-relaxed">
              Bubbles are visible — small ones throughout and larger ones on the
              surface. Over the last 24 hours the starter has grown roughly{" "}
              <strong>1.5–2x</strong> in volume. That's a great sign: yeast and
              lactic acid bacteria are working hard, feeding on maltose from the
              flour and releasing gas.
            </p>
            <p className="text-brown text-sm leading-relaxed mt-2">
              The starter may have already fallen by the time you look — also
              normal. It managed to eat all its food and settle back down,
              getting hungry. There's no need to mark the rise with a rubber band
              at this point.
            </p>
          </div>

          <div className="bg-warm-beige/30 rounded-xl p-4">
            <H3>Some activity, but weak</H3>
            <p className="text-brown text-sm leading-relaxed">
              Few bubbles, a small rise. Also normal — starters develop at
              different speeds, a lot depends on the flour and temperature. Just
              keep feeding, activity will build over the next few days.
            </p>
          </div>

          <div className="bg-cream/60 rounded-xl p-4 border border-warm-beige">
            <H3>No signs at all</H3>
            <p className="text-brown text-sm leading-relaxed mb-2">
              If there are no bubbles, no smell, no movement at all — it's almost
              always the temperature; it's too cool. Do the same as in Day 2:
            </p>
            <ol className="space-y-1.5 text-sm text-brown list-decimal pl-5">
              <li>
                Move the jar somewhere <strong>warmer, 77-82°F (25-28°C)</strong>
              </li>
              <li>
                Add a bit of <strong>whole grain (rye) flour</strong> — it has
                more enzymes and wild microorganisms, it speeds things up
              </li>
              <li>
                You can make the starter <strong>a bit thinner</strong> — yeast
                develops faster in a more liquid environment
              </li>
              <li>Wait another day</li>
            </ol>
            <p className="text-brown text-sm leading-relaxed mt-2">
              Activity will definitely come. If it's still completely quiet after
              another day — write to us, we'll figure it out together.
            </p>
          </div>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>About the Smell</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Open the jar and smell it. Today the smell has become{" "}
          <strong>stronger and sharper</strong>. This is completely normal.
        </p>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Here's why: lactic acid bacteria are{" "}
          <strong>actively producing acid</strong> — but the environment hasn't
          fully acidified yet. The acidity hasn't reached the level (roughly{" "}
          <strong>pH 4.5 and below</strong>) at which the "bad" bacteria die off.
          So they're still here — and they're what gives off that unpleasant
          smell.
        </p>
        <p className="text-brown text-sm leading-relaxed">
          Over the next 1–2 days more acid will build up, the pH will drop below
          ~4.5 toward 3.5–4.0 — the unwanted microbes will die off, while yeast
          and lactic acid bacteria, on the contrary, thrive in acidity. That's
          when the smell will turn pleasant — like yogurt, sometimes with fruity
          notes. Today's sharpness is a normal stage along the way.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>What to Do Today: Second Feeding</H2>
        <p className="text-brown text-sm leading-relaxed mb-4">
          We feed the same way as yesterday.
        </p>

        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>Without a scale (intuitive)</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Remove roughly half the mass from the jar (discard it)</li>
            <li>Add a tablespoon of flour (rye + wheat, as before)</li>
            <li>Add water to the previous consistency — thick pancake batter</li>
            <li>Mix and cover (don't screw the lid tight!)</li>
          </ol>
        </div>

        <div className="bg-warm-beige/30 rounded-xl p-4">
          <H3>With a scale</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Keep 20-25 g of starter in the jar, remove the rest</li>
            <li>Add 50 g of water at room temperature</li>
            <li>Add 50 g of flour (5 g whole grain rye + 45 g wheat)</li>
            <li>Mix and cover</li>
          </ol>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>Temperature Reminder</H2>
        <ul className="space-y-2 text-sm text-brown">
          <li>
            <strong>75-79°F (24-26°C)</strong> — mesophilic bacteria actively
            multiply and produce mild lactic acid.
          </li>
          <li>
            <strong>At 68°F (20°C)</strong> — the process slows down, everything
            stretches out by extra days.
          </li>
          <li>
            <strong>Above 86°F (30°C)</strong> — other bacteria start to
            dominate, producing more acetic acid; the starter will be sharper and
            more sour.
          </li>
        </ul>
        <Tip>
          Don't place the jar near a heater or on a windowsill. You need stable
          temperature without swings. Kitchen counter, a shelf — great options.
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>Today's Checklist</H2>
        <div className="space-y-1">
          <CheckItem>Open the jar, look and smell</CheckItem>
          <CheckItem>Assess the rise over 24 hours (ideally 1.5–2x) and the bubbles</CheckItem>
          <CheckItem>Feed it: remove half + flour + water</CheckItem>
          <CheckItem>No signs — warmer (77-82°F / 25-28°C) + whole grain flour + a bit thinner, wait a day</CheckItem>
          <CheckItem>Check the temperature where the jar sits</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <H2>Want to Know More?</H2>
        <p className="text-brown-light text-xs mb-3">
          For the curious — what's actually happening inside the jar
        </p>

        <Details title="How acidity is measured">
          <p>
            The acidity of a starter and dough is described by two independent
            parameters: active acidity (pH) and titratable acidity (TTA /
            degrees). They show fundamentally different things: pH shows the
            "strength" (the concentration of free hydrogen ions right now), while
            TTA shows the "quantity" (the total reserve of accumulated acids).
            More on enzyme activity, dough stickiness, and measuring acidity — on
            our channel{" "}
            <a
              href="https://t.me/levainlab"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta font-bold hover:underline"
            >
              @levainlab
            </a>
            .
          </p>
        </Details>

        <Details title="Why the smell is sharp right now">
          <p>
            In the first days the environment was almost neutral, and the smell
            came from random "temporary residents." Now the acidity-buildup phase
            is underway: lactic acid bacteria (especially heterofermentative
            ones) produce not only lactic but also acetic acid, alcohol, and
            carbon dioxide. Hence the sour-vinegary and alcoholic notes. But
            there isn't enough acid yet to clear out the "extra" neighbors — so
            the smell is still mixed and unpleasant. Once the acidity grows to the
            right level (see below) and the unwanted microbes die off, the smell
            will turn pleasant.
          </p>
        </Details>

        <Details title="Why “bad” bacteria die at exactly this acidity">
          <p className="mb-3">
            Lactic acid bacteria produce lactic and acetic acids, and the pH of
            the environment drops from nearly neutral (~6) to 3.8–4.0. For most
            pathogenic and spoilage bacteria this is lethal: they can grow down
            to about pH 4.0–5.0, but no lower. The conventional safety line in
            food science is <strong>pH 4.6</strong>: below it, even{" "}
            <em>Clostridium botulinum</em> — the most dangerous foodborne microbe,
            which produces botulinum toxin — won't grow. That's why foods below
            pH 4.6 are considered "high-acid" and safe.
          </p>
          <p className="mb-3">
            But it's not just the pH number. The main weapon is{" "}
            <strong>the acids themselves in their undissociated (whole) form</strong>.
            Such a molecule is fat-soluble and easily passes through the
            bacterium's membrane to the inside. And inside the cell the
            environment is neutral — there the acid breaks apart and releases a
            hydrogen ion (H⁺), acidifying the bacterium's insides. The cell is
            forced to spend all its energy pumping these ions out, its enzymes
            stall — and it stops growing and dies. The lower the surrounding pH,
            the more acid there is in this "penetrating" form — which is why
            acidification works like a mounting press.
          </p>
          <p>
            Yeast and lactic acid bacteria, meanwhile, are adapted to acidity
            (they create it themselves) — so they thrive in this environment
            while competitors die out. This is how the starter "sanitizes"
            itself.
          </p>
        </Details>

        <Details title="Why remove half before each feeding">
          <p>
            So you don't accumulate a huge amount of starter — the larger its
            volume, the more food it needs. For raising a starter, it's enough to
            keep the volume at 70–100 g.
          </p>
        </Details>
      </Section>

      <Section>
        <p className="text-brown-light text-xs italic text-center">
          Tomorrow — a third feeding, and we watch the starter gain strength.
          Later we'll connect the tracker app to keep a feeding history and never
          forget a feeding.
        </p>
      </Section>
    </>
  );
}
