"use client";

import { useRealtimeStatus } from "@/lib/useRealtime";
import { cn } from "@/lib/utils";

// Small pulsing "Live" pill that reflects the SSE connection state. Green + animated when the
// realtime stream is open, muted grey when it is not.
export default function LiveIndicator({ className }: { className?: string }) {
  const connected = useRealtimeStatus();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
        connected ? "bg-success-light text-success" : "bg-surface-subtle text-ink-muted",
        className
      )}
      title={connected ? "Live updates on" : "Connecting…"}
    >
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", connected ? "bg-success" : "bg-ink-faint")} />
      </span>
      {connected ? "Live" : "Offline"}
    </span>
  );
}
