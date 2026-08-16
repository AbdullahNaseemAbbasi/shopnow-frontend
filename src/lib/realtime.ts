"use client";

// Client-side Server-Sent Events manager. Opens ONE EventSource for the logged-in user and
// fans named events out to subscribers. EventSource can't set an Authorization header, so it
// authenticates with the HttpOnly session cookie via `withCredentials` — no token in the URL
// (query strings leak into access logs, history and Referer headers).

import { useAuthStore } from "@/store/authStore";

type Payload = Record<string, unknown>;
type Handler = (data: Payload) => void;

// Every event name the server can emit. Add new ones here so the manager attaches a listener —
// EventSource only dispatches named events to listeners registered for that exact name, so a
// missing entry here silently drops that event (this is why admin returns weren't live-updating).
const EVENTS = ["order.created", "order.updated", "return.created", "return.updated", "notification"] as const;

// After this many consecutive connection failures, stop retrying. A dead/expired session would
// otherwise make the browser's built-in EventSource retry hammer the backend every few seconds
// forever; we give up and let a fresh login re-open the stream.
const MAX_FAILURES = 5;

const listeners = new Map<string, Set<Handler>>();
const statusListeners = new Set<(connected: boolean) => void>();
let source: EventSource | null = null;
let connected = false;
let failures = 0;
let givenUp = false;

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((fn) => fn(value));
}

export function connectRealtime() {
  if (typeof window === "undefined" || source || givenUp) return;
  // Only stream for a logged-in user — the endpoint requires auth, so attempting it while logged
  // out just produces 401 → retry churn.
  if (!useAuthStore.getState().isLoggedIn) return;

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  // withCredentials sends the HttpOnly session cookie on this cross-origin stream.
  const es = new EventSource(`${base}/api/realtime/stream`, { withCredentials: true });
  source = es;

  const onUp = () => { failures = 0; setConnected(true); };
  es.addEventListener("connected", onUp);
  es.onopen = onUp;
  es.onerror = () => {
    setConnected(false);
    failures += 1;
    if (failures >= MAX_FAILURES) {
      // Stop the native auto-retry loop; a later re-login (resetRealtime) clears this.
      givenUp = true;
      es.close();
      source = null;
    }
  };

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
  // Reset the failure gate so the next logged-in session can reconnect cleanly.
  failures = 0;
  givenUp = false;
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
