import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMsg("");
    setIsError(false);

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      setToken(data.token);
      const role = data.user.role || "customer";
      localStorage.setItem("userRole", role);
      setMsg("Logged in. Redirecting...");
      navigate(role === "restaurant_owner" ? "/owner" : "/home", { replace: true });
    } catch (error) {
      setIsError(true);
      setMsg(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-grid">
        <div className="auth-side">
          <div className="hero-panel dark">
            <div className="hero-panel-inner">
              <p className="auth-kicker">Campus delivery, simplified</p>
              <h1 className="page-headline">Your next meal is already nearby.</h1>
              <p className="auth-copy">
                Log in to reorder favorites, keep your cart synced, and manage delivery details in one place.
              </p>
              <div className="metric-row">
                <div className="metric-pill">Fast checkout</div>
                <div className="metric-pill">Saved order history</div>
                <div className="metric-pill">Cleaner profile flow</div>
              </div>
            </div>
          </div>

          <div className="surface-panel">
            <div className="auth-bullets">
              <div className="auth-bullet">
                <div className="auth-bullet-mark">1</div>
                <div>
                  <strong>Browse first</strong>
                  <div className="lead">You can still explore menus before signing in.</div>
                </div>
              </div>
              <div className="auth-bullet">
                <div className="auth-bullet-mark">2</div>
                <div>
                  <strong>Restaurant owner?</strong>
                  <div className="lead">
                    Use the same login and you will be taken to your dashboard automatically, or{" "}
                    <Link to="/partner/signup">create a new partner account</Link>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="auth-panel">
          <p className="auth-kicker">Customer login</p>
          <h2>Welcome back</h2>
          <p className="auth-copy">Use your account to manage orders, profile details, and faster checkout.</p>
          {msg ? <div className={`msg ${isError ? "error" : "ok"}`}>{msg}</div> : null}
          <form className="auth-form" onSubmit={onSubmit}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          <p className="link-row">
            New here? <Link to="/signup">Create an account</Link>
          </p>
          <p className="link-row compact">
            <Link to="/home">Continue as guest</Link>
          </p>
          <p className="link-row compact">
            <Link to="/partner/signup">Register as a restaurant partner</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
