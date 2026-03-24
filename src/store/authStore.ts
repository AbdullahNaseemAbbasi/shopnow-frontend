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
        localStorage.setItem("shopnow_user", JSON.stringify(user));
        set({ user, isLoggedIn: true });
      },

      logout: () => {
        localStorage.removeItem("shopnow_token");
        localStorage.removeItem("shopnow_user");
        set({ user: null, isLoggedIn: false });
      },
    }),
    { name: "shopnow-auth" }
  )
);
