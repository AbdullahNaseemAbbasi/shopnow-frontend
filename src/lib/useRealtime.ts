"use client";

import { useEffect, useRef, useState } from "react";
import { onRealtime, onRealtimeStatus } from "./realtime";

type Payload = Record<string, unknown>;

// Subscribe a component to a named realtime event. The handler is kept in a ref so passing an
// inline function does not re-subscribe on every render — the subscription is stable for the
// component's lifetime and always calls the latest handler.
export function useRealtimeEvent(event: string, handler: (data: Payload) => void) {
  const ref = useRef(handler);
  // Update the ref in an effect (not during render) so the subscription stays stable while
  // always dispatching to the latest handler.
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    return onRealtime(event, (data) => ref.current(data));
  }, [event]);
}

// True while the SSE stream is open. Drives the "Live" indicator.
export function useRealtimeStatus(): boolean {
  const [connected, setConnected] = useState(false);
  useEffect(() => onRealtimeStatus(setConnected), []);
  return connected;
}
