'use client';

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from 'react';
import CheckoutSheet from './CheckoutSheet';

const CartContext = createContext(null);
const STORAGE_KEY = 'mymuayy_cart_v1';
const EMPTY = [];

// Cart lives in localStorage; this tiny store keeps components (and other tabs) in sync.
let cache = null;
const listeners = new Set();

function readCart() {
  if (cache === null) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      cache = Array.isArray(saved) ? saved : EMPTY;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function writeCart(next) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

const setItems = (updater) => writeCart(updater(readCart()));

const lineKey = (item) => [item.productId, item.productOptionId || '', item.targetId || ''].join('|');

export function CartProvider({ children }) {
  const items = useSyncExternalStore(subscribe, readCart, () => EMPTY);
  const [checkout, setCheckout] = useState(null); // { items, fromCart }
  const [toast, setToast] = useState('');

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const key = lineKey(item);
      const existing = prev.find((line) => line.key === key);
      if (existing) {
        return prev.map((line) => (line.key === key ? { ...line, quantity: Math.min(50, line.quantity + (item.quantity || 1)) } : line));
      }
      return [...prev, { ...item, key, quantity: item.quantity || 1 }];
    });
    setToast(`เพิ่ม "${item.name}" ลงตะกร้าแล้ว`);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    setItems((prev) => prev.map((line) => (line.key === key ? { ...line, quantity: Math.max(1, Math.min(50, quantity)) } : line)));
  }, []);

  const removeItem = useCallback((key) => setItems((prev) => prev.filter((line) => line.key !== key)), []);
  const removeKeys = useCallback((keys) => setItems((prev) => prev.filter((line) => !keys.includes(line.key))), []);

  const openCheckout = useCallback((checkoutItems, options = {}) => {
    setCheckout({ items: checkoutItems.map((item) => ({ ...item, key: item.key || lineKey(item) })), fromCart: Boolean(options.fromCart) });
  }, []);

  const closeCheckout = useCallback(() => setCheckout(null), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      total: items.reduce((sum, line) => sum + line.price * line.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      openCheckout,
    }),
    [items, addItem, updateQuantity, removeItem, openCheckout]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {checkout && (
        <CheckoutSheet
          items={checkout.items}
          onClose={closeCheckout}
          onPurchased={() => checkout.fromCart && removeKeys(checkout.items.map((item) => item.key))}
        />
      )}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[90] bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-lg animate-fadeIn max-w-[90vw] truncate">
          {toast}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
