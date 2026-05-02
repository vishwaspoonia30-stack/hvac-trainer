"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PERSONAS } from "@/lib/personas";
import { Persona } from "@/lib/types";
import { getSessionSummaries } from "@/lib/storage";

const difficultyColors: Record<string, string> = {
  Easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Hard: "text-red-400 bg-red-400/10 border-red-400/20",
};

const cardBorders: Record<string, string> = {
  emerald: "border-emerald-500/30 hover:border-emerald-500/60",
  amber: "border-amber-500/30 hover:border-amber-500/60",
  orange: "border-orange-500/30 hover:border-orange-500/60",
  blue: "border-blue-500/30 hover:border-blue-500/60",
  red: "border-red-500/30 hover:border-red-500/60",
};

const selectedBorders: Record<string, string> = {
  emerald: "border-emerald-400 ring-1 ring-emerald-400/40",
  amber: "border-amber-400 ring-1 ring-amber-400/40",
  orange: "border-orange-400 ring-1 ring-orange-400/40",
  blue: "border-blue-400 ring-1 ring-blue-400/40",
  red: "border-red-400 ring-1 ring-red-400/40",
};

export default function PersonaPicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<Persona | null>(null);
  const [sessions] = useState(() => {
    if (typeof window === "undefined") return [];
    return getSessionSummaries();
  });

  const handleStart = () => {
    if (!selected) return;
    router.push(`/call?persona=${selected.id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">
              🏠 HVAC Voice Trainer
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">NestZero Field Sales — Orangeville</p>
          </div>
          <button
            onClick={() => router.push("/history")}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            <span>📋</span>
            <span>History</span>
            {sessions.length > 0 && (
              <span className="bg-zinc-700 text-zinc-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {sessions.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-zinc-100">Pick a homeowner</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Each persona simulates a different type of buyer. Start easy, work up to hard.
          </p>
        </div>

        {/* Persona cards */}
        <div className="space-y-3">
          {PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setSelected(persona)}
              className={`w-full text-left p-4 rounded-xl border bg-zinc-900 transition-all duration-150 ${
                selected?.id === persona.id
                  ? selectedBorders[persona.color]
                  : `${cardBorders[persona.color]} hover:bg-zinc-800/80`
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{persona.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-zinc-100 text-sm">{persona.name}</span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${difficultyColors[persona.difficulty]}`}
                      >
                        {persona.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{persona.description}</p>
                  </div>
                </div>
                {selected?.id === persona.id && (
                  <span className="text-lg mt-0.5">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* What to expect */}
        <div className="mt-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 leading-relaxed">
            <span className="text-zinc-400 font-medium">How it works:</span> The AI plays the homeowner out loud via your speaker. You talk back through your mic. Run the full Part 1 + Part 2 pitch, then get a scored breakdown.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <button
            onClick={handleStart}
            disabled={!selected}
            className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-150 ${
              selected
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {selected ? `Start Call — ${selected.name}` : "Select a persona to begin"}
          </button>
        </div>
      </main>
    </div>
  );
}
