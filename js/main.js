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
    setTimeout(() => lock.remove(), 600);
  } else {
    error.textContent = "Wrong code, try again ❤️";
    input.value = "";
    input.focus();
  }
}
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

// ─── CLOCKS ─────────────────────────────────
function updateClocks() {
  const now = new Date();
  const fmt = (tz) => new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz,
  }).format(now).split(" ");

  const [parisTime,  parisAP]  = fmt(CONFIG.timezones.left.tz);
  const [manilaTime, manilaAP] = fmt(CONFIG.timezones.right.tz);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("timeParis",   parisTime);  set("timeParisAP",  parisAP);
  set("timeManila",  manilaTime); set("timeManilaAP", manilaAP);
  set("timeParisM",  parisTime);  set("timeManilaM",  manilaTime);
}

// ─── TRANSLATOR ─────────────────────────────
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
    const res  = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|tl`);
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

// ─── MONKEY ─────────────────────────────────
const mWrap  = document.getElementById("monkeyWrap");
const mBubble = document.getElementById("mkBubble");
const msgs = [
  "🍌 Hiiii!", "🐒 Ooh ooh!", "❤️ Miss you!",
  "🙈 Peek-a-boo!", "🌸 So cute~", "🍌 Banana?", "✨ Happy birthday!",
];
let hideTimer;

function showMonkey() {
  mBubble.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  mWrap.classList.remove("hiding");
  mWrap.classList.add("visible");
  setTimeout(() => mBubble.classList.add("show"), 500);
  hideTimer = setTimeout(hideMonkey, 4500);
}
function hideMonkey() {
  mBubble.classList.remove("show");
  setTimeout(() => {
    mWrap.classList.add("hiding");
    mWrap.classList.remove("visible");
    setTimeout(() => setTimeout(showMonkey, 7000 + Math.random() * 8000), 600);
  }, 300);
}
mWrap.addEventListener("click", () => {
  clearTimeout(hideTimer);
  mBubble.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  mBubble.classList.add("show");
  hideTimer = setTimeout(hideMonkey, 3000);
});

// ─── INIT ────────────────────────────────────
updateCounter();
updateClocks();
setInterval(updateCounter, 1_000);
setInterval(updateClocks,  10_000);
setTimeout(showMonkey, 2500);
