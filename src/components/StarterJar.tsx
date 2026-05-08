"use client";

import { Mood } from "@/lib/starterMood";

const moodImages: Record<Mood, string> = {
  happy: "/moods/happy.png",
  hungry: "/moods/hungry.png",
  sleepy: "/moods/sleepy.png",
  new: "/moods/new.png",
  ready: "/moods/ready.png",
  peak: "/moods/peak.png",
};

export function StarterJar({ mood, name }: { mood: Mood; name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-44 h-44 animate-breathe">
        <img
          src={moodImages[mood]}
          alt={`Закваска ${name}`}
          className="w-full h-full object-contain"
        />
      </div>
      <p className="mt-2 text-lg font-extrabold text-brown-dark">{name}</p>
    </div>
  );
}
