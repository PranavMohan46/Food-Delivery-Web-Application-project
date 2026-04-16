import React, { useEffect, useState } from "react";
import { api } from "../api";

function cartTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
}

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCart() {
      try {
        const data = await api("/cart");
        if (!ignore) setCart(data.cart);
      } catch (err) {
        if (!ignore) setMessage(err.message || "Could not load cart");
      }
    }

    loadCart();
    return () => {
      ignore = true;
    };
  }, []);

  async function placeOrder() {
    if (!cart?.items?.length) return;

    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
            dishName: item.dishName,
            qty: item.qty,
            price: item.price,
          })),
          address,
          phone,
          total: cartTotal(cart.items),
        }),
      });

      const cleared = await api("/cart", { method: "DELETE" });
      setCart(cleared.cart);
      setAddress("");
      setPhone("");
      setMessage("Order placed successfully.");
    } catch (err) {
      setMessage(err.message || "Could not place order");
    }
  }

  if (!cart?.items?.length) {
    return <h2>{message || "Cart is empty"}</h2>;
  }

  return (
    <main className="owner-dashboard">
      <section className="owner-card">
        <h2>Your Cart</h2>
        {message ? <p>{message}</p> : null}

        {cart.items.map((item, index) => (
          <p key={item.dishId || index}>
            {item.dishName} - Rs. {item.price} x {item.qty}
          </p>
        ))}

        <h3>Total: Rs. {cartTotal(cart.items)}</h3>

        <input
          type="text"
          placeholder="Delivery address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <input
          type="text"
          placeholder="Phone number"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <button onClick={placeOrder} disabled={!address.trim() || !phone.trim()}>
          Checkout
        </button>
      </section>
    </main>
  );
}
