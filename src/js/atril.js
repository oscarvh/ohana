(function () {
  var FAV_KEY = "ohana:favoritos";

  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }
  function setFavs(v) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(v)); } catch (e) {}
  }

  // Tamaño de letra
  var stream = document.getElementById("lyrics-stream");
  var sizes = ["1rem", "1.15rem", "1.35rem", "1.5rem"];
  var lines = ["1.7rem", "2rem", "2.25rem", "2.5rem"];
  var idx = 1;
  function applyFont() {
    if (!stream) return;
    stream.style.fontSize = sizes[idx];
    stream.style.lineHeight = lines[idx];
  }
  var inc = document.getElementById("font-increase");
  var dec = document.getElementById("font-decrease");
  if (inc) inc.addEventListener("click", function () { if (idx < sizes.length - 1) { idx++; applyFont(); } });
  if (dec) dec.addEventListener("click", function () { if (idx > 0) { idx--; applyFont(); } });
  applyFont();

  // Mantener pantalla encendida
  var wakeBtn = document.getElementById("btn-keep-awake");
  var wakeText = document.getElementById("screen-status-text");
  var wakeLock = null;
  var wakeActive = false;
  function updateWake() {
    if (!wakeBtn || !wakeText) return;
    if (wakeActive) {
      wakeBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-container text-on-primary text-label-md shadow-sm active:scale-95 transition-all";
      wakeText.textContent = "Pantalla activa";
    } else {
      wakeBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-outline text-label-md shadow-sm active:scale-95 transition-all";
      wakeText.textContent = "Ahorro batería";
    }
  }
  function enableWake() {
    if (!("wakeLock" in navigator)) { updateWake(); return; }
    navigator.wakeLock.request("screen").then(function (lock) {
      wakeLock = lock;
      wakeActive = true;
      updateWake();
    }).catch(function () { wakeActive = false; updateWake(); });
  }
  function disableWake() {
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
    wakeActive = false;
    updateWake();
  }
  if (wakeBtn) wakeBtn.addEventListener("click", function () { wakeActive ? disableWake() : enableWake(); });

  // Favorito
  var favBtn = document.getElementById("btn-fav");
  var favIcon = document.getElementById("fav-icon");
  if (favBtn) {
    var url = favBtn.dataset.url;
    var active = getFavs().indexOf(url) !== -1;
    var paint = function () {
      if (favIcon) favIcon.style.fontVariationSettings = active ? "'FILL' 1" : "'FILL' 0";
      favBtn.classList.toggle("text-secondary", active);
      favBtn.classList.toggle("text-primary", !active);
    };
    paint();
    favBtn.addEventListener("click", function () {
      active = !active;
      var list = getFavs();
      var i = list.indexOf(url);
      if (active && i === -1) list.push(url);
      if (!active && i !== -1) list.splice(i, 1);
      setFavs(list);
      paint();
    });
  }

  // Compartir
  var shareBtn = document.getElementById("btn-share");
  if (shareBtn) shareBtn.addEventListener("click", function () {
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  });

  // Anterior / Siguiente
  var nav = document.getElementById("song-nav");
  if (nav) {
    var songs = [];
    try { songs = JSON.parse(nav.textContent); } catch (e) {}
    if (songs.length) {
      var current = songs.findIndex(function (s) { return s.url === window.location.pathname; });
      if (current === -1) current = 0;
      var go = function (i) { window.location.href = songs[i].url; };
      var nextBtn = document.getElementById("nav-next");
      var prevBtn = document.getElementById("nav-prev");
      if (nextBtn) nextBtn.addEventListener("click", function () { go((current + 1) % songs.length); });
      if (prevBtn) prevBtn.addEventListener("click", function () { go((current - 1 + songs.length) % songs.length); });
    }
  }
})();
