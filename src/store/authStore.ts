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
        set({ user, isLoggedIn: true });
      },

      logout: () => {
        localStorage.removeItem("shopnow_token");
        set({ user: null, isLoggedIn: false });
      },
    }),
    { name: "shopnow-auth" }
  )
);
