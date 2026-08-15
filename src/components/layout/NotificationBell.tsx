"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Package, Truck, RotateCcw, RefreshCw, CheckCheck, type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRealtimeEvent } from "@/lib/useRealtime";
import api from "@/lib/axios";
import type { AppNotification, NotificationType } from "@/types";

const META: Record<NotificationType, { Icon: LucideIcon; tint: string }> = {
  ORDER_PLACED:     { Icon: Package,   tint: "bg-brand-50 text-brand" },
  ORDER_STATUS:     { Icon: Truck,     tint: "bg-brand-50 text-brand" },
  RETURN_REQUESTED: { Icon: RotateCcw, tint: "bg-amber-50 text-amber-600" },
  RETURN_UPDATE:    { Icon: RefreshCw, tint: "bg-amber-50 text-amber-600" },
  GENERAL:          { Icon: Bell,      tint: "bg-slate-100 text-slate-600" },
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    api
      .get<AppNotification[]>("/api/notifications")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setItems(list);
        setUnread(list.filter((n) => !n.read).length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoggedIn) load();
    else { setItems([]); setUnread(0); setOpen(false); }
  }, [isLoggedIn, load]);

  // Live: a new notification pushed over SSE. Prepend it and trust the server's unread count.
  useRealtimeEvent("notification", (data) => {
    const n: AppNotification = {
      id: Number(data.id),
      type: (data.type as NotificationType) ?? "GENERAL",
      title: String(data.title ?? ""),
      message: data.message ? String(data.message) : undefined,
      link: data.link ? String(data.link) : undefined,
      read: false,
      createdAt: String(data.createdAt ?? ""),
    };
    setItems((prev) => [n, ...prev.filter((p) => p.id !== n.id)].slice(0, 30));
    setUnread((prev) => (typeof data.unreadCount === "number" ? (data.unreadCount as number) : prev + 1));
  });

  const markRead = async (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
    try { await api.post(`/api/notifications/${id}/read`); } catch { /* optimistic */ }
  };

  const markAllRead = async () => {
    if (unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try { await api.post("/api/notifications/read-all"); } catch { /* optimistic */ }
  };

  const onItemClick = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-brand transition-colors"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-brand text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold animate-bounce-in">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-sm">Notifications</h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <Bell size={28} className="mx-auto mb-2 opacity-40" />
                  You&apos;re all caught up
                </div>
              ) : (
                items.map((n) => {
                  const { Icon, tint } = META[n.type] ?? META.GENERAL;
                  return (
                    <button
                      key={n.id}
                      onClick={() => onItemClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${n.read ? "" : "bg-brand-50/40"}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{n.title}</p>
                        {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1.5" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
