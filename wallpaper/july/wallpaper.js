const wallpapers = [
  {
    title: "wallpaper 01",
    button: "Download wallpaper 01",
    href: "../../assets/wallpapers/2026-07-wallpaper-01.png?v=20260705-final",
    download: "seori-studio-july-wallpaper-01.png",
    event: "download-july-01"
  },
  {
    title: "wallpaper 02",
    button: "Download wallpaper 02",
    href: "../../assets/wallpapers/2026-07-wallpaper-02.png?v=20260705-final",
    download: "seori-studio-july-wallpaper-02.png",
    event: "download-july-02"
  },
  {
    title: "wallpaper 03",
    button: "Download wallpaper 03",
    href: "../../assets/wallpapers/2026-07-wallpaper-03.png?v=20260705-final",
    download: "seori-studio-july-wallpaper-03.png",
    event: "download-july-03"
  }
];

const track = document.querySelector("[data-wallpaper-track]");
const slides = Array.from(document.querySelectorAll(".wallpaper-slide"));
const dots = Array.from(document.querySelectorAll("[data-dot]"));
const title = document.querySelector("[data-wallpaper-title]");
const downloadButton = document.querySelector("[data-download-button]");
const previousButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");
const via = new URLSearchParams(window.location.search).get("via") || "direct";
let selectedIndex = 0;
let scrollFrame = 0;
let settleTimer = 0;

function trackEvent(path) {
  if (window.goatcounter && typeof window.goatcounter.count === "function") {
    window.goatcounter.count({ path, event: true });
  }
}

function normalizeIndex(index) {
  return (index + wallpapers.length) % wallpapers.length;
}

function applySelection(index) {
  selectedIndex = normalizeIndex(index);
  const selected = wallpapers[selectedIndex];

  title.textContent = selected.title;
  downloadButton.href = selected.href;
  downloadButton.download = selected.download;
  downloadButton.textContent = selected.button;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === selectedIndex);
    slide.setAttribute("aria-hidden", slideIndex === selectedIndex ? "false" : "true");
  });

  dots.forEach((dot, dotIndex) => {
    dot.setAttribute("aria-current", dotIndex === selectedIndex ? "true" : "false");
  });
}

function syncSelectionFromScroll() {
  const width = track.clientWidth || 1;
  const index = normalizeIndex(Math.round(track.scrollLeft / width));
  if (index !== selectedIndex) {
    applySelection(index);
  }
}

function scrollToIndex(index) {
  const nextIndex = normalizeIndex(index);
  applySelection(nextIndex);
  const left = nextIndex * track.clientWidth;

  if (typeof track.scrollTo === "function") {
    track.scrollTo({ left, behavior: "smooth" });
  } else {
    track.scrollLeft = left;
  }
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    scrollToIndex(Number(dot.dataset.dot));
  });
});

previousButton.addEventListener("click", () => {
  scrollToIndex(selectedIndex - 1);
});

nextButton.addEventListener("click", () => {
  scrollToIndex(selectedIndex + 1);
});

track.addEventListener("scroll", () => {
  window.clearTimeout(settleTimer);

  if (!scrollFrame) {
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      syncSelectionFromScroll();
    });
  }

  settleTimer = window.setTimeout(syncSelectionFromScroll, 90);
}, { passive: true });

downloadButton.addEventListener("click", () => {
  const selected = wallpapers[selectedIndex];
  trackEvent(`${selected.event}-${via}`);
});

window.addEventListener("resize", () => {
  track.scrollLeft = selectedIndex * track.clientWidth;
});

applySelection(0);
