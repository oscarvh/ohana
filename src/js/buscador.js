(function () {
  var FAV_KEY = "ohana:favoritos";

  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }
  function setFavs(v) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(v)); } catch (e) {}
  }
  function isFav(url) { return getFavs().indexOf(url) !== -1; }

  var input = document.getElementById("song-search-input");
  var clearBtn = document.getElementById("clear-search-btn");
  var list = document.getElementById("song-list");
  if (!list) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll(".song-card"));
  var chipsBox = document.getElementById("filtros");
  var emptyState = document.getElementById("empty-state");
  var query = "";
  var filter = "all";

  function paintHeart(btn, active) {
    var icon = btn.querySelector(".material-symbols-outlined");
    if (icon) icon.style.fontVariationSettings = active ? "'FILL' 1" : "'FILL' 0";
    btn.classList.toggle("text-secondary", active);
    btn.classList.toggle("text-outline", !active);
  }

  cards.forEach(function (card) {
    var btn = card.querySelector(".favorite-toggle");
    if (!btn) return;
    paintHeart(btn, isFav(btn.dataset.url));
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var favs = getFavs();
      var i = favs.indexOf(btn.dataset.url);
      if (i === -1) favs.push(btn.dataset.url); else favs.splice(i, 1);
      setFavs(favs);
      paintHeart(btn, i === -1);
      apply();
    });
  });

  var cats = [];
  cards.forEach(function (c) {
    if (c.dataset.categoria && cats.indexOf(c.dataset.categoria) === -1) cats.push(c.dataset.categoria);
  });

  function makeChip(label, value) {
    var b = document.createElement("button");
    b.type = "button";
    b.dataset.filter = value;
    b.className = "filter-chip shrink-0 h-9 px-4 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant text-label-md transition-colors";
    b.textContent = label;
    b.addEventListener("click", function () {
      filter = value;
      updateChips();
      apply();
    });
    return b;
  }

  function updateChips() {
    if (!chipsBox) return;
    Array.prototype.forEach.call(chipsBox.children, function (chip) {
      var active = chip.dataset.filter === filter;
      chip.classList.toggle("bg-primary", active);
      chip.classList.toggle("text-on-primary", active);
      chip.classList.toggle("border-primary", active);
      chip.classList.toggle("bg-surface-container-lowest", !active);
      chip.classList.toggle("text-on-surface-variant", !active);
    });
  }

  if (chipsBox) {
    chipsBox.appendChild(makeChip("Todas", "all"));
    cats.forEach(function (cat) { chipsBox.appendChild(makeChip(cat, cat)); });
    chipsBox.appendChild(makeChip("Favoritos", "__fav__"));
    if (location.hash === "#favoritos") filter = "__fav__";
    updateChips();
  }

  function apply() {
    var q = query.trim().toLowerCase();
    var visible = 0;
    cards.forEach(function (card) {
      var text = (card.dataset.titulo + " " + card.dataset.autor + " " + card.dataset.categoria).toLowerCase();
      var btn = card.querySelector(".favorite-toggle");
      var matchFilter = filter === "all" ||
        (filter === "__fav__" ? isFav(btn.dataset.url) : card.dataset.categoria === filter);
      var show = text.indexOf(q) !== -1 && matchFilter;
      card.classList.toggle("hidden", !show);
      if (show) visible++;
    });
    if (emptyState) {
      emptyState.classList.toggle("hidden", visible !== 0);
      emptyState.classList.toggle("flex", visible === 0);
    }
  }

  window.addEventListener("hashchange", function () {
    if (location.hash === "#favoritos" && chipsBox) {
      filter = "__fav__";
      updateChips();
      apply();
    }
  });

  if (input) input.addEventListener("input", function (e) { query = e.target.value; apply(); });
  if (clearBtn) clearBtn.addEventListener("click", function () {
    if (input) { input.value = ""; query = ""; apply(); input.focus(); }
  });

  apply();
})();
