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
const gestureTarget = document.querySelector(".carousel-wrap") || document.querySelector(".phone-stage") || track;
const via = new URLSearchParams(window.location.search).get("via") || "direct";
let selectedIndex = 0;
let gestureStartX = 0;
let gestureStartY = 0;
let gesturePointerId = null;
let gestureMoved = false;
let gestureActive = false;
let lastTouchGestureAt = 0;

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

function isInsideGestureTarget(clientX, clientY) {
  const rect = gestureTarget.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function beginGesture(clientX, clientY, pointerId = null) {
  gestureStartX = clientX;
  gestureStartY = clientY;
  gesturePointerId = pointerId;
  gestureMoved = false;
  gestureActive = true;
}

function moveGesture(clientX, clientY, event) {
  if (!gestureActive) {
    return;
  }

  const deltaX = clientX - gestureStartX;
  const deltaY = clientY - gestureStartY;

  if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
    gestureMoved = true;
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
  }
}

function finishGesture(clientX, clientY, pointerId = null) {
  if (!gestureActive) {
    return;
  }

  if (gesturePointerId !== null && pointerId !== null && gesturePointerId !== pointerId) {
    return;
  }

  const deltaX = clientX - gestureStartX;
  const deltaY = clientY - gestureStartY;
  gesturePointerId = null;
  gestureActive = false;

  if (!gestureMoved && Math.abs(deltaX) < 28) {
    return;
  }

  if (Math.abs(deltaX) < 28 || Math.abs(deltaX) < Math.abs(deltaY) * 1.1) {
    return;
  }

  updateSelection(selectedIndex + (deltaX < 0 ? 1 : -1));
}

if (window.PointerEvent) {
  gestureTarget.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" || Date.now() - lastTouchGestureAt < 500) {
      return;
    }

    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    beginGesture(event.clientX, event.clientY, event.pointerId);
    gestureTarget.setPointerCapture?.(event.pointerId);
  });

  gestureTarget.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch" || Date.now() - lastTouchGestureAt < 500) {
      return;
    }

    finishGesture(event.clientX, event.clientY, event.pointerId);
  });

  gestureTarget.addEventListener("pointercancel", () => {
    gesturePointerId = null;
  });
}

document.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  if (!touch || !isInsideGestureTarget(touch.clientX, touch.clientY)) {
    gestureActive = false;
    return;
  }

  beginGesture(touch.clientX, touch.clientY);
}, { capture: true, passive: true });

document.addEventListener("touchmove", (event) => {
  const touch = event.changedTouches[0];
  if (!touch) {
    return;
  }

  moveGesture(touch.clientX, touch.clientY, event);
}, { capture: true, passive: false });

document.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  if (!touch) {
    gestureActive = false;
    return;
  }

  lastTouchGestureAt = Date.now();
  finishGesture(touch.clientX, touch.clientY);
}, { capture: true, passive: true });

document.addEventListener("touchcancel", () => {
  gesturePointerId = null;
  gestureActive = false;
}, { capture: true, passive: true });

downloadButton.addEventListener("click", () => {
  const selected = wallpapers[selectedIndex];
  trackEvent(`${selected.event}-${via}`);
});

updateSelection(0);
track.classList.add("is-ready");
