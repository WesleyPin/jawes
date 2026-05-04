/* =============================================
   BIRTHDAY SITE — main.js
   ============================================= */

// ─── CONFIG ─────────────────────────────────
const CONFIG = {
  secretCode: "06052026",
  startDate: new Date("2026-04-08T07:27:00+02:00"),
  timezones: {
    left:  { tz: "Europe/Paris" },
    right: { tz: "Asia/Manila"  },
  },
};

// ─── LOCK SCREEN ────────────────────────────
function checkCode() {
  const input = document.getElementById("codeInput");
  const error = document.getElementById("lockError");
  if (input.value.trim() === CONFIG.secretCode) {
    const lock = document.getElementById("lockScreen");
    lock.classList.add("hidden");
    setTimeout(() => {
      lock.remove();
      const letter = document.getElementById("letterModal");
      if (letter) letter.classList.add("visible");
    }, 650);
  } else {
    error.textContent = "Wrong code, try again ❤️";
    input.value = "";
    input.focus();
  }
}

function closeLetter() {
  const letter = document.getElementById("letterModal");
  if (letter) letter.classList.remove("visible");
}
window.closeLetter = closeLetter;
document.getElementById("codeInput").addEventListener("keydown", e => {
  if (e.key === "Enter") checkCode();
});
window.checkCode = checkCode;

// ─── PAGINATION ─────────────────────────────
const pages = Array.from(document.querySelectorAll(".page"));
const total  = pages.length;
let current  = 0;

function showPage(index) {
  pages.forEach(p => p.classList.remove("active", "exit-left"));
  pages[index].classList.add("active");
  document.getElementById("pageIndicator").textContent = `${index + 1} / ${total}`;
  document.getElementById("prevBtn").disabled = index === 0;
  document.getElementById("nextBtn").disabled = index === total - 1;
  current = index;
}

function changePage(direction) {
  const next = current + direction;
  if (next < 0 || next >= total) return;
  if (direction > 0) pages[current].classList.add("exit-left");
  setTimeout(() => showPage(next), direction > 0 ? 10 : 0);
}
window.changePage = changePage;

// Swipe support
let touchStartX = 0;
document.getElementById("bookPages").addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
document.getElementById("bookPages").addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) changePage(dx < 0 ? 1 : -1);
}, { passive: true });

// Keyboard
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") changePage(1);
  if (e.key === "ArrowLeft")  changePage(-1);
});

showPage(0);

// ─── COUNTER ────────────────────────────────
let prevVals = {};
function updateCounter() {
  const diff = new Date() - CONFIG.startDate;
  if (diff < 0) return;
  const vals = {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000)  / 60_000),
    s: Math.floor((diff % 60_000)      / 1_000),
  };
  ["d","h","m","s"].forEach(k => {
    const el  = document.getElementById("f" + k);
    const val = k === "d" ? String(vals[k]) : String(vals[k]).padStart(2, "0");
    if (val !== prevVals[k]) {
      el.classList.add("tick");
      setTimeout(() => { el.textContent = val; el.classList.remove("tick"); }, 150);
      prevVals[k] = val;
    }
  });
}


// ─── TRANSLATOR ─────────────────────────────
const tradLangs = {
  fr: { label: "🇫🇷 French",  placeholder: "Type in French…"  },
  tl: { label: "🇵🇭 Tagalog", placeholder: "Type in Tagalog…" },
};
let tradFrom = "fr", tradTo = "tl";

function swapLang() {
  [tradFrom, tradTo] = [tradTo, tradFrom];
  document.getElementById("tradFrom").textContent = tradLangs[tradFrom].label;
  document.getElementById("tradTo").textContent   = tradLangs[tradTo].label;
  document.getElementById("tradInput").placeholder = tradLangs[tradFrom].placeholder;
  document.getElementById("tradInput").value = "";
  document.getElementById("tradResult").textContent = "Translation will appear here...";
  document.getElementById("tradSwap").classList.toggle("flipped");
}
window.swapLang = swapLang;

