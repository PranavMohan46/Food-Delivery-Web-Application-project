import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const categories = [
  { key: "all", label: "All", note: "Everything nearby" },
  { key: "south", label: "South", note: "Dosa and comfort food" },
  { key: "north", label: "North", note: "Curries and thalis" },
  { key: "chinese", label: "Chinese", note: "Noodles and bowls" },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [restaurants, setRestaurants] = useState([]);
  const [visibleRestaurants, setVisibleRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadRestaurants() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (vegOnly) params.set("veg", "1");
        const data = await api(`/restaurants?${params.toString()}`);
        if (!ignore) setRestaurants(data.restaurants || []);
      } catch (loadError) {
        if (!ignore) setError(loadError.message || "Could not load restaurants");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    const timer = setTimeout(loadRestaurants, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query, vegOnly]);

  useEffect(() => {
    const nextList =
      activeCategory === "all"
        ? restaurants
        : restaurants.filter((restaurant) =>
            (restaurant.cuisine || "").toLowerCase().includes(activeCategory.toLowerCase())
          );
    setVisibleRestaurants(nextList);
  }, [activeCategory, restaurants]);

  return (
    <main className="home-page">
      <section className="hero-grid">
        <article className="home-hero-panel">
          <p className="auth-kicker">Delivery around GLA University</p>
          <h1>Restaurant browsing rebuilt as a smoother React experience.</h1>
          <p className="hero-copy">
            Search faster, jump into menus without leaving the app flow, and keep your cart connected whether
            you are a guest or logged in.
          </p>
          <div className="hero-search-row">
            <div className="search-box">
              <span aria-hidden="true">Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Restaurant name or a dish..."
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              className={`toggle-pill ${vegOnly ? "active" : ""}`}
              onClick={() => setVegOnly((current) => !current)}
            >
              {vegOnly ? "Pure veg only" : "All menus"}
            </button>
          </div>
          <div className="hero-chip-row">
            <span className="hero-chip">Fast checkout</span>
            <span className="hero-chip">Guest cart support</span>
            <span className="hero-chip">Cleaner restaurant pages</span>
          </div>
        </article>

        <article className="promo-panel">
          <p className="promo-tag">Weekly offer</p>
          <h2>Items at 50% off from selected restaurants.</h2>
          <p>Start with the best-rated places around campus and jump straight into checkout.</p>
          <Link className="btn" to="/search">
            Explore offers
          </Link>
        </article>
      </section>

      <section className="category-strip">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            className={`category-card ${activeCategory === category.key ? "active" : ""}`}
            onClick={() => setActiveCategory(category.key)}
          >
            <strong>{category.label}</strong>
            <span>{category.note}</span>
          </button>
        ))}
      </section>

      <section className="restaurant-section">
        <div className="section-heading">
          <h2>Restaurants near you</h2>
          <p>{visibleRestaurants.length} places currently match your filters</p>
        </div>

        {loading ? <div className="empty-state">Loading restaurants...</div> : null}
        {error ? <div className="empty-state">{error}</div> : null}

        {!loading && !error ? (
          visibleRestaurants.length > 0 ? (
            <div className="restaurant-grid">
              {visibleRestaurants.map((restaurant) => (
                <article className="restaurant-card" key={restaurant._id}>
                  <Link className="restaurant-link" to={`/restaurant/${encodeURIComponent(restaurant._id)}`}>
                    <div className="card-image-wrap">
                      <img src={restaurant.imageUrl} alt={restaurant.name} loading="lazy" />
                      <div className="tag-overlay">
                        {restaurant.offerText || `${restaurant.cuisine} specials`}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="card-title-row">
                        <h3>{restaurant.name}</h3>
                        <div className="rating-box">{Number(restaurant.rating || 0).toFixed(1)}</div>
                      </div>
                      <p className="card-copy">{restaurant.cuisine}</p>
                      <div className="meta-row">
                        <span>{restaurant.deliveryMins}</span>
                        <span className="sep">|</span>
                        <span>{restaurant.distanceKm} km away</span>
                        <span className="sep">|</span>
                        <span>Rs. {restaurant.priceForOne} for one</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">No restaurants match your filters right now.</div>
          )
        ) : null}
      </section>
    </main>
  );
}
