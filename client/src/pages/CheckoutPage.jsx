import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getToken } from "../api";
import { clearCart, getCartTotal, loadCart, removeCartItem, updateCartItemQty } from "../cart";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [cartMode, setCartMode] = useState("guest");
  const [form, setForm] = useState({ phone: "", address: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function hydrateCart() {
      try {
        const result = await loadCart();
        if (ignore) return;
        setItems(result.items || []);
        setCartMode(result.mode || "guest");
      } catch (error) {
        if (!ignore) {
          setIsError(true);
          setMessage(error.message || "Could not load cart");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    hydrateCart();
    return () => {
      ignore = true;
    };
  }, []);

  async function changeQty(item, qty) {
    try {
      const result = await updateCartItemQty(item, qty);
      setItems(result.items || []);
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Could not update cart");
    }
  }

  async function removeItem(item) {
    try {
      const result = await removeCartItem(item);
      setItems(result.items || []);
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Could not remove item");
    }
  }

  async function placeOrder() {
    setIsError(false);
    setMessage("");

    if (!/^\d{10}$/.test(form.phone.trim())) {
      setIsError(true);
      setMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!form.address.trim()) {
      setIsError(true);
      setMessage("Address is required.");
      return;
    }

    if (items.length === 0) {
      setIsError(true);
      setMessage("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      if (!getToken()) {
        await clearCart();
        setItems([]);
        setMessage("Guest order saved locally for demo. Sign in to keep full order history.");
        return;
      }

      const totalAmount = getCartTotal(items);

      // Step 1: Fetch Razorpay public key
      const { key } = await api("/payment/key");

      // Step 2: Create a Razorpay order on the backend
      const razorpayOrder = await api("/payment/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: totalAmount }),
      });

      // Step 3: Open Razorpay checkout popup
      const paymentResult = await new Promise((resolve, reject) => {
        const options = {
          key: key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Clover Food",
          description: "Food Order Payment",
          order_id: razorpayOrder.id,
          handler: function (response) {
            resolve(response);
          },
          modal: {
            ondismiss: function () {
              reject(new Error("Payment cancelled by user."));
            },
          },
          prefill: {
            contact: form.phone.trim(),
          },
          theme: {
            color: "#22c55e",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          reject(new Error(response.error.description || "Payment failed"));
        });
        rzp.open();
      });

      // Step 4: Verify payment on backend
      const verification = await api("/payment/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
        }),
      });

      if (!verification.verified) {
        throw new Error("Payment verification failed. Please contact support.");
      }

      // Step 5: Save order with payment info
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((item) => ({
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
            dishName: item.dishName,
            qty: item.qty,
            price: item.price,
          })),
          address: form.address.trim(),
          phone: form.phone.trim(),
          total: totalAmount,
          paymentId: paymentResult.razorpay_payment_id,
          paymentStatus: "paid",
        }),
      });
      await clearCart();
      setItems([]);
      setMessage("Payment successful! Order placed.");
      setTimeout(() => navigate("/profile"), 1200);
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Could not place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="checkout-page">
      <section className="checkout-summary-card">
        <div className="section-heading">
          <h1>Checkout</h1>
          <p>{cartMode === "account" ? "Synced to your account" : "Guest cart"}</p>
        </div>

        {message ? <div className={`msg ${isError ? "error" : "ok"}`}>{message}</div> : null}

        {loading ? <div className="empty-state">Loading your cart...</div> : null}

        {!loading ? (
          items.length > 0 ? (
            <div className="checkout-layout">
              <div className="cart-lines">
                {items.map((item) => (
                  <article className="checkout-line-card" key={`${item.restaurantId}-${item.dishId || item.dishName}`}>
                    <div>
                      <strong>{item.dishName}</strong>
                      <p>{item.restaurantName}</p>
                    </div>
                    <div className="checkout-line-actions">
                      <div className="qty-row">
                        <button type="button" className="qty-btn" onClick={() => changeQty(item, item.qty - 1)}>
                          -
                        </button>
                        <span>{item.qty}</span>
                        <button type="button" className="qty-btn" onClick={() => changeQty(item, item.qty + 1)}>
                          +
                        </button>
                      </div>
                      <strong>Rs. {item.qty * item.price}</strong>
                      <button type="button" className="text-btn" onClick={() => removeItem(item)}>
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="delivery-form-card">
                <h2>Delivery details</h2>
                <label htmlFor="checkout-phone">Mobile number</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={form.phone}
                  placeholder="9876543210"
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
                <label htmlFor="checkout-address">Full address</label>
                <textarea
                  id="checkout-address"
                  rows="4"
                  value={form.address}
                  placeholder="Hostel or flat, landmark, campus area"
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                />
                <div className="total-row">
                  <span>Total</span>
                  <strong>Rs. {getCartTotal(items)}</strong>
                </div>
                <button type="button" className="btn" disabled={submitting} onClick={placeOrder}>
                  {submitting ? "Processing payment..." : "Pay & Place Order"}
                </button>
                <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.5rem", textAlign: "center" }}>
                  Powered by Razorpay · Secure Payment
                </p>
                {!getToken() ? (
                  <p className="link-row">
                    <Link to="/login">Log in</Link> to save your order history to your account.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Your cart is empty. <Link to="/home">Browse restaurants</Link>.
            </div>
          )
        ) : null}
      </section>
    </main>
  );
}
