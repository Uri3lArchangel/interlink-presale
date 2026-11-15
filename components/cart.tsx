"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MAX_QTY, productById, type Product } from "@/lib/catalog";
import type { BrandKey } from "@/lib/brands";
import { transactionFee } from "@/lib/pricing";

type Cart = Record<string, number>;
type CartLine = Product & { quantity: number };

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  fee: number;
  total: number;
  ready: boolean;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  toast: string | null;
};

const Ctx = createContext<CartCtx | null>(null);
// Each store keeps its own bag. Interlink keeps its original key so existing bags survive.
const keyFor = (store: BrandKey) => (store === "interlink" ? "interlink-presale-bag-v2" : `${store}-presale-bag-v1`);

export function CartProvider({ store = "interlink", children }: { store?: BrandKey; children: React.ReactNode }) {
  const KEY = keyFor(store);
  const inStore = useCallback((id: string) => productById(id)?.store === store, [store]);
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
        if (inStore(id) && Number.isInteger(q) && q > 0) clean[id] = Math.min(q, MAX_QTY);
      }
      setCart(clean);
    } catch {
      // Storage unavailable (private mode); the bag still works for this visit.
    }
    setReady(true);
  }, [KEY, inStore]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, ready, KEY]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const add = useCallback(
    (id: string) => {
      const p = productById(id);
      if (!p || p.store !== store) return;
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
    [flash, store],
  );

  const setQty = useCallback((id: string, qty: number) => {
    if (!inStore(id)) return;
    setCart((c) => {
      const next = { ...c };
      const q = Math.max(0, Math.min(MAX_QTY, qty));
      if (q) next[id] = q;
      else delete next[id];
      return next;
    });
  }, [inStore]);

  const clear = useCallback(() => setCart({}), []);

  const value = useMemo<CartCtx>(() => {
    const lines = Object.entries(cart)
      .map(([id, quantity]) => ({ ...productById(id)!, quantity }))
      .filter((l) => l.id);
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.price, 0);
    const fee = transactionFee(subtotal);
    return {
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal,
      fee,
      total: subtotal + fee,
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
