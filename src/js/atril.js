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
  var sizes = ["1rem", "1.2rem", "1.4rem", "1.6rem", "1.85rem", "2.1rem", "2.4rem"];
  var lines = ["1.7rem", "2rem", "2.35rem", "2.7rem", "3.1rem", "3.5rem", "4rem"];
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

  // Modo letra + pantalla completa (mantiene la pantalla encendida mientras dura)
  var fsBtn = document.getElementById("btn-fullscreen");
  var fsText = document.getElementById("fullscreen-status-text");
  var fsIcon = document.getElementById("fullscreen-icon");
  var wakeLock = null;
  var modoActivo = false;

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
  function pintarBoton(activo) {
    if (fsText) fsText.textContent = activo ? "Salir pantalla" : "Pantalla completa";
    if (fsIcon) fsIcon.textContent = activo ? "fullscreen_exit" : "fullscreen";
    if (fsBtn) {
      fsBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md shadow-sm active:scale-95 transition-all " +
        (activo ? "bg-primary-container text-on-primary" : "bg-surface-container text-outline");
    }
  }
  function setModo(activo) {
    modoActivo = activo;
    document.documentElement.classList.toggle("modo-letra", activo);
    if (document.body) document.body.classList.toggle("modo-letra", activo);
    if (activo) window.scrollTo(0, 0);
    pintarBoton(activo);
    if (activo) requestWake();
    else if (!document.fullscreenElement) releaseWake();
  }

  if (fsBtn) {
    if (document.documentElement.requestFullscreen) {
      fsBtn.addEventListener("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(function () {});
        } else if (modoActivo) {
          setModo(false);
        } else {
          document.documentElement.requestFullscreen().catch(function () { setModo(true); });
        }
      });
      document.addEventListener("fullscreenchange", function () {
        setModo(!!document.fullscreenElement);
      });
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden && (modoActivo || document.fullscreenElement)) requestWake();
      });
    } else {
      // Sin fullscreen (p. ej. iPhone): modo lectura sin fullscreen nativo
      fsBtn.addEventListener("click", function () {
        if (modoActivo) {
          setModo(false);
        } else {
          requestWake();
          setModo(true);
        }
      });
    }
    pintarBoton(false);
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
