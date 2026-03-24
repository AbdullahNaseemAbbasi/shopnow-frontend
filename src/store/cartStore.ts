import { create } from "zustand";
import { Cart } from "@/types";
import api from "@/lib/axios";

interface CartState {
  cart: Cart | null;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateItem: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,

  fetchCart: async () => {
    try {
      set({ loading: true });
      const res = await api.get("/api/cart");
      set({ cart: res.data });
    } catch {
      set({ cart: null });
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (productId: number, quantity: number) => {
    await api.post("/api/cart/add", { productId, quantity });
    await get().fetchCart();
  },

  updateItem: async (cartItemId: number, quantity: number) => {
    await api.put(`/api/cart/items/${cartItemId}`, { quantity });
    await get().fetchCart();
  },

  removeItem: async (cartItemId: number) => {
    await api.delete(`/api/cart/items/${cartItemId}`);
    await get().fetchCart();
  },

  clearCart: async () => {
    await api.delete("/api/cart");
    set({ cart: null });
  },

  itemCount: () => {
    const cart = get().cart;
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
