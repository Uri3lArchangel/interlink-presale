"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MAX_QTY, productById, type Product } from "@/lib/catalog";

type Cart = Record<string, number>;
type CartLine = Product & { quantity: number };

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  toast: string | null;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "interlink-presale-bag-v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({});
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Cart;
      const clean: Cart = {};
      for (const [id, q] of Object.entries(saved)) {
        if (productById(id) && Number.isInteger(q) && q > 0) clean[id] = Math.min(q, MAX_QTY);
      }
      setCart(clean);
    } catch {
      // Storage unavailable (private mode); the bag still works for this visit.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, ready]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const add = useCallback(
    (id: string) => {
      const p = productById(id);
      if (!p) return;
      setCart((c) => {
        const q = c[id] ?? 0;
        if (q >= MAX_QTY) {
          flash(`Limit of ${MAX_QTY} per product during the presale`);
          return c;
        }
        flash(`${p.name} added to your bag`);
        return { ...c, [id]: q + 1 };
      });
    },
    [flash],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setCart((c) => {
      const next = { ...c };
      const q = Math.max(0, Math.min(MAX_QTY, qty));
      if (q) next[id] = q;
      else delete next[id];
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const value = useMemo<CartCtx>(() => {
    const lines = Object.entries(cart)
      .map(([id, quantity]) => ({ ...productById(id)!, quantity }))
      .filter((l) => l.id);
    return {
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.quantity * l.price, 0),
      ready,
      add,
      setQty,
      clear,
      open,
      setOpen,
      toast,
    };
  }, [cart, ready, add, setQty, clear, open, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
