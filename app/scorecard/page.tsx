import ScorecardView from "@/components/ScorecardView";
import { Suspense } from "react";

export default function ScorecardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading scorecard...</div>}>
      <ScorecardView />
    </Suspense>
  );
}
