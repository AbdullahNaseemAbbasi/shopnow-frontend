import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

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
        set({ user: null, isLoggedIn: false });
      },
    }),
    { name: "shopnow-auth" }
  )
);
