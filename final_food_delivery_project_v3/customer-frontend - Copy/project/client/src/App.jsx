import React from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OwnerSignupPage from "./pages/OwnerSignupPage";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import RestaurantPage from "./pages/RestaurantPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProfilePage from "./pages/ProfilePage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import { useCartCount } from "./cart";

function Shell({ children }) {
  const location = useLocation();
  const cartCount = useCartCount();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const isOwnerPage = location.pathname === "/owner";
  const navClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <div className="app-shell">
      <header className={`app-header ${isAuthPage ? "auth-header" : ""}`}>
        <div className="app-header-inner">
          <NavLink className="brand brand-link" to="/home">
            Clover <span>Food</span>
          </NavLink>

          {!isAuthPage ? (
            <nav className="react-nav" aria-label="Primary">
              <NavLink to="/home" className={navClass}>Home</NavLink>
              <NavLink to="/search" className={navClass}>Search</NavLink>
              <NavLink
                to="/checkout"
                className={({ isActive }) => `${isActive ? "active " : ""}cart-link`.trim()}
              >
                Cart
                {cartCount > 0 ? <span className="badge">{cartCount}</span> : null}
              </NavLink>
              <NavLink to="/profile" className={navClass}>Profile</NavLink>
              <NavLink to="/owner" className={navClass}>Owner</NavLink>
            </nav>
          ) : (
            <nav className="react-nav" aria-label="Auth">
              <NavLink to="/login" className={navClass}>Login</NavLink>
              <NavLink to="/signup" className={navClass}>Sign up</NavLink>
            </nav>
          )}
        </div>
      </header>

      <div className={isOwnerPage ? "" : "app-content"}>{children}</div>

      {!isAuthPage && !isOwnerPage ? (
        <nav className="mobile-nav" aria-label="Mobile">
          <NavLink to="/home" className={navClass}>Home</NavLink>
          <NavLink to="/search" className={navClass}>Search</NavLink>
          <NavLink to="/checkout" className={navClass}>Cart</NavLink>
          <NavLink to="/profile" className={navClass}>Profile</NavLink>
        </nav>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/partner/signup" element={<OwnerSignupPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/restaurant" element={<RestaurantPage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/owner" element={<OwnerDashboardPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Shell>
  );
}
