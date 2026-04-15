(function () {
  var vegSwitch = document.getElementById("veg-switch");
  var qInput = document.getElementById("q");
  var root = document.getElementById("restaurants-root");
  var empty = document.getElementById("empty");
  var countLabel = document.getElementById("count-label");
  var pureVegChip = document.getElementById("pure-veg-chip");
  var vegOnly = false;
  var categoryMap = {
    all: null,
    south: "South Indian",
    north: "North Indian",
    chinese: "Chinese",
  };
  var activeCategory = "all";

  function updateCartBadge() {
    var b = document.getElementById("cart-badge");
    var n = cartStore.cartCount();
    b.textContent = n;
    b.style.display = n > 0 ? "grid" : "none";
  }

  function toggleVeg() {
    vegOnly = !vegOnly;
    vegSwitch.classList.toggle("on", vegOnly);
    vegSwitch.setAttribute("aria-checked", vegOnly ? "true" : "false");
    pureVegChip.classList.toggle("hidden", !vegOnly);
    load();
  }

  vegSwitch.addEventListener("click", toggleVeg);
  vegSwitch.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleVeg();
    }
  });

  var debounce;
  qInput.addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(load, 300);
  });

  document.querySelectorAll(".cat-item").forEach(function (el) {
    el.addEventListener("click", function () {
      document.querySelectorAll(".cat-item").forEach(function (c) {
        c.classList.remove("active");
      });
      el.classList.add("active");
      activeCategory = el.getAttribute("data-filter") || "all";
      load();
    });
  });

  function renderCard(r) {
    var tag = r.cuisine + " • ₹" + r.priceForOne + " for one";
    var veg = r.isPureVeg ? '<span class="veg-dot yes"></span>' : "";
    return (
      '<article class="restaurant-card">' +
      '<a href="/restaurant.html?id=' +
      encodeURIComponent(r._id) +
      '" style="color:inherit;text-decoration:none">' +
      '<div class="card-image-wrap">' +
      '<img src="' +
      r.imageUrl +
      '" alt="" loading="lazy" />' +
      '<div class="tag-overlay">' +
      tag +
      "</div>" +
      '<button type="button" class="bookmark" onclick="event.preventDefault(); event.stopPropagation();">♡</button>' +
      "</div>" +
      '<div class="card-body">' +
      '<div class="card-title-row">' +
      "<h3>" +
      veg +
      r.name +
      "</h3>" +
      '<div><div class="rating-box">' +
      r.rating.toFixed(1) +
      " ★</div></div>" +
      "</div>" +
      '<div class="meta-row">' +
      "<span>⏱ " +
      r.deliveryMins +
      "</span>" +
      '<span class="sep">|</span>' +
      "<span>" +
      r.distanceKm +
      " km</span>" +
      '<span class="sep">|</span>' +
      "<span>🛵 Free</span>" +
      "</div>" +
      (r.offerText
        ? '<div class="offer-row"><span>🏷</span> ' + r.offerText + "</div>"
        : "") +
      "</div>" +
      "</a>" +
      "</article>"
    );
  }

  async function load() {
    root.innerHTML = '<p class="empty-state">Loading…</p>';
    empty.style.display = "none";
    var params = new URLSearchParams();
    var q = qInput.value.trim();
    if (q) params.set("q", q);
    if (vegOnly) params.set("veg", "1");
    var url = "/restaurants?" + params.toString();
    try {
      var data = await api(url);
      var list = data.restaurants || [];
      if (activeCategory !== "all") {
        var cname = categoryMap[activeCategory];
        list = list.filter(function (x) {
          return (x.cuisine || "").toLowerCase().indexOf(cname.split(" ")[0].toLowerCase()) >= 0;
        });
      }
      countLabel.textContent = list.length + " restaurants delivering to you";
      if (list.length === 0) {
        root.innerHTML = "";
        empty.style.display = "block";
        return;
      }
      root.innerHTML = list.map(renderCard).join("");
    } catch (e) {
      root.innerHTML = '<p class="empty-state">Could not load restaurants. Is the server running?</p>';
    }
  }

  var locModal = document.getElementById("loc-modal");
  document.getElementById("open-location").addEventListener("click", function () {
    locModal.classList.add("open");
    locModal.setAttribute("aria-hidden", "false");
  });
  document.getElementById("close-loc").addEventListener("click", function () {
    locModal.classList.remove("open");
    locModal.setAttribute("aria-hidden", "true");
  });
  locModal.addEventListener("click", function (e) {
    if (e.target === locModal) {
      locModal.classList.remove("open");
    }
  });
  document.querySelectorAll(".address-row").forEach(function (row) {
    row.addEventListener("click", function () {
      document.getElementById("loc-title").textContent = row.getAttribute("data-title");
      locModal.classList.remove("open");
    });
  });
  document.getElementById("manual-loc").addEventListener("change", function () {
    var v = this.value.trim();
    if (v) document.getElementById("loc-title").textContent = v;
  });

  window.addEventListener("cart-updated", updateCartBadge);
  cartStore.hydrateCartFromServer().finally(function () {
    updateCartBadge();
    load();
  });
})();
