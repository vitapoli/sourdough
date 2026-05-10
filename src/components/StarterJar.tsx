"use client";

import { Mood } from "@/lib/starterMood";

const moodImages: Record<Mood, string> = {
  happy: "/moods/happy.png",
  hungry: "/moods/hungry.png",
  new: "/moods/new.png",
  ready: "/moods/ready.png",
  peak: "/moods/peak.png",
};

export function StarterJar({ mood, name }: { mood: Mood; name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-44 h-52 flex items-center justify-center animate-breathe">
        <img
          src={moodImages[mood]}
          alt={`Закваска ${name}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <p className="text-lg font-extrabold text-brown-dark">{name}</p>
    </div>
  );
}
