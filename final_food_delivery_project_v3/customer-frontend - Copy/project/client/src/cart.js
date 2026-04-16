import { useEffect, useState } from "react";
import { api, getToken } from "./api";

const CART_KEY = "cloverGuestCart";

function emitCartUpdate(items) {
  window.dispatchEvent(
    new CustomEvent("clover-cart-updated", {
      detail: { items, count: getCartCount(items), total: getCartTotal(items) },
    })
  );
}

function normalizeCartItem(item = {}) {
  return {
    restaurantId: item.restaurantId ? String(item.restaurantId) : "",
    restaurantName: item.restaurantName ? String(item.restaurantName) : "",
    dishId: item.dishId ? String(item.dishId) : "",
    dishName: item.dishName ? String(item.dishName) : "",
    qty: Math.max(1, Number(item.qty) || 1),
    price: Number(item.price) || 0,
    imageUrl: item.imageUrl ? String(item.imageUrl) : "",
    isVeg: Boolean(item.isVeg),
  };
}

function mergeItems(items = [], incoming) {
  const nextItem = normalizeCartItem(incoming);
  if (!nextItem.dishName) return items;

  const copy = items.map((item) => ({ ...item }));
  const existing = copy.find(
    (item) =>
      (nextItem.dishId && item.dishId === nextItem.dishId) ||
      (!nextItem.dishId &&
        item.restaurantId === nextItem.restaurantId &&
        item.dishName === nextItem.dishName)
  );

  if (existing) {
    existing.qty += nextItem.qty;
    existing.price = nextItem.price;
    existing.imageUrl = nextItem.imageUrl || existing.imageUrl;
    existing.restaurantName = nextItem.restaurantName || existing.restaurantName;
    existing.isVeg = nextItem.isVeg;
    return copy;
  }

  copy.push(nextItem);
  return copy;
}

export function readGuestCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  emitCartUpdate(items);
}

export function clearGuestCart() {
  localStorage.removeItem(CART_KEY);
  emitCartUpdate([]);
}

export function getCartCount(items = []) {
  return items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

export function getCartTotal(items = []) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
}

export async function loadCart() {
  if (!getToken()) {
    const items = readGuestCart();
    emitCartUpdate(items);
    return { items, mode: "guest" };
  }

  const guestItems = readGuestCart();
  if (guestItems.length > 0) {
    await api("/cart/sync", {
      method: "POST",
      body: JSON.stringify({ items: guestItems }),
    });
    clearGuestCart();
  }

  const data = await api("/cart");
  const items = (data.cart?.items || []).map(normalizeCartItem);
  emitCartUpdate(items);
  return { items, mode: "account" };
}

export async function addItemToCart(item) {
  if (!getToken()) {
    const items = mergeItems(readGuestCart(), item);
    writeGuestCart(items);
    return { items, mode: "guest" };
  }

  const data = await api("/cart/items", {
    method: "POST",
    body: JSON.stringify(normalizeCartItem(item)),
  });
  const items = (data.cart?.items || []).map(normalizeCartItem);
  emitCartUpdate(items);
  return { items, mode: "account" };
}

export async function updateCartItemQty(item, qty) {
  if (!getToken()) {
    if (qty <= 0) {
      return removeCartItem(item);
    }

    const items = readGuestCart().map((entry) =>
      entry.dishId === item.dishId || entry.dishName === item.dishName
        ? { ...entry, qty: Math.max(1, qty) }
        : entry
    );
    writeGuestCart(items);
    return { items, mode: "guest" };
  }

  const data = await api(`/cart/items/${encodeURIComponent(item.dishId)}`, {
    method: "PATCH",
    body: JSON.stringify({ qty: Math.max(1, qty) }),
  });
  const items = (data.cart?.items || []).map(normalizeCartItem);
  emitCartUpdate(items);
  return { items, mode: "account" };
}

export async function removeCartItem(item) {
  if (!getToken()) {
    const items = readGuestCart().filter(
      (entry) => !(entry.dishId === item.dishId || entry.dishName === item.dishName)
    );
    writeGuestCart(items);
    return { items, mode: "guest" };
  }

  const data = await api(`/cart/items/${encodeURIComponent(item.dishId)}`, {
    method: "DELETE",
  });
  const items = (data.cart?.items || []).map(normalizeCartItem);
  emitCartUpdate(items);
  return { items, mode: "account" };
}

export async function clearCart() {
  if (!getToken()) {
    clearGuestCart();
    return { items: [], mode: "guest" };
  }

  const data = await api("/cart", { method: "DELETE" });
  const items = (data.cart?.items || []).map(normalizeCartItem);
  emitCartUpdate(items);
  return { items, mode: "account" };
}

export function useCartCount() {
  const [count, setCount] = useState(() => getCartCount(readGuestCart()));

  useEffect(() => {
    function onCartUpdated(event) {
      setCount(event.detail?.count || 0);
    }

    window.addEventListener("clover-cart-updated", onCartUpdated);
    loadCart().catch(() => {});
    return () => window.removeEventListener("clover-cart-updated", onCartUpdated);
  }, []);

  return count;
}
