"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPersona } from "@/lib/personas";
import { TranscriptEntry, Scorecard } from "@/lib/types";
import { saveScorecardToStorage } from "@/lib/storage";

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onspeechend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number };
}

type CallState = "idle" | "homeowner-speaking" | "listening" | "processing" | "ended";

const PREFERRED_VOICES = [
  "Samantha", "Karen", "Moira", "Fiona", "Victoria",
  "Google UK English Female", "Microsoft Zira",
];

function getPreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const name of PREFERRED_VOICES) {
    const match = voices.find((v) => v.name === name || v.name.includes(name));
    if (match) return match;
  }
  const female = voices.find(
    (v) => v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("woman"))
  );
  if (female) return female;
  return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
}

export default function CallScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const personaId = params.get("persona") || "friendly";
  const persona = getPersona(personaId);

  const [callState, setCallState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [isMicActive, setIsMicActive] = useState(false);

  const messagesRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const isEndingRef = useRef(false);
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (callState === "ended" || callState === "idle") return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [callState, startTime]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, currentSpeech]);

  const speak = useCallback((text: string, onDone?: () => void) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const voice = getPreferredVoice(voices);
    if (voice) utt.voice = voice;
    utt.rate = 0.92;
    utt.pitch = 1.05;
    utt.volume = 1;
    utt.onend = () => {
      // 700ms delay after TTS so mic doesn't catch echo/reverb
      setTimeout(() => onDone?.(), 700);
    };
    utt.onerror = () => {
      setTimeout(() => onDone?.(), 700);
    };
    synth.speak(utt);
  }, []);

  const appendTranscript = useCallback((entry: TranscriptEntry) => {
    transcriptRef.current = [...transcriptRef.current, entry];
    setTranscript([...transcriptRef.current]);
  }, []);

  const getHomeownerResponse = useCallback(async () => {
    if (isEndingRef.current) return;
    setCallState("homeowner-speaking");
    setIsMicActive(false);
    let fullResponse = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId, messages: messagesRef.current }),
      });
      if (!res.ok || !res.body) throw new Error("API error");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value);
        setCurrentSpeech(fullResponse);
      }
      setCurrentSpeech("");
      if (fullResponse.trim()) {
        appendTranscript({ role: "homeowner", text: fullResponse.trim(), timestamp: Date.now() });
        messagesRef.current = [...messagesRef.current, { role: "assistant", content: fullResponse.trim() }];
        if (!isEndingRef.current) {
          speak(fullResponse.trim(), () => {
            if (!isEndingRef.current) startListening();
          });
        }
      }
    } catch (err) {
      console.error("Response error:", err);
      if (!isEndingRef.current) startListening();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId, appendTranscript, speak]);

  const startListening = useCallback(() => {
    if (isEndingRef.current) return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition not supported. Please use Chrome or Edge.");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    let finalText = "";
    let hasSpoken = false;

    rec.onstart = () => {
      setCallState("listening");
      setIsMicActive(true);
    };

    rec.onresult = (e: ISpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += t + " ";
          hasSpoken = true;
        } else {
          interim = t;
        }
      }
      setCurrentSpeech(finalText + interim);
    };

    rec.onspeechend = () => {
      if (hasSpoken) rec.stop();
    };

    rec.onend = () => {
      setIsMicActive(false);
      if (isEndingRef.current) return;
      const text = finalText.trim();
      setCurrentSpeech("");
      if (text.length > 2) {
        appendTranscript({ role: "user", text, timestamp: Date.now() });
        messagesRef.current = [...messagesRef.current, { role: "user", content: text }];
        getHomeownerResponse();
      } else {
        listenTimeoutRef.current = setTimeout(() => {
          if (!isEndingRef.current) startListening();
        }, 400);
      }
    };

    rec.onerror = (e: { error: string }) => {
      setIsMicActive(false);
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        alert("Microphone access denied. Please allow mic access and reload the page.");
        return;
      }
      if (!isEndingRef.current && (e.error === "no-speech" || e.error === "aborted" || e.error === "network")) {
        listenTimeoutRef.current = setTimeout(() => {
          if (!isEndingRef.current) startListening();
        }, 400);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendTranscript, getHomeownerResponse]);

  const startCall = useCallback(async () => {
    if (!persona) return;
    setCallState("homeowner-speaking");
    if (window.speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        window.speechSynthesis.addEventListener("voiceschanged", () => resolve(), { once: true });
        setTimeout(resolve, 1000);
      });
    }
    const greeting = persona.greeting;
    appendTranscript({ role: "homeowner", text: greeting, timestamp: Date.now() });
    messagesRef.current = [{ role: "assistant", content: greeting }];
    speak(greeting, () => { if (!isEndingRef.current) startListening(); });
  }, [persona, appendTranscript, speak, startListening]);

  const endCall = useCallback(async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    setCallState("ended");
    setIsMicActive(false);
    if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
    setCurrentSpeech("");
    if (transcriptRef.current.length < 2) { router.push("/"); return; }
    setIsScoring(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptRef.current, personaId }),
      });
      if (!res.ok) throw new Error("Scoring failed");
      const scoreData = await res.json();
      const scorecard: Scorecard = {
        sessionId: sessionId.current,
        personaId: persona!.id,
        personaName: persona!.name,
        difficulty: persona!.difficulty,
        date: Date.now(),
        durationSeconds: Math.floor((Date.now() - startTime) / 1000),
        axes: scoreData.axes,
        overallScore: scoreData.overallScore,
        summaryFeedback: scoreData.summaryFeedback,
        transcript: transcriptRef.current,
        didSign: scoreData.didSign,
      };
      saveScorecardToStorage(scorecard);
      router.push(`/scorecard?id=${sessionId.current}`);
    } catch (err) {
      console.error("Scoring error:", err);
      setScoreError("Scoring failed. Try again.");
      setIsScoring(false);
    }
  }, [personaId, persona, startTime, router]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (!persona) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        Unknown persona.{" "}
        <button onClick={() => router.push("/")} className="ml-2 underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{persona.emoji}</span>
          <div>
            <p className="text-sm font-medium text-zinc-100">{persona.name}</p>
            <p className="text-xs text-zinc-500">{persona.difficulty}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {callState !== "idle" && callState !== "ended" && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {formatTime(elapsed)}
            </div>
          )}
          <button
            onClick={() => router.push("/")}
            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
        {transcript.length === 0 && callState === "idle" && (
          <div className="text-center mt-16 text-zinc-600 text-sm">
            <p className="text-4xl mb-4">🎙️</p>
            <p>Press Start Call to begin your practice session</p>
            <p className="text-xs mt-2 text-zinc-700">The homeowner will greet you — then respond naturally when you see the green mic.</p>
          </div>
        )}

        {transcript.map((entry, i) => (
          <div key={i} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              entry.role === "user"
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
            }`}>
              <p className={`text-[10px] mb-1 font-medium ${entry.role === "user" ? "text-blue-300" : "text-zinc-500"}`}>
                {entry.role === "user" ? "YOU" : "HOMEOWNER"}
              </p>
              {entry.text}
            </div>
          </div>
        ))}

        {currentSpeech && (
          <div className={`flex ${callState === "listening" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed opacity-75 italic ${
              callState === "listening"
                ? "bg-blue-600/50 text-blue-200 rounded-br-sm"
                : "bg-zinc-800 text-zinc-400 rounded-bl-sm"
            }`}>
              <p className="text-[10px] mb-1 font-medium text-zinc-500">
                {callState === "listening" ? "YOU (speaking...)" : "HOMEOWNER (speaking...)"}
              </p>
              {currentSpeech}
            </div>
          </div>
        )}

        {callState === "homeowner-speaking" && !currentSpeech && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>

      <div className="border-t border-zinc-800 px-4 py-4 max-w-2xl mx-auto w-full">
        {scoreError && <p className="text-red-400 text-xs text-center mb-3">{scoreError}</p>}

        {isScoring && (
          <div className="text-center py-4">
            <p className="text-zinc-400 text-sm animate-pulse">Analyzing your call...</p>
            <p className="text-zinc-600 text-xs mt-1">Takes about 10 seconds</p>
          </div>
        )}

        {!isScoring && callState === "idle" && (
          <button
            onClick={startCall}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-base transition-colors shadow-lg shadow-blue-600/20"
          >
            🎙️ Start Call
          </button>
        )}

        {!isScoring && callState !== "idle" && callState !== "ended" && (
          <div className="space-y-3">

            {/* BIG listening indicator */}
            {callState === "listening" && (
              <div className="flex flex-col items-center gap-2 py-1">
                <div
                  className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center"
                  style={{
                    boxShadow: isMicActive
                      ? "0 0 0 8px rgba(52,211,153,0.12), 0 0 0 18px rgba(52,211,153,0.06)"
                      : "none",
                    transition: "box-shadow 0.3s ease",
                  }}
                >
                  <span className="text-2xl">🎙️</span>
                </div>
                <p className="text-emerald-400 text-sm font-bold tracking-wide uppercase">
                  Your turn — speak now
                </p>
                <p className="text-zinc-600 text-xs">Mic is live. Talk naturally, pause when done.</p>
              </div>
            )}

            {callState === "homeowner-speaking" && (
              <div className="flex flex-col items-center gap-2 py-1">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center">
                  <span className="text-2xl">{persona.emoji}</span>
                </div>
                <p className="text-amber-400 text-sm font-bold tracking-wide uppercase">
                  Homeowner speaking
                </p>
                <p className="text-zinc-600 text-xs">Listen carefully — respond when it&apos;s your turn.</p>
              </div>
            )}

            {callState === "processing" && (
              <div className="flex flex-col items-center gap-1 py-3">
                <p className="text-zinc-500 text-sm animate-pulse">Processing...</p>
              </div>
            )}

            <button
              onClick={endCall}
              className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl font-semibold text-sm border border-red-600/30 hover:border-red-600/50 transition-colors"
            >
              End Call &amp; Get Score
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
