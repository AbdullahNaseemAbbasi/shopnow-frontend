import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { invalidate } from "@/lib/cache";
import { useCartStore } from "@/store/cartStore";
import { disconnectRealtime } from "@/lib/realtime";
import { setAuthToken } from "@/lib/authToken";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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
        // The durable session is the HttpOnly cookie the backend set on this response. Keep the
        // JWT only in memory for the Bearer fallback — never in localStorage.
        setAuthToken(user.token);
        set({ user: { ...user, token: "" }, isLoggedIn: true });
      },

      logout: () => {
        setAuthToken(null);
        // The JWT lives in an HttpOnly cookie; only the backend can clear it. Fire-and-forget.
        fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
        invalidate();
        // Wipe this user's personal traces so they don't leak into the next session on a shared
        // device: cart, recently-viewed, recent searches, and any applied coupon.
        useCartStore.getState().reset();
        try {
          localStorage.removeItem("shopnow_recently_viewed");
          localStorage.removeItem("shopnow_recent_searches");
          sessionStorage.removeItem("shopnow_coupon");
        } catch {
          /* storage unavailable — nothing to clear */
        }
        // Close the SSE stream so the next user doesn't inherit this one's live connection.
        disconnectRealtime();
        set({ user: null, isLoggedIn: false });
      },
    }),
    {
      name: "shopnow-auth",
      // Persist only non-sensitive identity for UI rehydration — never the token.
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user ? { ...state.user, token: "" } : null,
      }),
    }
  )
);
