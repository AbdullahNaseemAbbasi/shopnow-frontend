import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { invalidate } from "@/lib/cache";
import { useCartStore } from "@/store/cartStore";
import { disconnectRealtime } from "@/lib/realtime";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,

      login: (user: User) => {
        localStorage.setItem("shopnow_token", user.token);
        document.cookie = `shopnow-auth=${encodeURIComponent(JSON.stringify({ state: { user } }))};path=/;max-age=86400`;
        set({ user, isLoggedIn: true });
      },

      logout: () => {
        localStorage.removeItem("shopnow_token");
        document.cookie = "shopnow-auth=;path=/;max-age=0";
        invalidate();
        // Wipe the non-persisted cart store too, otherwise the previous user's items (and the
        // navbar badge counting them) leak into the next session on this tab.
        useCartStore.getState().reset();
        // Close the SSE stream so the next user doesn't inherit this one's live connection.
        disconnectRealtime();
        set({ user: null, isLoggedIn: false });
      },
    }),
    { name: "shopnow-auth" }
  )
);
