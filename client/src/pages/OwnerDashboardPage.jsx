import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getToken, setToken } from "../api";

function emptyDishForm() {
  return {
    id: "",
    name: "",
    price: "",
    isVeg: true,
    image: null,
  };
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDish, setSavingDish] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [dishMsg, setDishMsg] = useState("");
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: "",
    cuisine: "",
    deliveryMins: "",
    priceForOne: "",
    offerText: "",
    isPureVeg: false,
    cover: null,
  });
  const [dishForm, setDishForm] = useState(emptyDishForm());

  useEffect(() => {
    let ignore = false;

    async function loadOwnerDashboard() {
      if (!getToken()) {
        navigate("/login", { replace: true });
        return;
      }

      setLoading(true);
      setError("");
      try {
        const me = await api("/auth/me");
        if (!me.user || me.user.role !== "restaurant_owner") {
          throw new Error("Restaurant owner access only");
        }
        const data = await api("/owner/restaurant");
        const analyticsData = await api("/owner/analytics");
        if (ignore) return;
        setRestaurant(data.restaurant);
        setAnalytics(analyticsData.analytics);
        setProfileForm({
          name: data.restaurant.name || "",
          cuisine: data.restaurant.cuisine || "",
          deliveryMins: data.restaurant.deliveryMins || "",
          priceForOne: data.restaurant.priceForOne ?? "",
          offerText: data.restaurant.offerText || "",
          isPureVeg: !!data.restaurant.isPureVeg,
          cover: null,
        });
      } catch (err) {
        if (ignore) return;
        setError(err.message || "Could not load owner dashboard");
        if (err.status === 401 || err.status === 403) {
          setToken(null);
          localStorage.removeItem("userRole");
          navigate("/login", { replace: true });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadOwnerDashboard();
    return () => {
      ignore = true;
    };
  }, [navigate]);

  function syncRestaurant(nextRestaurant) {
    setRestaurant(nextRestaurant);
    setProfileForm((current) => ({
      ...current,
      name: nextRestaurant.name || "",
      cuisine: nextRestaurant.cuisine || "",
      deliveryMins: nextRestaurant.deliveryMins || "",
      priceForOne: nextRestaurant.priceForOne ?? "",
      offerText: nextRestaurant.offerText || "",
      isPureVeg: !!nextRestaurant.isPureVeg,
      cover: null,
    }));
  }

  async function onSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    setError("");
    try {
      const form = new FormData();
      form.append("name", profileForm.name.trim());
      form.append("cuisine", profileForm.cuisine.trim());
      form.append("deliveryMins", profileForm.deliveryMins.trim());
      form.append("priceForOne", profileForm.priceForOne);
      form.append("offerText", profileForm.offerText.trim());
      form.append("isPureVeg", profileForm.isPureVeg ? "true" : "false");
      if (profileForm.cover) form.append("cover", profileForm.cover);

      const data = await api("/owner/restaurant", {
        method: "PATCH",
        body: form,
      });
      syncRestaurant(data.restaurant);
      setProfileMsg("Profile saved.");
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  function startEditingDish(dish) {
    setDishMsg("");
    setDishForm({
      id: dish._id,
      name: dish.name || "",
      price: dish.price ?? "",
      isVeg: !!dish.isVeg,
      image: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDishForm() {
    setDishForm(emptyDishForm());
  }

  async function onSaveDish(e) {
    e.preventDefault();
    setSavingDish(true);
    setDishMsg("");
    setError("");
    try {
      const form = new FormData();
      form.append("name", dishForm.name.trim());
      form.append("price", dishForm.price);
      form.append("isVeg", dishForm.isVeg ? "true" : "false");
      if (dishForm.image) form.append("image", dishForm.image);

      const path = dishForm.id ? `/owner/dishes/${encodeURIComponent(dishForm.id)}` : "/owner/dishes";
      const method = dishForm.id ? "PATCH" : "POST";
      const data = await api(path, { method, body: form });
      syncRestaurant(data.restaurant);
      setDishMsg(dishForm.id ? "Dish updated." : "Dish added.");
      resetDishForm();
    } catch (err) {
      setError(err.message || "Could not save dish");
    } finally {
      setSavingDish(false);
    }
  }

  async function onDeleteDish(dishId) {
    setDishMsg("");
    setError("");
    try {
      const data = await api(`/owner/dishes/${encodeURIComponent(dishId)}`, {
        method: "DELETE",
      });
      syncRestaurant(data.restaurant);
      setDishMsg("Dish removed.");
      if (dishForm.id === dishId) resetDishForm();
    } catch (err) {
      setError(err.message || "Could not delete dish");
    }
  }

  function onLogout() {
    setToken(null);
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  }

  if (loading) {
    return <main className="owner-dashboard"><p className="empty-state">Loading owner dashboard...</p></main>;
  }

  if (!restaurant) {
    return <main className="owner-dashboard"><p className="empty-state">{error || "Owner dashboard unavailable."}</p></main>;
  }

  return (
    <main className="owner-dashboard">
      <section className="owner-hero">
        <div>
          <p className="owner-kicker">Restaurant dashboard</p>
          <h1>{restaurant.name}</h1>
          <p className="owner-subtitle">
            Manage your listing, update your menu, and keep your restaurant page fresh.
          </p>
        </div>
        <div className="owner-hero-actions">
          <Link className="btn btn-outline owner-link-btn" to="/home">
            Customer view
          </Link>
          <Link
            className="btn btn-ghost owner-link-btn"
            to={`/restaurant/${encodeURIComponent(restaurant._id)}`}
          >
            Preview listing
          </Link>
          <button type="button" className="btn owner-link-btn" onClick={onLogout}>
            Log out
          </button>
        </div>
      </section>

      {error ? <div className="msg error">{error}</div> : null}

      {analytics ? (
        <section className="owner-analytics">
          <article className="owner-stat-card">
            <span>Total orders</span>
            <strong>{analytics.totalOrders}</strong>
          </article>
          <article className="owner-stat-card">
            <span>Total revenue</span>
            <strong>Rs. {analytics.totalRevenue}</strong>
          </article>
          <article className="owner-stat-card">
            <span>Average order</span>
            <strong>Rs. {analytics.averageOrderValue}</strong>
          </article>
          <article className="owner-stat-card">
            <span>Menu items</span>
            <strong>{analytics.activeMenuItems}</strong>
          </article>
        </section>
      ) : null}

      <div className="owner-grid">
        <section className="owner-card">
          <h2>Restaurant profile</h2>
          {profileMsg ? <div className="msg ok">{profileMsg}</div> : null}
          <form className="owner-form" onSubmit={onSaveProfile}>
            <label htmlFor="owner-name">Restaurant name</label>
            <input
              id="owner-name"
              value={profileForm.name}
              onChange={(e) => setProfileForm((current) => ({ ...current, name: e.target.value }))}
              required
            />

            <label htmlFor="owner-cuisine">Cuisine</label>
            <input
              id="owner-cuisine"
              value={profileForm.cuisine}
              onChange={(e) => setProfileForm((current) => ({ ...current, cuisine: e.target.value }))}
              required
            />

            <label htmlFor="owner-delivery">Delivery time</label>
            <input
              id="owner-delivery"
              value={profileForm.deliveryMins}
              onChange={(e) => setProfileForm((current) => ({ ...current, deliveryMins: e.target.value }))}
            />

            <label htmlFor="owner-price">Price for one</label>
            <input
              id="owner-price"
              type="number"
              min="1"
              value={profileForm.priceForOne}
              onChange={(e) => setProfileForm((current) => ({ ...current, priceForOne: e.target.value }))}
            />

            <label htmlFor="owner-offer">Offer text</label>
            <input
              id="owner-offer"
              value={profileForm.offerText}
              onChange={(e) => setProfileForm((current) => ({ ...current, offerText: e.target.value }))}
            />

            <label htmlFor="owner-cover">Cover image</label>
            <input
              id="owner-cover"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setProfileForm((current) => ({
                  ...current,
                  cover: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                }))
              }
            />

            <label className="owner-check">
              <input
                type="checkbox"
                checked={profileForm.isPureVeg}
                onChange={(e) => setProfileForm((current) => ({ ...current, isPureVeg: e.target.checked }))}
              />
              Mark restaurant as pure veg
            </label>

            <button type="submit" className="btn" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </form>
        </section>

        <section className="owner-card">
          <h2>{dishForm.id ? "Edit dish" : "Add dish"}</h2>
          {dishMsg ? <div className="msg ok">{dishMsg}</div> : null}
          <form className="owner-form" onSubmit={onSaveDish}>
            <label htmlFor="dish-name">Dish name</label>
            <input
              id="dish-name"
              value={dishForm.name}
              onChange={(e) => setDishForm((current) => ({ ...current, name: e.target.value }))}
              required
            />

            <label htmlFor="dish-price">Price</label>
            <input
              id="dish-price"
              type="number"
              min="1"
              value={dishForm.price}
              onChange={(e) => setDishForm((current) => ({ ...current, price: e.target.value }))}
              required
            />

            <label className="owner-check">
              <input
                type="checkbox"
                checked={dishForm.isVeg}
                onChange={(e) => setDishForm((current) => ({ ...current, isVeg: e.target.checked }))}
              />
              Vegetarian dish
            </label>

            <label htmlFor="dish-image">Dish image</label>
            <input
              id="dish-image"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setDishForm((current) => ({
                  ...current,
                  image: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                }))
              }
            />

            <div className="owner-form-actions">
              <button type="submit" className="btn" disabled={savingDish}>
                {savingDish ? "Saving..." : dishForm.id ? "Update dish" : "Add dish"}
              </button>
              {dishForm.id ? (
                <button type="button" className="btn btn-outline" onClick={resetDishForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>

      {analytics ? (
        <div className="owner-grid owner-insights-grid">
          <section className="owner-card">
            <div className="owner-section-header">
              <div>
                <h2>Top dishes</h2>
                <p>What customers are ordering most often</p>
              </div>
            </div>
            <div className="owner-menu-list">
              {analytics.topDishes && analytics.topDishes.length > 0 ? (
                analytics.topDishes.map((dish) => (
                  <article className="owner-insight-row" key={dish.dishName}>
                    <div>
                      <strong>{dish.dishName}</strong>
                      <p>{dish.qty} orders</p>
                    </div>
                    <strong>Rs. {dish.revenue}</strong>
                  </article>
                ))
              ) : (
                <p className="empty-state">No sales yet. Your first orders will show up here.</p>
              )}
            </div>
          </section>

          <section className="owner-card">
            <div className="owner-section-header">
              <div>
                <h2>Recent orders</h2>
                <p>Latest order activity for your restaurant</p>
              </div>
            </div>
            <div className="owner-menu-list">
              {analytics.recentOrders && analytics.recentOrders.length > 0 ? (
                analytics.recentOrders.map((order) => (
                  <article className="owner-insight-row" key={order.id}>
                    <div>
                      <strong>{new Date(order.createdAt).toLocaleString()}</strong>
                      <p>
                        {order.itemCount} items | {order.status}
                      </p>
                    </div>
                    <strong>Rs. {order.revenue}</strong>
                  </article>
                ))
              ) : (
                <p className="empty-state">No orders yet for this restaurant.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      <section className="owner-card">
        <div className="owner-section-header">
          <div>
            <h2>Menu items</h2>
            <p>{restaurant.dishes?.length || 0} dishes currently listed</p>
          </div>
        </div>
        <div className="owner-menu-list">
          {restaurant.dishes && restaurant.dishes.length > 0 ? (
            restaurant.dishes.map((dish) => (
              <article className="owner-dish-card" key={dish._id}>
                <div className="owner-dish-thumb">
                  {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} /> : <span>No image</span>}
                </div>
                <div className="owner-dish-info">
                  <h3>{dish.name}</h3>
                  <p>
                    Rs. {dish.price} | {dish.isVeg ? "Veg" : "Non-veg"}
                  </p>
                </div>
                <div className="owner-dish-actions">
                  <button type="button" className="btn btn-outline" onClick={() => startEditingDish(dish)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => onDeleteDish(dish._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">No dishes yet. Add your first menu item above.</p>
          )}
        </div>
      </section>
    </main>
  );
}
