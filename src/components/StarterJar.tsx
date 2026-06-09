"use client";

import { Mood } from "@/lib/starterMood";

const moodImages: Record<Mood, string> = {
  happy: "/moods/happy.png",
  hungry: "/moods/hungry.png",
  new: "/moods/new.png",
  ready: "/moods/ready.png",
  peak: "/moods/peak.png?v=2",
  paused: "/moods/hungry.png",  // Используем hungry как заглушку для паузы
};

export function StarterJar({ mood, name }: { mood: Mood; name: string }) {
  return (
    <div className="flex flex-col items-center overflow-visible">
      <div className="w-44 h-44 flex items-center justify-center animate-breathe overflow-visible">
        <img
          src={moodImages[mood]}
          alt={name}
          className={`w-full object-contain ${mood === "peak" ? "-mt-3" : ""} ${mood === "paused" ? "opacity-50 grayscale" : ""}`}
        />
      </div>
    </div>
  );
}
