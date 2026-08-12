import { create } from "zustand";
import toast from "react-hot-toast";
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
  reset: () => void;
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

  // The cart page wires these to bare onClick arrows with no try/catch, so a rejected PUT/DELETE
  // used to vanish silently. Surface it here and re-sync from the server so the UI can never
  // drift from the real cart on failure.
  updateItem: async (cartItemId: number, quantity: number) => {
    try {
      await api.put(`/api/cart/items/${cartItemId}`, { quantity });
    } catch {
      toast.error("Couldn't update quantity, please try again");
    } finally {
      await get().fetchCart();
    }
  },

  removeItem: async (cartItemId: number) => {
    try {
      await api.delete(`/api/cart/items/${cartItemId}`);
    } catch {
      toast.error("Couldn't remove item, please try again");
    } finally {
      await get().fetchCart();
    }
  },

  clearCart: async () => {
    await api.delete("/api/cart");
    set({ cart: null });
  },

  // Local-only wipe for logout. This store is module-level and NOT persisted, so without an
  // explicit reset the previous user's cart (and the navbar badge that counts it) survives
  // into the next session on the same tab. No network call — the server cart is untouched.
  reset: () => set({ cart: null, loading: false }),

  itemCount: () => {
    const cart = get().cart;
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
