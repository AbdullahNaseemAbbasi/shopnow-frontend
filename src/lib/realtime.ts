"use client";

// Client-side Server-Sent Events manager. Opens ONE EventSource for the logged-in user and
// fans named events out to subscribers. EventSource can't send an Authorization header, so the
// JWT rides along as a ?token= query param (the backend's JwtAuthFilter accepts it there).

type Payload = Record<string, unknown>;
type Handler = (data: Payload) => void;

// Every event name the server can emit. Add new ones here so the manager attaches a listener —
// EventSource only dispatches named events to listeners registered for that exact name, so a
// missing entry here silently drops that event (this is why admin returns weren't live-updating).
const EVENTS = ["order.created", "order.updated", "return.created", "return.updated", "notification"] as const;

const listeners = new Map<string, Set<Handler>>();
const statusListeners = new Set<(connected: boolean) => void>();
let source: EventSource | null = null;
let connected = false;

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((fn) => fn(value));
}

export function connectRealtime() {
  if (typeof window === "undefined" || source) return;
  const token = localStorage.getItem("shopnow_token");
  if (!token) return;

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const es = new EventSource(`${base}/api/realtime/stream?token=${encodeURIComponent(token)}`);
  source = es;

  es.addEventListener("connected", () => setConnected(true));
  es.onopen = () => setConnected(true);
  es.onerror = () => setConnected(false); // EventSource retries on its own; just reflect state

  for (const event of EVENTS) {
    es.addEventListener(event, (e: MessageEvent) => {
      let data: Payload = {};
      try {
        data = JSON.parse(e.data);
      } catch {
        // keep empty object
      }
      listeners.get(event)?.forEach((h) => h(data));
    });
  }
}

export function disconnectRealtime() {
  source?.close();
  source = null;
  setConnected(false);
}

/** Subscribe to a named event. Opens the connection lazily. Returns an unsubscribe fn. */
export function onRealtime(event: string, handler: Handler): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  connectRealtime();
  return () => {
    listeners.get(event)?.delete(handler);
  };
}

/** Subscribe to connection status changes. Fires immediately with the current value. */
export function onRealtimeStatus(handler: (connected: boolean) => void): () => void {
  statusListeners.add(handler);
  handler(connected);
  return () => {
    statusListeners.delete(handler);
  };
}
