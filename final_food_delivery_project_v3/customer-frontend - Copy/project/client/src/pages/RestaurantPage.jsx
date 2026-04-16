import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { addItemToCart } from "../cart";

export default function RestaurantPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const restaurantId = params.id || searchParams.get("id") || "";

  useEffect(() => {
    let ignore = false;

    async function loadRestaurant() {
      if (!restaurantId) {
        setError("Missing restaurant.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await api(`/restaurants/${encodeURIComponent(restaurantId)}`);
        if (!ignore) setRestaurant(data.restaurant);
      } catch (loadError) {
        if (!ignore) setError(loadError.message || "Could not load restaurant");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadRestaurant();
    return () => {
      ignore = true;
    };
  }, [restaurantId]);

  async function addDish(dish) {
    if (!restaurant) return;

    try {
      await addItemToCart({
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        dishId: dish._id || dish.name,
        dishName: dish.name,
        price: dish.price,
        imageUrl: dish.imageUrl || "",
        isVeg: !!dish.isVeg,
      });
      setMessage(`${dish.name} added to cart.`);
      setError("");
    } catch (cartError) {
      setError(cartError.message || "Could not add item");
    }
  }

  if (loading) {
    return <main className="menu-page"><div className="empty-state">Loading restaurant...</div></main>;
  }

  if (!restaurant) {
    return <main className="menu-page"><div className="empty-state">{error || "Restaurant not found."}</div></main>;
  }

  return (
    <main className="menu-page">
      <section className="restaurant-hero-panel">
        <div className="restaurant-hero-copy">
          <p className="auth-kicker">Restaurant menu</p>
          <h1>{restaurant.name}</h1>
          <p className="restaurant-meta-line">
            {restaurant.cuisine} | {restaurant.deliveryMins} | {Number(restaurant.rating || 0).toFixed(1)} rating
          </p>
          <p className="restaurant-subcopy">
            {restaurant.offerText || "Fresh dishes, quick delivery, and an easier add-to-cart flow."}
          </p>
          <div className="hero-chip-row">
            <span className="hero-chip">Rs. {restaurant.priceForOne} for one</span>
            <span className="hero-chip">{restaurant.distanceKm} km away</span>
            <span className="hero-chip">{restaurant.isPureVeg ? "Pure veg" : "Mixed menu"}</span>
          </div>
        </div>
        <div className="restaurant-hero-image">
          <img src={restaurant.imageUrl} alt={restaurant.name} />
        </div>
      </section>

      <section className="menu-section">
        <div className="section-heading">
          <h2>Menu</h2>
          <p>{restaurant.dishes?.length || 0} dishes available</p>
        </div>
        {message ? <div className="msg ok">{message}</div> : null}
        {error ? <div className="msg error">{error}</div> : null}

        <div className="dish-grid">
          {(restaurant.dishes || []).map((dish) => (
            <article className="dish-card" key={dish._id || dish.name}>
              <div className="dish-card-image">
                {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} /> : <span>{dish.isVeg ? "Veg" : "Chef's pick"}</span>}
              </div>
              <div className="dish-card-body">
                <div className="dish-card-title">
                  <h3>{dish.name}</h3>
                  <span className={`veg-pill ${dish.isVeg ? "veg" : "non-veg"}`}>
                    {dish.isVeg ? "Veg" : "Non-veg"}
                  </span>
                </div>
                <p>Rs. {dish.price}</p>
                <button type="button" className="btn" onClick={() => addDish(dish)}>
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="inline-actions">
        <Link className="btn btn-outline" to="/home">
          Back to home
        </Link>
        <Link className="btn" to="/checkout">
          Go to checkout
        </Link>
      </div>
    </main>
  );
}
