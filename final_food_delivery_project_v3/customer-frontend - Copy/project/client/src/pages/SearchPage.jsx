import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const quickSearches = ["breakfast", "coffee", "dosa", "biryani"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function runSearch() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        const data = await api(`/restaurants?${params.toString()}`);
        if (!ignore) setRestaurants(data.restaurants || []);
      } catch (searchError) {
        if (!ignore) setError(searchError.message || "Search failed");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    const timer = setTimeout(runSearch, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <main className="search-page">
      <section className="search-hero-card">
        <p className="auth-kicker">Think it, search it</p>
        <h1>Find a restaurant or dish faster.</h1>
        <div className="search-box search-box-large">
          <span aria-hidden="true">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Restaurant name or a dish..."
            autoFocus
          />
        </div>
        <div className="quick-row">
          {quickSearches.map((item) => (
            <button key={item} type="button" className="chip-button" onClick={() => setQuery(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="search-results">
        <div className="section-heading">
          <h2>Results</h2>
          <p>{query.trim() ? `Showing matches for "${query.trim()}"` : "Popular places around campus"}</p>
        </div>

        {loading ? <div className="empty-state">Searching...</div> : null}
        {error ? <div className="empty-state">{error}</div> : null}

        {!loading && !error ? (
          restaurants.length > 0 ? (
            <div className="search-result-list">
              {restaurants.map((restaurant) => (
                <Link
                  className="search-result-card"
                  key={restaurant._id}
                  to={`/restaurant/${encodeURIComponent(restaurant._id)}`}
                >
                  <div>
                    <strong>{restaurant.name}</strong>
                    <p>{restaurant.cuisine}</p>
                  </div>
                  <span>
                    {Number(restaurant.rating || 0).toFixed(1)} | {restaurant.deliveryMins}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">No matches yet. Try another keyword.</div>
          )
        ) : null}
      </section>
    </main>
  );
}
