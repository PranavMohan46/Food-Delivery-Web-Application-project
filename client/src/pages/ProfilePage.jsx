import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getToken, setToken } from "../api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!getToken()) {
        setLoading(false);
        return;
      }

      try {
        const me = await api("/auth/me");
        if (me.user?.role === "restaurant_owner") {
          navigate("/owner", { replace: true });
          return;
        }
        const orderData = await api("/orders/my");
        if (ignore) return;
        setUser(me.user);
        setOrders(orderData.orders || []);
      } catch (profileError) {
        if (!ignore) {
          setError(profileError.message || "Could not load profile");
          setToken(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      ignore = true;
    };
  }, [navigate]);

  function logout() {
    setToken(null);
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  }

  if (loading) {
    return <main className="profile-page"><div className="empty-state">Loading profile...</div></main>;
  }

  if (!getToken() || !user) {
    return (
      <main className="profile-page">
        <section className="profile-guest-card">
          <p className="auth-kicker">Guest mode</p>
          <h1>Your profile is ready when you are.</h1>
          <p>Sign in to store orders, track repeat favorites, and keep checkout details attached to your account.</p>
          {error ? <div className="msg error">{error}</div> : null}
          <div className="inline-actions">
            <Link className="btn" to="/login">
              Log in
            </Link>
            <Link className="btn btn-outline" to="/signup">
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-header-card">
        <div className="profile-avatar">{(user.name || "?").charAt(0).toUpperCase()}</div>
        <div>
          <p className="auth-kicker">Customer profile</p>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={logout}>
          Log out
        </button>
      </section>

      <section className="profile-stats-grid">
        <article className="profile-stat-card">
          <span>Orders placed</span>
          <strong>{orders.length}</strong>
        </article>
        <article className="profile-stat-card">
          <span>Latest status</span>
          <strong>{orders[0]?.status || "No orders yet"}</strong>
        </article>
      </section>

      <section className="profile-orders-card">
        <div className="section-heading">
          <h2>Recent orders</h2>
          <p>Your latest delivery activity</p>
        </div>
        {orders.length > 0 ? (
          <div className="profile-order-list">
            {orders.slice(0, 8).map((order) => (
              <article className="profile-order-card" key={order._id}>
                <div>
                  <strong>Rs. {order.total}</strong>
                  <p>{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="order-status">{order.status || "Placed"}</span>
                  <p>{(order.items || []).map((item) => `${item.dishName} x${item.qty}`).join(", ")}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">No orders yet. Your next checkout will show up here.</div>
        )}
      </section>
    </main>
  );
}
