"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "mash-cart";

// Cart lives in localStorage (this is a real deployed app, not a sandboxed
// artifact, so that's the right tool here) — persists across a page
// refresh or a customer browsing away and back before checking out.
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch (e) {
      // corrupted storage — start fresh rather than crash
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  // A cart "line" is unique per (menu_item_id, variation_id) pair — ordering
  // a Small and a Large of the same pizza are two lines, not one.
  function addItem({ menuItemId, variationId = null, name, price, quantity = 1, imageUrl = null }) {
    setItems((current) => {
      const idx = current.findIndex(
        (i) => i.menuItemId === menuItemId && i.variationId === variationId
      );
      if (idx >= 0) {
        const next = [...current];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...current, { menuItemId, variationId, name, price, quantity, imageUrl }];
    });
  }

  function updateQuantity(menuItemId, variationId, quantity) {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((i) => !(i.menuItemId === menuItemId && i.variationId === variationId));
      }
      return current.map((i) =>
        i.menuItemId === menuItemId && i.variationId === variationId ? { ...i, quantity } : i
      );
    });
  }

  function removeItem(menuItemId, variationId) {
    updateQuantity(menuItemId, variationId, 0);
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, subtotal, itemCount, loaded }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