async function doTranslate() {
  const text = document.getElementById("tradInput").value.trim();
  if (!text) return;
  const btn     = document.getElementById("tradBtn");
  const btnText = document.getElementById("tradBtnText");
  const result  = document.getElementById("tradResult");

  btn.disabled = true;
  btnText.innerHTML = '<span class="spinner"></span>';
  result.style.opacity = "0.4";

  try {
    const res  = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${tradFrom}|${tradTo}`);
    const data = await res.json();
    result.textContent = data.responseStatus === 200
      ? data.responseData.translatedText
      : "⚠️ Translation failed, try again.";
  } catch {
    result.textContent = "⚠️ No connection, try again.";
  }

  result.style.opacity = "1";
  btn.disabled  = false;
  btnText.textContent = "Translate ✨";
}
window.doTranslate = doTranslate;

document.getElementById("tradInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doTranslate(); }
});

// ─── MAP ─────────────────────────────────────
(function initMap() {
  const mapEl = document.getElementById("mapLeaflet");
  if (!mapEl || typeof L === "undefined") return;

  const map = L.map("mapLeaflet", {
    zoomSnap: 0,          // allow fractional zoom levels
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    dragging: false,
    doubleClickZoom: false,
    touchZoom: false,
    center: [30, 62],
    zoom: 1.8,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  // Great-circle arc waypoints (Paris → over Russia → Manila)
  const arcPoints = [
    [48.8566,  2.3522],
    [54,      22],
    [60,      42],
    [65,      68],
    [65,      96],
    [58,     118],
    [40,     128],
    [25,     127],
    [14.5995, 120.9842],
  ];

  // Dashed flight path
  L.polyline(arcPoints, {
    color: "#d4537e",
    weight: 2,
    opacity: 0.9,
    dashArray: "6 5",
  }).addTo(map);

  // City marker helper
  function cityMarker(latlng, label) {
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:10px;height:10px;border-radius:50%;background:#ff8fb3;border:2px solid white;box-shadow:0 0 0 4px rgba(255,143,179,0.3);"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    return L.marker(latlng, { icon })
      .addTo(map)
      .bindTooltip(label, { permanent: true, className: "map-tip", direction: "top", offset: [0, -8] });
  }

  cityMarker([48.8566,  2.3522],   "📍 Paris");
  cityMarker([14.5995, 120.9842],  "📍 Manila");


  // ── Bearing helper (degrees, 0 = north, clockwise) ──
  function getBearing(p1, p2) {
    const toRad = d => d * Math.PI / 180;
    const φ1 = toRad(p1[0]), φ2 = toRad(p2[0]);
    const Δλ = toRad(p2[1] - p1[1]);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  // ── SVG plane icon (rotates to face direction of travel) ──
  function makePlaneIcon(deg) {
    return L.divIcon({
      className: "",
      html: `<div style="transform:rotate(${deg}deg);transform-origin:center;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
        <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="#d4537e" stroke="white" stroke-width="0.8"
            d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      </div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  // Interpolate path for smooth animation
  const steps = 160;
  const fullPath = [];
  for (let i = 0; i < arcPoints.length - 1; i++) {
    const [lat1, lng1] = arcPoints[i];
    const [lat2, lng2] = arcPoints[i + 1];
    const segSteps = Math.round(steps / (arcPoints.length - 1));
    for (let s = 0; s < segSteps; s++) {
      const t = s / segSteps;
      fullPath.push([lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]);
    }
  }
  fullPath.push(arcPoints[arcPoints.length - 1]);

  let planeIdx = 0;
  const plane = L.marker(fullPath[0], { icon: makePlaneIcon(90), zIndexOffset: 1000 }).addTo(map);

  function animatePlane() {
    const cur  = fullPath[planeIdx];
    const next = fullPath[(planeIdx + 1) % fullPath.length];
    const deg  = getBearing(cur, next);
    plane.setLatLng(cur);
    plane.setIcon(makePlaneIcon(deg));
    planeIdx = (planeIdx + 1) % fullPath.length;
    setTimeout(animatePlane, 55);
  }
  setTimeout(animatePlane, 800);
})();

// ─── TIME CARDS ──────────────────────────────
const MOOD_HOURS = {
  sleep:     [0, 1, 2, 3, 4, 5],
  morning:   [6, 7, 8, 9, 10, 11],
  afternoon: [12, 13, 14, 15, 16, 17],
  evening:   [18, 19, 20],
  sleepy:    [21, 22, 23],
};
const STATES = {
  sleep:     { label: "Asleep",  sub: "A quiet night"        },
  morning:   { label: "Awake",   sub: "Starting the day"     },
  afternoon: { label: "Daytime", sub: "In the middle of day" },
  evening:   { label: "Sunset",  sub: "Golden hour"          },
  sleepy:    { label: "Drowsy",  sub: "Almost bedtime"       },
};

function moodForHour(hour) {
  for (const [key, hours] of Object.entries(MOOD_HOURS)) {
    if (hours.includes(hour)) return key;
  }
  return "sleep";
}

/**
 * Position of sun/moon on the semicircle arc based on local time.
 * Day cycle: 5 AM → 8 PM (15h) → sun moves left to right across arc
 * Night cycle: 8 PM → 5 AM (9h)  → moon moves left to right across arc
 * Arc center: (65, 60), radius 57. Angle π = leftmost, 0 = rightmost.
 */
function updateSundials() {
  const now = new Date();

  document.querySelectorAll(".monkey-card").forEach(card => {
    const tz = card.dataset.tz;
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "numeric", hour12: false, timeZone: tz,
    }).formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === "hour").value, 10);
    const mood = moodForHour(hour);

    // Update mood class
    card.className = card.className.replace(/\bmood-\S+/g, "").trim();
    card.classList.add("mood-" + mood);

    // Update text
    const stateEl = card.querySelector(".state-text");
    const subEl   = card.querySelector(".sub-text");
    const timeEl  = card.querySelector(".time-big");
    if (stateEl) stateEl.textContent = STATES[mood].label;
    if (subEl)   subEl.textContent   = STATES[mood].sub;
    if (timeEl) {
      timeEl.textContent = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz,
      }).format(now);
    }
  });
}

// ─── INIT ────────────────────────────────────
updateCounter();
updateSundials();
setInterval(updateCounter,  1_000);
setInterval(updateSundials, 30_000);
