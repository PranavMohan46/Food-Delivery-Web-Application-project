const CART_KEY = "clover_cart";
let syncPromise = null;

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function setLocalCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

function saveCart(items) {
  setLocalCart(items);
  syncCartToServer();
}

function normalizeCartItems(items) {
  return (items || []).map(function (item) {
    return {
      restaurantId: item.restaurantId || "",
      restaurantName: item.restaurantName || "",
      dishId: item.dishId || "",
      dishName: item.dishName || item.name || "",
      qty: Math.max(1, Number(item.qty) || 1),
      price: Number(item.price) || 0,
      imageUrl: item.imageUrl || "",
      isVeg: item.isVeg === true || item.isVeg === "true" || item.isVeg === "on",
    };
  });
}

function mergeCartItems(baseItems, incomingItems) {
  var merged = normalizeCartItems(baseItems);

  normalizeCartItems(incomingItems).forEach(function (incoming) {
    if (!incoming.dishName || !Number.isFinite(incoming.price)) return;
    var existing = merged.find(function (item) {
      return (
        (incoming.dishId && item.dishId === incoming.dishId) ||
        (!incoming.dishId &&
          item.restaurantId === incoming.restaurantId &&
          item.dishName === incoming.dishName)
      );
    });

    if (existing) {
      existing.qty += incoming.qty;
      existing.price = incoming.price;
      existing.imageUrl = incoming.imageUrl || existing.imageUrl;
      existing.restaurantName = incoming.restaurantName || existing.restaurantName;
      existing.isVeg = incoming.isVeg;
    } else {
      merged.push(incoming);
    }
  });

  return merged;
}

function addToCart(entry) {
  var cart = getCart();
  var i = cart.findIndex(function (x) {
    return (
      x.restaurantId === entry.restaurantId &&
      x.dishName === entry.dishName &&
      (x.dishId || "") === (entry.dishId || "")
    );
  });
  if (i >= 0) cart[i].qty += entry.qty || 1;
  else cart.push({ ...entry, qty: entry.qty || 1 });
  saveCart(cart);
}

function removeFromCart(restaurantId, dishName, dishId) {
  saveCart(
    getCart().filter(function (x) {
      return !(
        x.restaurantId === restaurantId &&
        x.dishName === dishName &&
        (dishId == null || (x.dishId || "") === dishId)
      );
    })
  );
}

function clearCart() {
  saveCart([]);
}

function cartCount() {
  return getCart().reduce(function (s, x) {
    return s + x.qty;
  }, 0);
}

function cartTotal() {
  return getCart().reduce(function (s, x) {
    return s + x.qty * x.price;
  }, 0);
}

async function syncCartToServer() {
  if (typeof getToken !== "function" || typeof api !== "function" || !getToken()) {
    return getCart();
  }

  if (syncPromise) return syncPromise;

  syncPromise = (async function () {
    try {
      var data = await api("/cart/sync", {
        method: "POST",
        body: JSON.stringify({ items: getCart() }),
      });
      var mergedItems = normalizeCartItems((data.cart && data.cart.items) || []);
      setLocalCart(mergedItems);
      return mergedItems;
    } catch {
      return getCart();
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

async function hydrateCartFromServer() {
  if (typeof getToken !== "function" || typeof api !== "function" || !getToken()) {
    return getCart();
  }

  try {
    var localItems = getCart();
    var remote = await api("/cart");
    var remoteItems = normalizeCartItems((remote.cart && remote.cart.items) || []);
    var mergedItems = mergeCartItems(remoteItems, localItems);
    setLocalCart(mergedItems);
    await api("/cart/sync", {
      method: "POST",
      body: JSON.stringify({ items: mergedItems }),
    });
    return mergedItems;
  } catch {
    return getCart();
  }
}

window.cartStore = {
  getCart,
  saveCart,
  addToCart,
  removeFromCart,
  clearCart,
  cartCount,
  cartTotal,
  syncCartToServer,
  hydrateCartFromServer,
};

window.addEventListener("storage", function (event) {
  if (event.key === CART_KEY) {
    window.dispatchEvent(new Event("cart-updated"));
  }
});
