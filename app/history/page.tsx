"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionSummaries, clearSessions } from "@/lib/storage";
import { SessionSummary } from "@/lib/types";
import { PERSONAS } from "@/lib/personas";

const personaEmoji: Record<string, string> = {
  friendly: "😊",
  "skeptical-retiree": "🧓",
  busy: "👩‍👧",
  comparison: "📊",
  hostile: "😤",
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    setSessions(getSessionSummaries());
  }, []);

  const handleClear = () => {
    if (confirm("Clear all session history?")) {
      clearSessions();
      setSessions([]);
    }
  };

  const scoreColor = (s: number) =>
    s >= 8 ? "text-emerald-400" : s >= 6 ? "text-amber-400" : s >= 4 ? "text-orange-400" : "text-red-400";

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-4 py-3 sticky top-0 bg-zinc-950 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-sm font-semibold text-zinc-100">Session History</h1>
          <div className="flex gap-2">
            {sessions.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-400/20 hover:border-red-400/40 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => router.push("/")}
              className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-400/30 hover:border-blue-400/60 transition-colors"
            >
              New Call
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {sessions.length === 0 ? (
          <div className="text-center mt-20 text-zinc-600">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-sm">No sessions yet.</p>
            <p className="text-xs mt-1 text-zinc-700">Complete a call to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-600 mb-4">{sessions.length} session{sessions.length !== 1 ? "s" : ""} (last 10 stored)</p>
            {sessions.map((s) => {
              const persona = PERSONAS.find((p) => p.id === s.personaId);
              return (
                <button
                  key={s.sessionId}
                  onClick={() => router.push(`/scorecard?id=${s.sessionId}`)}
                  className="w-full text-left p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{personaEmoji[s.personaId] || "🏠"}</span>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{s.personaName}</p>
                        <p className="text-xs text-zinc-600">
                          {new Date(s.date).toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {formatDuration(s.durationSeconds)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${scoreColor(s.overallScore)}`}>
                        {s.overallScore.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-zinc-600">/ 10</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
