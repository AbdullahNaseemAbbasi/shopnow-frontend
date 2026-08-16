import { create } from "zustand";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import type { WishlistItem } from "@/types";

interface WishlistState {
  ids: Set<number>;
  loaded: boolean;
  loading: boolean;
  /** Fetch the logged-in user's wishlist product ids once (deduped across all cards). */
  ensureLoaded: () => void;
  /** Toggle membership on the server; resolves to the NEW membership (true = now wishlisted). */
  toggle: (productId: number) => Promise<boolean>;
  reset: () => void;
}

// Shared across every ProductCard so a grid of N cards fires ONE GET /api/wishlist, not N.
let inFlight: Promise<void> | null = null;

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set<number>(),
  loaded: false,
  loading: false,

  ensureLoaded: () => {
    if (get().loaded || get().loading || inFlight) return;
    set({ loading: true });
    inFlight = api
      .get<WishlistItem[]>("/api/wishlist")
      .then((res) => {
        set({ ids: new Set<number>((res.data || []).map((w) => w.productId)), loaded: true });
      })
      // Treat a failed load as "empty but loaded" so we don't hammer the endpoint on every mount.
      .catch(() => set({ loaded: true }))
      .finally(() => {
        set({ loading: false });
        inFlight = null;
      });
  },

  toggle: async (productId: number) => {
    const prevIds = get().ids;
    const currentlyIn = prevIds.has(productId);
    // Optimistically flip so every card showing this product updates immediately.
    const next = new Set(prevIds);
    if (currentlyIn) next.delete(productId);
    else next.add(productId);
    set({ ids: next });
    try {
      await api.post(`/api/wishlist/${productId}`);
      return !currentlyIn;
    } catch (e) {
      set({ ids: prevIds }); // revert on failure
      throw e;
    }
  },

  reset: () => {
    inFlight = null;
    set({ ids: new Set<number>(), loaded: false, loading: false });
  },
}));

// Membership is per-user. When the signed-in user changes (login/logout) drop the cached ids so
// one account's wishlist never leaks into another session on the same tab, and eagerly reload for
// the newly signed-in user. Observes authStore read-only — it never mutates it.
if (typeof window !== "undefined") {
  useAuthStore.subscribe((state, prev) => {
    if (state.isLoggedIn === prev.isLoggedIn) return;
    useWishlistStore.getState().reset();
    if (state.isLoggedIn) useWishlistStore.getState().ensureLoaded();
  });
}
