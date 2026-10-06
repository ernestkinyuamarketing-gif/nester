// Nester site — shared behavior across all pages

document.addEventListener("DOMContentLoaded", () => {
  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll reveal animation
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  // Animated stat counters
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    counters.forEach((el) => {
      const decimals = el.dataset.count.includes(".") ? 1 : 0;
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      el.textContent = prefix + (decimals ? "0.0" : "0") + suffix;
    });

    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const prefix = el.dataset.prefix || "";
          const suffix = el.dataset.suffix || "";
          const decimals = el.dataset.count.includes(".") ? 1 : 0;
          const duration = 1200;
          const start = performance.now();

          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = target * eased;
            el.textContent = prefix + (decimals ? value.toFixed(decimals) : Math.round(value)) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
          countObserver.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => countObserver.observe(el));
  }

  // Testimonial carousel
  const dots = document.querySelectorAll(".testimonial-dots button");
  const slides = document.querySelectorAll(".testimonial-slide");
  if (dots.length && slides.length) {
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        slides.forEach((s, si) => s.classList.toggle("is-active", si === i));
        dots.forEach((d, di) => d.classList.toggle("is-active", di === i));
      });
    });
  }

  // Back to top
  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("is-visible", window.scrollY > 600);
    });
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Contact form — submits to Web3Forms via AJAX so the page never reloads
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Honeypot: if the hidden field got filled in, it's a bot — drop the submission silently
      const honeypot = form.querySelector('[name="botcheck"]');
      if (honeypot && honeypot.value) return;

      const data = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      })
        .then((res) => res.json())
        .then((result) => {
          if (!result.success) throw new Error(result.message || "Submission failed");
          document.getElementById("form-success").classList.add("visible");
          form.reset();
          form.hidden = true;
        })
        .catch(() => {
          alert("Something went wrong sending your message — please email us directly instead.");
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  // Calendly — its script and styles are only fetched when needed, so they never delay the page
  const CALENDLY_URL = "https://calendly.com/ernestkinyua-marketing/interview-meeting";
  let calendlyReady;
  const loadCalendly = () => {
    if (!calendlyReady) {
      calendlyReady = new Promise((resolve, reject) => {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://assets.calendly.com/assets/external/widget.css";
        document.head.appendChild(css);

        const js = document.createElement("script");
        js.src = "https://assets.calendly.com/assets/external/widget.js";
        js.onload = () => resolve(window.Calendly);
        js.onerror = reject;
        document.head.appendChild(js);
      });
    }
    return calendlyReady;
  };

  // Floating "Book a Call" badge: desktop only, added once the page has finished loading
  if (window.innerWidth > 720 && !document.body.hasAttribute("data-no-calendly-badge")) {
    const showBadge = () =>
      loadCalendly()
        .then((Calendly) =>
          Calendly.initBadgeWidget({
            url: CALENDLY_URL,
            text: "Book a Call",
            color: "#f97316",
            textColor: "#ffffff",
            branding: true,
          })
        )
        .catch(() => {});
    window.addEventListener("load", () => {
      if ("requestIdleCallback" in window) requestIdleCallback(showBadge, { timeout: 4000 });
      else setTimeout(showBadge, 2000);
    });
  }

  // Popup booking links: warm Calendly up on hover/focus, open the popup on click.
  // Without JS (or if Calendly fails to load) the link still opens the booking page.
  document.querySelectorAll("[data-calendly-popup]").forEach((link) => {
    const warmUp = () => loadCalendly().catch(() => {});
    link.addEventListener("pointerenter", warmUp, { once: true });
    link.addEventListener("focus", warmUp, { once: true });
    link.addEventListener("click", (e) => {
      e.preventDefault();
      loadCalendly()
        .then((Calendly) => Calendly.initPopupWidget({ url: link.href }))
        .catch(() => window.open(link.href, "_blank", "noopener"));
    });
  });
});
