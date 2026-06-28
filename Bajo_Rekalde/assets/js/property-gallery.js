function initUseCarousels() {
  document.querySelectorAll("[data-use-carousel]").forEach((carousel) => {
    if (carousel.dataset.carouselReady === "true") return;

    const track = carousel.querySelector(".use-carousel__track");
    const slides = [...carousel.querySelectorAll(".use-carousel__slide")];
    const previous = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    const dots = carousel.querySelector("[data-carousel-dots]");
    if (!track || !slides.length || !previous || !next || !dots) return;

    let activeIndex = 0;
    carousel.dataset.carouselReady = "true";
    carousel.tabIndex = 0;

    const dotButtons = slides.map((slide, index) => {
      const button = document.createElement("button");
      const title = slide.dataset.title || `Vista ${index + 1}`;
      button.type = "button";
      button.setAttribute("aria-label", title);
      button.addEventListener("click", () => {
        activeIndex = index;
        render();
      });
      dots.appendChild(button);
      return button;
    });

    function render() {
      track.style.transform = `translateX(-${activeIndex * 100}%)`;
      slides.forEach((slide, index) => {
        slide.setAttribute("aria-hidden", String(index !== activeIndex));
      });
      dotButtons.forEach((button, index) => {
        const selected = index === activeIndex;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-current", selected ? "true" : "false");
      });
    }

    function goTo(delta) {
      activeIndex = (activeIndex + delta + slides.length) % slides.length;
      render();
    }

    previous.addEventListener("click", () => goTo(-1));
    next.addEventListener("click", () => goTo(1));
    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(1);
      }
    });

    render();
  });
}

function initPropertyLightbox() {
  const lightbox = document.querySelector("[data-property-lightbox]");
  if (!lightbox || lightbox.dataset.lightboxReady === "true") return;

  const image = lightbox.querySelector("[data-lightbox-image]");
  const caption = lightbox.querySelector("[data-lightbox-caption]");
  const closeButtons = lightbox.querySelectorAll("[data-lightbox-close]");
  if (!image || !caption) return;

  let previousFocus = null;
  lightbox.dataset.lightboxReady = "true";

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("has-property-lightbox");
    image.removeAttribute("src");
    image.alt = "";
    if (previousFocus) previousFocus.focus();
  }

  function openLightbox(trigger) {
    previousFocus = trigger;
    image.src = trigger.dataset.lightboxSrc;
    image.alt = trigger.querySelector("img")?.alt || "";
    caption.textContent = trigger.dataset.lightboxTitle || "";
    lightbox.hidden = false;
    document.body.classList.add("has-property-lightbox");
    lightbox.querySelector(".property-lightbox__close")?.focus();
  }

  document.querySelectorAll("[data-lightbox-src]").forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeLightbox);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
  });
}

initUseCarousels();
initPropertyLightbox();
