const previewGrid = document.querySelector("[data-home-preview]");
const worksList = document.querySelector("[data-works-list]");
const worksHeading = document.querySelector(".works-page .page-heading");
const aboutCarousel = document.querySelector("[data-about-carousel]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealSelectors = [
  ".intro-section p",
  ".preview-section .section-heading",
  ".preview-action",
  ".work-card img",
  ".work-card figcaption",
  ".page-heading",
  ".collection-card img",
  ".collection-card-title",
  ".collection-back",
  ".work-copy > *",
  ".about-carousel",
  ".about-copy .section-kicker",
  ".about-copy h1",
  ".about-copy p",
  ".about-copy .email-link",
  ".biography-section > .section-kicker",
  ".biography-group",
  ".site-footer"
];

document.documentElement.classList.add("motion-ready");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function setupHomeHeader() {
  const header = document.querySelector(".site-header--overlay");
  const hero = document.querySelector(".home-hero");

  if (!header || !hero) {
    return;
  }

  function updateHeaderState() {
    const stickPoint = hero.offsetHeight - header.offsetHeight;
    header.classList.toggle("is-stuck", window.scrollY >= stickPoint);
  }

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  window.addEventListener("resize", updateHeaderState);
}

async function fetchWorks() {
  const response = await fetch("data/works.json?v=20260618-beach-items-title-align", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Unable to load works.json (${response.status})`);
  }

  return response.json();
}

function scrollPageToTop() {
  const root = document.documentElement;
  const previousRootBehavior = root.style.scrollBehavior;
  const previousBodyBehavior = document.body.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  document.body.style.scrollBehavior = "auto";
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  root.style.scrollBehavior = previousRootBehavior;
  document.body.style.scrollBehavior = previousBodyBehavior;
}

function toDisplayTitle(value = "") {
  return value
    .split(" — ")
    .map((segment) =>
      segment.replace(/[A-Za-z][A-Za-z'-]*/g, (word) => {
        const lowerWord = word.toLowerCase();

        if (lowerWord === "ai") {
          return "AI";
        }

        if (lowerWord === "en") {
          return "en";
        }

        if (word === word.toUpperCase() && word.length <= 3) {
          return word;
        }

        return word
          .toLowerCase()
          .replace(/(^|[-'])\p{L}/gu, (match) => match.toUpperCase());
      })
    )
    .join(" — ")
    .replace(/\bAix-En-Provence\b/g, "Aix-en-Provence");
}

function getThumbnailPath(path = "") {
  return path.replace(/^assets\/images\//, "assets/images/thumbs/").replace(/\.[^.]+$/, ".jpg");
}

function warmImage(path) {
  if (!path) {
    return;
  }

  const image = new Image();
  image.decoding = "async";
  image.src = path;
}

function warmArtworkImages(images = []) {
  const load = () => {
    images.slice(0, 2).forEach((image, index) => {
      window.setTimeout(() => warmImage(image.path), index * 80);
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(load, { timeout: 700 });
  } else {
    window.setTimeout(load, 120);
  }
}

function createCard(image, meta = "") {
  const figure = document.createElement("figure");
  figure.className = "work-card";

  const img = document.createElement("img");
  img.src = getThumbnailPath(image.path);
  img.alt = image.alt;
  img.loading = "lazy";
  img.decoding = "async";
  img.width = 900;
  img.height = 1125;
  img.dataset.lightboxImage = "";
  img.dataset.fullSrc = image.path;
  img.dataset.reveal = "";

  const caption = document.createElement("figcaption");
  caption.dataset.reveal = "";
  const title = document.createElement("span");
  title.className = "work-title";
  title.textContent = toDisplayTitle(image.title);

  caption.append(title);

  if (meta) {
    const metaLine = document.createElement("span");
    metaLine.className = "work-meta";
    metaLine.textContent = meta;
    caption.append(metaLine);
  }

  figure.append(img, caption);
  return figure;
}

function createChevronArrow() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("collection-card-arrow");
  svg.setAttribute("viewBox", "0 0 10 16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M3 2.5 8 8 3 13.5");
  svg.append(path);

  return svg;
}

function createCollectionCard(category) {
  const link = document.createElement("a");
  link.className = "collection-card";
  link.href = `#${category.id}`;
  link.dataset.collectionId = category.id;

  const cover = category.cover || category.images[0];
  const img = document.createElement("img");
  img.src = getThumbnailPath(cover.path);
  img.alt = cover.alt;
  img.loading = "lazy";
  img.decoding = "async";
  img.width = 900;
  img.height = 1125;
  img.dataset.reveal = "";

  const title = document.createElement("span");
  title.className = "collection-card-title";
  title.dataset.reveal = "";
  title.append(document.createTextNode(toDisplayTitle(category.title)));

  title.append(createChevronArrow());

  link.append(img, title);
  return link;
}

function createArtworkCollectionCard(image, category) {
  const link = document.createElement("a");
  link.className = "collection-card";
  link.href = `#${category.id}`;
  link.dataset.collectionId = category.id;

  const img = document.createElement("img");
  img.src = getThumbnailPath(image.path);
  img.alt = image.alt;
  img.loading = "lazy";
  img.decoding = "async";
  img.width = 900;
  img.height = 1125;
  img.dataset.reveal = "";

  const title = document.createElement("span");
  title.className = "collection-card-title";
  title.dataset.reveal = "";
  title.append(document.createTextNode(toDisplayTitle(image.title)));

  title.append(createChevronArrow());

  link.append(img, title);
  return link;
}

function renderWorksHeading(activeCategory) {
  if (!worksHeading) {
    return;
  }

  worksHeading.replaceChildren();

  if (activeCategory) {
    const seriesLink = document.createElement("a");
    seriesLink.className = "section-kicker collection-series-link";
    seriesLink.href = "works.html";
    seriesLink.textContent = toDisplayTitle(activeCategory.title);
    worksHeading.append(seriesLink);
    return;
  }

  const label = document.createElement("p");
  label.className = "section-kicker";
  label.textContent = "Works";

  const title = document.createElement("h1");
  title.id = "works-title";
  title.append(
    document.createTextNode("All works are made with AI,"),
    document.createElement("br"),
    document.createTextNode("shaped with care.")
  );

  worksHeading.append(label, title);
}

function randomizeStars() {
  if (reduceMotion) {
    return;
  }

  document.querySelectorAll(".twinkle-star").forEach((star) => {
    const duration = 1.65 + Math.random() * 1.95;
    const low = 0.1 + Math.random() * 0.14;
    const mid = 0.38 + Math.random() * 0.26;
    const high = 0.86 + Math.random() * 0.14;

    star.style.setProperty("--d", `${duration.toFixed(2)}s`);
    star.style.setProperty("--delay", `${(-Math.random() * duration).toFixed(2)}s`);
    star.style.setProperty("--lo", low.toFixed(2));
    star.style.setProperty("--mid", mid.toFixed(2));
    star.style.setProperty("--hi", high.toFixed(2));
  });
}

function setupReveal() {
  const revealItems = revealSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]);
  const uniqueItems = [...new Set(revealItems)];
  const aboutScrollSteps = [...document.querySelectorAll("[data-about-step]")];
  const aboutScrollStepSet = new Set(aboutScrollSteps);
  const delayedBioItems = aboutScrollSteps.length
    ? [...document.querySelectorAll(".biography-section > .section-kicker, .biography-group")]
    : [];
  const delayedBioSet = new Set(delayedBioItems);

  uniqueItems.forEach((item, index) => {
    item.dataset.reveal = "";
    const baseDelay = Math.min((index % 6) * 80, 400);
    item.style.setProperty("--reveal-delay", `${baseDelay}ms`);
  });

  document.querySelectorAll(".work-card").forEach((card, index) => {
    const image = card.querySelector("img[data-reveal]");
    const caption = card.querySelector("figcaption[data-reveal]");
    const isDetailCard = Boolean(card.closest(".collection-image-grid"));
    const baseDelay = isDetailCard ? 0 : Math.min(index * 95, 620);

    image?.style.setProperty("--reveal-delay", `${baseDelay}ms`);
    caption?.style.setProperty("--reveal-delay", `${isDetailCard ? 0 : baseDelay + 150}ms`);
  });

  const aboutSequence = [
    { selector: ".about-carousel", delay: 0 },
    { selector: ".about-copy .section-kicker", delay: 0 },
    { selector: ".about-copy h1", delay: 0 },
    { selector: ".about-copy p:nth-of-type(2)", delay: 0 },
    { selector: ".about-copy p:nth-of-type(3)", delay: 0 },
    { selector: ".about-copy .email-link", delay: 0 }
  ];

  aboutSequence.forEach(({ selector, delay }) => {
    document.querySelector(selector)?.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  document.querySelectorAll(".biography-section > .section-kicker, .biography-group").forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${index * 140}ms`);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    uniqueItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12
    }
  );

  uniqueItems.forEach((item) => {
    if (!aboutScrollStepSet.has(item) && !delayedBioSet.has(item)) {
      observer.observe(item);
    }
  });

  if (aboutScrollSteps.length) {
    aboutScrollSteps.forEach((item, index) => {
      window.setTimeout(() => item.classList.add("is-visible"), 900 + index * 1000);
    });

    window.setTimeout(() => {
      delayedBioItems.forEach((item) => observer.observe(item));
    }, 4100);
  }

  document.querySelectorAll(".collection-image-grid [data-reveal]").forEach((item) => {
    item.style.setProperty("--reveal-delay", "0ms");
    item.classList.add("is-visible");
  });
}

function renderHomePreview(series) {
  if (!previewGrid) {
    return;
  }

  const images = [
    {
      path: "assets/images/selected/tubes.png",
      title: "Tubes",
      alt: "Flamingo pool tube floating in sparkling blue water with citrus fruit."
    },
    {
      path: "assets/images/selected/cans.png",
      title: "Cans",
      alt: "Decorative orange can with lemon and pear under a blue starry sky."
    },
    {
      path: "assets/images/selected/copenhagen-bike.png",
      title: "Copenhagen — Pale Blue Summer Rituals",
      alt: "Blonde woman in sunglasses riding a pale blue bicycle with flowers through a colorful Copenhagen street."
    },
    {
      path: "assets/images/selected/lucca-dachshund.png",
      title: "Lucca — The Slow Yellow Afternoon",
      alt: "Sunny Lucca square with a dachshund, fountain, trees, and colorful buildings."
    }
  ];

  previewGrid.replaceChildren(...images.map((image) => createCard(image)));
}

function renderWorks(series) {
  if (!worksList) {
    return;
  }

  const activeId = decodeURIComponent(window.location.hash.replace("#", ""));
  const activeCategory = series.find((category) => category.id === activeId);
  renderWorksHeading(activeCategory);

  if (activeCategory) {
    const detail = document.createElement("article");
    detail.className = "collection-detail";

    const grid = document.createElement("div");
    grid.className = "image-grid collection-image-grid";
    grid.replaceChildren(...activeCategory.images.map((image) => createCard(image)));

    detail.append(grid);
    worksList.replaceChildren(detail);
    detail.querySelectorAll("[data-reveal]").forEach((item) => {
      item.style.setProperty("--reveal-delay", "0ms");
      item.classList.add("is-visible");
    });
    warmArtworkImages(activeCategory.images);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "collection-grid";
  grid.replaceChildren(...series.map((category) => createCollectionCard(category)));

  worksList.replaceChildren(grid);
}

function setupWorksNavigation(series) {
  if (!worksList) {
    return;
  }

  worksList.addEventListener("click", (event) => {
    const link = event.target.closest(".collection-card[href^='#']");

    if (!link) {
      return;
    }

    event.preventDefault();
    history.pushState(null, "", link.getAttribute("href"));
    renderWorks(series);
    scrollPageToTop();
    setupReveal();
  });

  window.addEventListener("popstate", () => {
    renderWorks(series);
    scrollPageToTop();
    setupReveal();
  });
}

function setupAboutCarousel() {
  if (!aboutCarousel) {
    return;
  }

  const slides = [...aboutCarousel.querySelectorAll("[data-carousel-slide]")];
  const dots = [...aboutCarousel.querySelectorAll("[data-carousel-dot]")];
  let activeIndex = 0;
  let timer = null;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activeIndex);
      dot.setAttribute("aria-pressed", String(dotIndex === activeIndex));
    });
  }

  function startAutoRotate() {
    if (reduceMotion || slides.length < 2) {
      return;
    }

    window.clearInterval(timer);
    timer = window.setInterval(() => showSlide(activeIndex + 1), 3000);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      startAutoRotate();
    });
  });

  aboutCarousel.querySelector(".about-carousel-track")?.addEventListener("click", () => {
    showSlide(activeIndex + 1);
    startAutoRotate();
  });

  showSlide(0);
  startAutoRotate();
}

function setupImageLightbox() {
  const modal = document.createElement("div");
  modal.className = "image-lightbox";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Artwork preview");
  modal.innerHTML = `
    <div class="lightbox-backdrop" data-lightbox-close></div>
    <div class="lightbox-panel">
      <button class="lightbox-button lightbox-close" type="button" aria-label="Close preview" data-lightbox-close>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"></path></svg>
      </button>
      <button class="lightbox-button lightbox-prev" type="button" aria-label="Previous image" data-lightbox-prev>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"></path></svg>
      </button>
      <img alt="">
      <p class="lightbox-caption"></p>
      <button class="lightbox-button lightbox-next" type="button" aria-label="Next image" data-lightbox-next>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
      </button>
    </div>
  `;

  document.body.append(modal);

  const modalImage = modal.querySelector("img");
  const caption = modal.querySelector(".lightbox-caption");
  const closeButtons = modal.querySelectorAll("[data-lightbox-close]");
  const prevButton = modal.querySelector("[data-lightbox-prev]");
  const nextButton = modal.querySelector("[data-lightbox-next]");
  const panel = modal.querySelector(".lightbox-panel");
  let activeIndex = 0;
  let items = [];
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerStartTime = 0;
  let mouseStartX = 0;
  let mouseStartY = 0;
  let mouseStartTime = 0;
  let lastSwipeAt = 0;
  let imageLoadToken = 0;

  function collectItems() {
    items = [...document.querySelectorAll("[data-lightbox-image]")].map((image) => {
      const figure = image.closest(".work-card");
      const title = figure?.querySelector(".work-title")?.textContent?.trim() || image.alt || "";
      const meta = figure?.querySelector(".work-meta")?.textContent?.trim() || "";

      return {
        image,
        src: image.dataset.fullSrc || image.currentSrc || image.src,
        thumbSrc: image.currentSrc || image.src,
        alt: image.alt || title,
        caption: meta ? `${title} · ${meta}` : title
      };
    });
  }

  function showImage(index) {
    if (!items.length) {
      return;
    }

    activeIndex = (index + items.length) % items.length;
    const item = items[activeIndex];
    const loadToken = ++imageLoadToken;

    modalImage.src = item.thumbSrc;
    modalImage.alt = item.alt;
    caption.textContent = item.caption;

    if (item.src && item.src !== item.thumbSrc) {
      const fullImage = new Image();
      fullImage.decoding = "async";
      fullImage.onload = () => {
        if (loadToken === imageLoadToken) {
          modalImage.src = item.src;
        }
      };
      fullImage.src = item.src;
    }

    warmImage(items[(activeIndex + 1) % items.length]?.src);
    warmImage(items[(activeIndex - 1 + items.length) % items.length]?.src);
  }

  function openLightbox(image) {
    collectItems();
    const index = items.findIndex((item) => item.image === image);

    if (index < 0) {
      return;
    }

    modal.hidden = false;
    document.body.classList.add("lightbox-open");
    showImage(index);
  }

  function closeLightbox() {
    modal.hidden = true;
    document.body.classList.remove("lightbox-open");
    modalImage.removeAttribute("src");
  }

  function handleSwipe(deltaX, deltaY, elapsed) {
    const now = Date.now();
    const isHorizontalSwipe = Math.abs(deltaX) > 46 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35 && elapsed < 700;

    if (!isHorizontalSwipe || now - lastSwipeAt < 180 || items.length < 2) {
      return;
    }

    lastSwipeAt = now;

    if (deltaX < 0) {
      showImage(activeIndex + 1);
    } else {
      showImage(activeIndex - 1);
    }
  }

  document.addEventListener("click", (event) => {
    const image = event.target.closest("[data-lightbox-image]");

    if (image) {
      if (window.matchMedia("(max-width: 560px)").matches && image.closest("[data-home-preview]")) {
        return;
      }

      openLightbox(image);
      return;
    }

    if (event.target.closest("[data-lightbox-close]")) {
      closeLightbox();
    }
  });

  prevButton.addEventListener("click", () => showImage(activeIndex - 1));
  nextButton.addEventListener("click", () => showImage(activeIndex + 1));
  closeButtons.forEach((button) => button.addEventListener("click", closeLightbox));

  panel.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    },
    { passive: true }
  );

  panel.addEventListener(
    "touchend",
    (event) => {
      if (modal.hidden || items.length < 2) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const elapsed = Date.now() - touchStartTime;
      handleSwipe(deltaX, deltaY, elapsed);
    },
    { passive: true }
  );

  panel.addEventListener("pointerdown", (event) => {
    if (!window.matchMedia("(max-width: 560px)").matches || event.button !== 0) {
      return;
    }

    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    pointerStartTime = Date.now();
  });

  panel.addEventListener("pointerup", (event) => {
    if (!window.matchMedia("(max-width: 560px)").matches || modal.hidden) {
      return;
    }

    handleSwipe(event.clientX - pointerStartX, event.clientY - pointerStartY, Date.now() - pointerStartTime);
  });

  panel.addEventListener("mousedown", (event) => {
    if (!window.matchMedia("(max-width: 560px)").matches || event.button !== 0) {
      return;
    }

    mouseStartX = event.clientX;
    mouseStartY = event.clientY;
    mouseStartTime = Date.now();
  });

  panel.addEventListener("mouseup", (event) => {
    if (!window.matchMedia("(max-width: 560px)").matches || modal.hidden) {
      return;
    }

    handleSwipe(event.clientX - mouseStartX, event.clientY - mouseStartY, Date.now() - mouseStartTime);
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      showImage(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      showImage(activeIndex + 1);
    }
  });
}

function setupWorkCardHover() {
  let hoveredCard = null;

  function setHoveredCard(card) {
    if (hoveredCard && hoveredCard !== card) {
      hoveredCard.classList.remove("is-hovered");
    }

    hoveredCard = card;

    if (hoveredCard) {
      hoveredCard.classList.add("is-hovered");
    }
  }

  document.addEventListener("mousemove", (event) => {
    setHoveredCard(event.target.closest(".work-card"));
  });

  document.addEventListener("mouseover", (event) => {
    setHoveredCard(event.target.closest(".work-card"));
  });

  document.addEventListener("mouseout", (event) => {
    const card = event.target.closest(".work-card");

    if (card && !card.contains(event.relatedTarget)) {
      card.classList.remove("is-hovered");
      if (hoveredCard === card) {
        hoveredCard = null;
      }
    }
  });

  document.addEventListener("mouseleave", () => setHoveredCard(null));
}

function setupMobileMenu() {
  document.querySelectorAll(".mobile-nav").forEach((nav) => {
    const button = nav.querySelector(".mobile-menu-button");
    const panel = nav.querySelector(".mobile-menu-panel");
    const closeButton = panel?.querySelector(".mobile-menu-close");
    const focusableSelector = "a[href], button:not([disabled])";

    if (!button || !panel) {
      return;
    }

    document.body.append(panel);

    function setOpen(isOpen) {
      nav.classList.toggle("is-open", isOpen);
      panel.classList.toggle("is-open", isOpen);
      document.body.classList.toggle("menu-open", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));

      if (!isOpen) {
        button.focus();
      } else {
        closeButton?.focus();
      }
    }

    button.addEventListener("click", () => {
      setOpen(!nav.classList.contains("is-open"));
    });

    closeButton?.addEventListener("click", () => setOpen(false));

    panel.addEventListener("click", (event) => {
      if (event.target === panel) {
        setOpen(false);
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !panel.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!nav.classList.contains("is-open")) {
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = [...panel.querySelectorAll(focusableSelector)].filter((item) => item.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });
}

function setupSparkleCursor() {
  const canUseCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isSmallScreen = window.matchMedia("(max-width: 860px)").matches;

  if (!canUseCursor || isSmallScreen || reduceMotion) {
    return;
  }

  let lastTrailTime = 0;
  let lastX = window.innerWidth / 2;
  let lastY = window.innerHeight / 2;
  let hasPointerPosition = false;
  const interactiveSelector = "a, button, [role='button'], input, textarea, select, summary, .work-card, .about-carousel img";

  function isCursorEnabled(target) {
    return Boolean(target)
      && !target.closest(".home-hero")
      && !target.closest(interactiveSelector);
  }

  function createTrail(x, y) {
    const trail = document.createElement("span");
    const size = 8 + Math.random() * 6;
    const offsetX = -8 + Math.random() * 16;
    const offsetY = -8 + Math.random() * 16;
    const colors = ["#ffe100", "#ffd400", "#fff04a"];

    trail.className = "cursor-trail-star";
    trail.textContent = "✦";
    trail.setAttribute("aria-hidden", "true");
    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;
    trail.style.setProperty("--trail-size", `${size.toFixed(1)}px`);
    trail.style.setProperty("--trail-x", `${offsetX.toFixed(1)}px`);
    trail.style.setProperty("--trail-y", `${offsetY.toFixed(1)}px`);
    trail.style.setProperty("--trail-rotate", `${Math.round(Math.random() * 180)}deg`);
    trail.style.setProperty("--trail-color", colors[Math.floor(Math.random() * colors.length)]);

    document.body.append(trail);
    trail.addEventListener("animationend", () => trail.remove(), { once: true });
  }

  function updateCursorState(x, y, shouldCreateTrail = false) {
    const target = document.elementFromPoint(x, y);
    const enabled = isCursorEnabled(target);

    document.body.classList.toggle("sparkle-cursor-active", enabled);

    if (!enabled) {
      return;
    }

    const now = Date.now();
    if (!shouldCreateTrail || now - lastTrailTime < 65) {
      return;
    }

    lastTrailTime = now;
    createTrail(x, y);
  }

  document.addEventListener("mousemove", (event) => {
    lastX = event.clientX;
    lastY = event.clientY;
    hasPointerPosition = true;
    updateCursorState(lastX, lastY, true);
  });

  window.addEventListener("scroll", () => {
    if (hasPointerPosition) {
      updateCursorState(lastX, lastY);
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (hasPointerPosition) {
      updateCursorState(lastX, lastY);
    }
  });

  document.addEventListener("mouseleave", () => {
    hasPointerPosition = false;
    document.body.classList.remove("sparkle-cursor-active");
  });
}

randomizeStars();
setupHomeHeader();
setupAboutCarousel();
setupSparkleCursor();
setupImageLightbox();
setupWorkCardHover();
setupMobileMenu();

if (!reduceMotion) {
  window.setInterval(randomizeStars, 4800);
}

if (previewGrid || worksList) {
  fetchWorks()
    .then((series) => {
      renderHomePreview(series);
      if (window.location.hash) {
        scrollPageToTop();
      }
      renderWorks(series);
      if (window.location.hash) {
        scrollPageToTop();
      }
      setupWorksNavigation(series);
      window.addEventListener("hashchange", () => {
        renderWorks(series);
        scrollPageToTop();
        setupReveal();
      });
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(setupReveal);
} else {
  setupReveal();
}
