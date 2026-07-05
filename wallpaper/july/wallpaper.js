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
let touchStartX = 0;
let touchStartY = 0;

function trackEvent(path) {
  if (window.goatcounter && typeof window.goatcounter.count === "function") {
    window.goatcounter.count({ path, event: true });
  }
}

function updateSelection(index) {
  selectedIndex = (index + wallpapers.length) % wallpapers.length;
  const selected = wallpapers[selectedIndex];

  title.textContent = selected.title;
  downloadButton.href = selected.href;
  downloadButton.download = selected.download;
  downloadButton.textContent = selected.button;

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === selectedIndex;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", isActive ? "false" : "true");
  });

  dots.forEach((dot, dotIndex) => {
    dot.setAttribute("aria-current", dotIndex === selectedIndex ? "true" : "false");
  });
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    updateSelection(Number(dot.dataset.dot));
  });
});

previousButton.addEventListener("click", () => {
  updateSelection(selectedIndex - 1);
});

nextButton.addEventListener("click", () => {
  updateSelection(selectedIndex + 1);
});

track.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

track.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) < 34 || Math.abs(deltaX) < Math.abs(deltaY)) {
    return;
  }

  updateSelection(selectedIndex + (deltaX < 0 ? 1 : -1));
}, { passive: true });

downloadButton.addEventListener("click", () => {
  const selected = wallpapers[selectedIndex];
  trackEvent(`${selected.event}-${via}`);
});

updateSelection(0);
