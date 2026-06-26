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

initUseCarousels();
