import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../api";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setIsError(false);
    setMessage("");

    try {
      const data = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      setToken(data.token);
      localStorage.setItem("userRole", "customer");
      setMessage("Account created. Redirecting...");
      navigate("/home", { replace: true });
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-grid">
        <div className="auth-side">
          <div className="hero-panel warm">
            <div className="hero-panel-inner">
              <p className="auth-kicker">Create your Clover account</p>
              <h1 className="page-headline">One profile for faster checkout, saved preferences, and cleaner reorders.</h1>
              <p className="auth-copy">
                Set up once, then keep delivery details, your cart, and order history in one place.
              </p>
            </div>
          </div>

          <div className="surface-panel">
            <div className="auth-bullets">
              <div className="auth-bullet">
                <div className="auth-bullet-mark">A</div>
                <div>
                  <strong>Track every order</strong>
                  <div className="lead">Your recent deliveries stay attached to your account.</div>
                </div>
              </div>
              <div className="auth-bullet">
                <div className="auth-bullet-mark">B</div>
                <div>
                  <strong>Guest-friendly by default</strong>
                  <div className="lead">You can still browse first and sign up when you are ready.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="auth-panel">
          <p className="auth-kicker">Customer registration</p>
          <h2>Create account</h2>
          <p className="auth-copy">A few details and you are ready to order in a much smoother flow.</p>
          {message ? <div className={`msg ${isError ? "error" : "ok"}`}>{message}</div> : null}
          <form className="auth-form" onSubmit={onSubmit}>
            <div>
              <label htmlFor="signup-name">Full name</label>
              <input
                id="signup-name"
                required
                placeholder="Your full name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="link-row">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
