"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSessionById } from "@/lib/storage";
import { Scorecard, ScoreAxis } from "@/lib/types";

function ScoreBar({ score, weight }: { score: number; weight: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-amber-500" : score >= 4 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${color.replace("bg-", "text-")}`}>{score}</span>
      {weight === 2 && (
        <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1 py-0.5 rounded">2×</span>
      )}
    </div>
  );
}

function AxisCard({ axis }: { axis: ScoreAxis }) {
  return (
    <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-zinc-200">{axis.name}</p>
        {axis.weight === 2 && (
          <span className="shrink-0 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">Priority</span>
        )}
      </div>
      <ScoreBar score={axis.score} weight={axis.weight} />
      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{axis.feedback}</p>
    </div>
  );
}

export default function ScorecardView() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("id");
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const s = getSessionById(sessionId);
    if (s) setScorecard(s);
  }, [sessionId]);

  if (!scorecard) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-zinc-500">
          <p>Session not found.</p>
          <button onClick={() => router.push("/")} className="mt-3 text-blue-400 underline text-sm">Go home</button>
        </div>
      </div>
    );
  }

  const overall = scorecard.overallScore;
  const overallColor =
    overall >= 8 ? "text-emerald-400" : overall >= 6 ? "text-amber-400" : overall >= 4 ? "text-orange-400" : "text-red-400";
  const overallBg =
    overall >= 8 ? "bg-emerald-400/10 border-emerald-400/20" : overall >= 6 ? "bg-amber-400/10 border-amber-400/20" : overall >= 4 ? "bg-orange-400/10 border-orange-400/20" : "bg-red-400/10 border-red-400/20";

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const priorityAxes = scorecard.axes.filter((a) => a.weight === 2);
  const standardAxes = scorecard.axes.filter((a) => a.weight === 1);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-3 sticky top-0 bg-zinc-950 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-sm font-semibold text-zinc-100">Call Scorecard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/history")}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              History
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-400/30 hover:border-blue-400/60 transition-colors"
            >
              New Call
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Overview card */}
        <div className={`p-5 rounded-2xl border ${overallBg}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">{scorecard.personaName} · {scorecard.difficulty ?? "—"} · {formatDuration(scorecard.durationSeconds)}</p>
              <p className="text-xs text-zinc-600">{new Date(scorecard.date).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-bold ${overallColor}`}>{overall.toFixed(1)}</p>
              <p className="text-xs text-zinc-500">/ 10</p>
            </div>
          </div>

          {/* Sign result */}
          <div className={`flex items-center gap-2 p-3 rounded-xl ${scorecard.didSign ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-zinc-800 border border-zinc-700"}`}>
            <span className="text-lg">{scorecard.didSign ? "✅" : "🤔"}</span>
            <p className="text-sm font-medium text-zinc-200">
              {scorecard.didSign
                ? "Homeowner agreed to proceed — signed!"
                : "Homeowner said \"let me think about it\" — not yet signed."}
            </p>
          </div>
        </div>

        {/* Summary feedback */}
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Coach Notes</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{scorecard.summaryFeedback}</p>
        </div>

        {/* Priority axes */}
        <div>
          <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-3">Priority Areas (2× weight)</p>
          <div className="space-y-3">
            {priorityAxes.map((axis) => (
              <AxisCard key={axis.name} axis={axis} />
            ))}
          </div>
        </div>

        {/* Standard axes */}
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Standard Areas</p>
          <div className="space-y-3">
            {standardAxes.map((axis) => (
              <AxisCard key={axis.name} axis={axis} />
            ))}
          </div>
        </div>

        {/* Transcript toggle */}
        <div>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors text-sm text-zinc-400 flex items-center justify-between"
          >
            <span>View full transcript ({scorecard.transcript.length} messages)</span>
            <span>{showTranscript ? "▲" : "▼"}</span>
          </button>

          {showTranscript && (
            <div className="mt-3 space-y-2 max-h-96 overflow-y-auto pr-1">
              {scorecard.transcript.map((entry, i) => (
                <div key={i} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      entry.role === "user"
                        ? "bg-blue-600/30 text-blue-100 rounded-br-sm"
                        : "bg-zinc-800 text-zinc-300 rounded-bl-sm"
                    }`}
                  >
                    <p className={`text-[9px] mb-1 font-medium ${entry.role === "user" ? "text-blue-400" : "text-zinc-500"}`}>
                      {entry.role === "user" ? "YOU" : "HOMEOWNER"}
                    </p>
                    {entry.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
