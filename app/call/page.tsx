import CallScreen from "@/components/CallScreen";
import { Suspense } from "react";

export default function CallPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>}>
      <CallScreen />
    </Suspense>
  );
}
