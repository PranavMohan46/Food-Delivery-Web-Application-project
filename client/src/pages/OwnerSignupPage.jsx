import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../api";

export default function OwnerSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ownerName: "",
    email: "",
    password: "",
    restaurantName: "",
    cuisine: "",
    deliveryMins: "",
    priceForOne: "",
    offerText: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setIsError(false);
    setMessage("");

    try {
      const data = await api("/auth/register-restaurant", {
        method: "POST",
        body: JSON.stringify({
          ownerName: form.ownerName.trim(),
          email: form.email.trim(),
          password: form.password,
          restaurantName: form.restaurantName.trim(),
          cuisine: form.cuisine.trim(),
          deliveryMins: form.deliveryMins.trim(),
          priceForOne: form.priceForOne,
          offerText: form.offerText.trim(),
        }),
      });

      setToken(data.token);
      localStorage.setItem("userRole", "restaurant_owner");
      setMessage("Restaurant created. Opening dashboard...");
      navigate("/owner", { replace: true });
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="auth-shell">
      <section className="auth-grid">
        <div className="auth-side">
          <div className="hero-panel dark">
            <div className="hero-panel-inner">
              <p className="auth-kicker">Restaurant partner onboarding</p>
              <h1 className="page-headline">Launch your restaurant and start managing orders from one dashboard.</h1>
              <p className="auth-copy">
                Create your partner account, publish your listing, and then manage dishes, pricing, and analytics from the React owner panel.
              </p>
              <div className="metric-row">
                <div className="metric-pill">Menu management</div>
                <div className="metric-pill">Order analytics</div>
                <div className="metric-pill">Listing updates</div>
              </div>
            </div>
          </div>

          <div className="surface-panel">
            <div className="auth-bullets">
              <div className="auth-bullet">
                <div className="auth-bullet-mark">1</div>
                <div>
                  <strong>Create the partner account</strong>
                  <div className="lead">We will generate your restaurant profile with starter delivery details.</div>
                </div>
              </div>
              <div className="auth-bullet">
                <div className="auth-bullet-mark">2</div>
                <div>
                  <strong>Finish setup in the dashboard</strong>
                  <div className="lead">Add dishes, upload images, and tune your storefront after signup.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="auth-panel">
          <p className="auth-kicker">Partner registration</p>
          <h2>Register your restaurant</h2>
          <p className="auth-copy">Add the core details now. You can refine menu items and visuals after account creation.</p>
          {message ? <div className={`msg ${isError ? "error" : "ok"}`}>{message}</div> : null}
          <form className="auth-form" onSubmit={onSubmit}>
            <div>
              <label htmlFor="owner-name">Your name</label>
              <input
                id="owner-name"
                required
                placeholder="Owner full name"
                value={form.ownerName}
                onChange={(event) => updateField("ownerName", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="owner-email">Email</label>
              <input
                id="owner-email"
                type="email"
                required
                autoComplete="email"
                placeholder="partner@example.com"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="owner-password">Password</label>
              <input
                id="owner-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="restaurant-name">Restaurant name</label>
              <input
                id="restaurant-name"
                required
                placeholder="As shown to customers"
                value={form.restaurantName}
                onChange={(event) => updateField("restaurantName", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="restaurant-cuisine">Cuisine</label>
              <input
                id="restaurant-cuisine"
                placeholder="South Indian, Chinese, Multi-cuisine"
                value={form.cuisine}
                onChange={(event) => updateField("cuisine", event.target.value)}
              />
            </div>
            <div className="partner-form-grid">
              <div>
                <label htmlFor="delivery-mins">Delivery time</label>
                <input
                  id="delivery-mins"
                  placeholder="25-35 mins"
                  value={form.deliveryMins}
                  onChange={(event) => updateField("deliveryMins", event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="price-for-one">Price for one</label>
                <input
                  id="price-for-one"
                  type="number"
                  min="50"
                  placeholder="250"
                  value={form.priceForOne}
                  onChange={(event) => updateField("priceForOne", event.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="offer-text">Offer line</label>
              <input
                id="offer-text"
                placeholder="Flat 20% off first order"
                value={form.offerText}
                onChange={(event) => updateField("offerText", event.target.value)}
              />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating partner account..." : "Create partner account"}
            </button>
          </form>
          <p className="link-row">
            Already registered? <Link to="/login">Log in</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
