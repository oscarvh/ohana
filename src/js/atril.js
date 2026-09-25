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

  // Pantalla completa (mantiene la pantalla encendida mientras dura)
  var fsBtn = document.getElementById("btn-fullscreen");
  var fsText = document.getElementById("fullscreen-status-text");
  var fsIcon = document.getElementById("fullscreen-icon");
  var wakeLock = null;

  function requestWake() {
    if (!("wakeLock" in navigator)) return Promise.resolve(null);
    return navigator.wakeLock.request("screen").then(function (lock) {
      wakeLock = lock;
      lock.addEventListener("release", function () { wakeLock = null; });
      return lock;
    }).catch(function () { wakeLock = null; return null; });
  }
  function releaseWake() {
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
  }
  function updateFullscreen() {
    var activo = document.fullscreenElement;
    if (fsText) fsText.textContent = activo ? "Salir pantalla" : "Pantalla completa";
    if (fsIcon) fsIcon.textContent = activo ? "fullscreen_exit" : "fullscreen";
    if (fsBtn) {
      fsBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md shadow-sm active:scale-95 transition-all " +
        (activo ? "bg-primary-container text-on-primary" : "bg-surface-container text-outline");
    }
    if (activo) requestWake(); else releaseWake();
  }

  if (fsBtn) {
    if (!document.documentElement.requestFullscreen) {
      // Sin fullscreen (p. ej. iPhone): el botón solo evita que la pantalla se apague
      var wakeActive = false;
      var updateWake = function () {
        wakeActive = !!wakeLock;
        if (fsText) fsText.textContent = wakeActive ? "Pantalla activa" : "Evitar apagado";
        if (fsIcon) fsIcon.textContent = wakeActive ? "screen_lock_portrait" : "mobile_off";
      };
      fsBtn.addEventListener("click", function () {
        if (wakeLock) { releaseWake(); requestWake().then(updateWake); } else { requestWake().then(updateWake); }
      });
      updateWake();
    } else {
      fsBtn.addEventListener("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(function () {});
        } else {
          document.documentElement.requestFullscreen().catch(function () {});
        }
      });
      document.addEventListener("fullscreenchange", updateFullscreen);
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden && document.fullscreenElement) requestWake();
      });
      updateFullscreen();
    }
  }

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

})();
