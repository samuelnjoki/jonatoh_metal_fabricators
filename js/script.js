(() => {
  const cfg = window.FORGECRAFT_CONFIG || {};
  const whatsappNumber = String(cfg.whatsappNumber || "").replace(/\D/g, "");
  const waUrl = (message) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  document.querySelectorAll("[data-whatsapp-link]").forEach(link => {
    link.href = waUrl("Hello Jonatoh Metal Fabrication, I would like to enquire about a metal fabrication project.");
    link.addEventListener("click", e => {
      if (!whatsappNumber || whatsappNumber.includes("REPLACE")) {
        e.preventDefault();
        alert("Please configure the WhatsApp number in js/config.js.");
      }
    });
  });
  document.querySelectorAll("[data-social]").forEach(link => {
    const platform = link.dataset.social;
    const url = cfg.social && cfg.social[platform];
    if (url && !url.includes("REPLACE_WITH")) {
      link.href = url; link.target = "_blank"; link.rel = "noopener";
    } else {
      link.href = "#";
      link.addEventListener("click", e => { e.preventDefault(); alert(`Add your ${platform} profile URL in js/config.js.`); });
    }
  });
  // Business email is sourced from the shared site configuration on every page.
  document.querySelectorAll("[data-business-email]").forEach(el => { el.textContent = cfg.businessEmail || "Email not configured"; });
  document.querySelectorAll("[data-business-email-link]").forEach(el => { el.href = `mailto:${cfg.businessEmail || ""}`; });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (menu && nav) menu.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    menu.setAttribute("aria-expanded", String(open));
  });


  // Count-up animation for real business figures configured on the homepage.
  const counters = document.querySelectorAll(".count-up[data-count]");
  if (counters.length) {
    const animateCounter = el => {
      const target = Math.max(0, Number(el.dataset.count) || 0);
      const duration = 1100; const start = performance.now();
      const tick = now => { const progress = Math.min(1, (now - start) / duration); el.textContent = String(Math.floor(target * (1 - Math.pow(1 - progress, 3)))) + (target > 0 ? "+" : ""); if (progress < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { animateCounter(entry.target); observer.unobserve(entry.target); } }), {threshold: .5});
    counters.forEach(el => observer.observe(el));
  }

  const form = document.getElementById("quote-form");
  if (form) {
    const status = document.getElementById("form-status");
    const values = () => Object.fromEntries(new FormData(form).entries());
    const quoteMessage = d => [
      "Hello Jonatoh Metal Fabrication, I would like to request a quotation.",
      "", `Name: ${d.name}`, `Phone: ${d.phone}`, `Customer email: ${d.customerEmail || "Not provided"}`,
      `Location: ${d.location || "Not provided"}`, `Service: ${d.service}`,
      `Quantity: ${d.quantity || "Not provided"}`, `Dimensions: ${d.dimensions || "Not provided"}`,
      `Budget: ${d.budget || "Not provided"}`, `Reference link: ${d.reference || "Not provided"}`,
      "", `Project details: ${d.details}`
    ].join("\n");
    const validate = () => {
      if (!form.reportValidity()) return false;
      return true;
    };
    document.getElementById("send-whatsapp")?.addEventListener("click", () => {
      if (!validate()) return;
      if (!whatsappNumber) { status.textContent = "Please configure the WhatsApp number in js/config.js."; return; }
      const d = values();
      window.open(waUrl(quoteMessage(d)), "_blank", "noopener");
      status.textContent = "WhatsApp opened with your quote request. Press Send in WhatsApp to submit it.";
    });
    document.getElementById("send-email")?.addEventListener("click", async () => {
      if (!validate()) return;
      const d = values();
      const e = cfg.emailjs || {};
      const configured = e.publicKey && e.serviceId && e.templateId &&
        ![e.publicKey, e.serviceId, e.templateId].some(v => String(v).includes("REPLACE"));
      if (!configured || !window.emailjs) {
        const subject = encodeURIComponent(`Quotation request - ${d.service} - ${d.name}`);
        const body = encodeURIComponent(quoteMessage(d));
        status.textContent = "EmailJS is not configured yet. Opening your email app as a fallback.";
        window.location.href = `mailto:${cfg.businessEmail || ""}?subject=${subject}&body=${body}`;
        return;
      }
      const button = document.getElementById("send-email");
      button.disabled = true; button.textContent = "Sending…";
      try {
        window.emailjs.init({ publicKey: e.publicKey });
        await window.emailjs.send(e.serviceId, e.templateId, {
          to_email: cfg.businessEmail,
          business_email: cfg.businessEmail,
          from_name: d.name,
          from_phone: d.phone,
          reply_to: d.customerEmail || "",
          customer_email: d.customerEmail || "Not provided",
          project_location: d.location || "Not provided",
          service: d.service,
          quantity: d.quantity || "Not provided",
          dimensions: d.dimensions || "Not provided",
          budget: d.budget || "Not provided",
          reference_link: d.reference || "Not provided",
          project_details: d.details,
          message: quoteMessage(d),
          subject: `Quotation request - ${d.service} - ${d.name}`
        });
        status.textContent = "Your quote request was sent by email. Thank you!";
        form.reset();
      } catch (err) {
        console.error("EmailJS send failed", err);
        status.textContent = "Email delivery failed. Please try WhatsApp or email us directly.";
      } finally {
        button.disabled = false; button.textContent = "✉ Send quote by email";
      }
    });
    const emailDisplay = document.getElementById("contact-email-display");
    const emailLink = document.getElementById("email-direct-link");
    if (emailDisplay) emailDisplay.textContent = cfg.businessEmail || "Configure business email in js/config.js.";
    if (emailLink) emailLink.href = `mailto:${cfg.businessEmail || ""}?subject=${encodeURIComponent("Metal fabrication quote request")}`;
  }

  // For teams larger than ten, turn employee cards into a slow, continuous right-to-left marquee.
  document.querySelectorAll(".team-grid").forEach(grid => {
    const cards = Array.from(grid.querySelectorAll(":scope > .team-card"));
    if (cards.length > 10) {
      grid.classList.add("team-marquee");
      grid.setAttribute("aria-label", "Workshop team members, moving slowly from right to left");
      cards.forEach(card => { const clone = card.cloneNode(true); clone.setAttribute("aria-hidden", "true"); grid.appendChild(clone); });
    }
  });

  // Edge arrows advance the continuously moving team carousel without stopping its right-to-left motion.
  const teamViewport = document.querySelector(".team-marquee-viewport");
  const teamTrack = teamViewport?.querySelector(".team-grid");
  let teamFocusIndex = 0;
  let teamFeedbackTimer;
  const shiftTeamCarousel = (direction, button) => {
    if (!teamViewport || !teamTrack) return;
    const cards = Array.from(teamTrack.querySelectorAll(":scope > .team-card:not([aria-hidden='true'])"));
    if (!cards.length) return;
    const step = cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(teamTrack).gap) || 18);
    const animation = teamTrack.getAnimations().find(a => a.playState !== "finished");
    if (animation && animation.effect) {
      const timing = animation.effect.getTiming();
      const duration = Number(timing.duration) || 180000;
      const fullDistance = Math.max(1, teamTrack.scrollWidth / (teamTrack.classList.contains("team-marquee") ? 2 : 1));
      const delta = (step / fullDistance) * duration;
      const current = Number(animation.currentTime) || 0;
      animation.currentTime = Math.max(0, current + (direction * delta));
    } else {
      teamTrack.scrollLeft += direction * step;
    }
    teamFocusIndex = (teamFocusIndex + direction + cards.length) % cards.length;
    teamViewport.querySelectorAll(".team-card.is-carousel-focused").forEach(card => card.classList.remove("is-carousel-focused"));
    cards[teamFocusIndex]?.classList.add("is-carousel-focused");
    teamViewport.classList.remove("team-carousel-feedback");
    void teamViewport.offsetWidth;
    teamViewport.classList.add("team-carousel-feedback");
    teamViewport.querySelectorAll(".team-carousel-arrow").forEach(arrow => arrow.classList.remove("is-clicked"));
    button?.classList.add("is-clicked");
    clearTimeout(teamFeedbackTimer);
    teamFeedbackTimer = setTimeout(() => {
      teamViewport.classList.remove("team-carousel-feedback");
      teamViewport.querySelectorAll(".team-carousel-arrow").forEach(arrow => arrow.classList.remove("is-clicked"));
      teamViewport.querySelectorAll(".team-card.is-carousel-focused").forEach(card => card.classList.remove("is-carousel-focused"));
    }, 1100);
  };
  teamViewport?.querySelector(".team-carousel-prev")?.addEventListener("click", event => shiftTeamCarousel(-1, event.currentTarget));
  teamViewport?.querySelector(".team-carousel-next")?.addEventListener("click", event => shiftTeamCarousel(1, event.currentTarget));

  // Recognizable social platform icons with accessible link labels retained in HTML.
  const socialSvg = {
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#25f4ee" d="M16.6 2h-3.4v13.1a3.1 3.1 0 1 1-2.7-3.1V8.5a6.6 6.6 0 1 0 6.1 6.6V8.4c1.4 1 3.1 1.6 4.9 1.6V6.6c-2.8-.1-4.8-2-4.9-4.6z"/><path fill="#fe2c55" d="M15.5 3.1c.5 2.4 2.2 3.9 4.8 4.2v2.7c-1.8 0-3.5-.6-4.9-1.6v6.7a6.6 6.6 0 1 1-6.1-6.6v3.5a3.1 3.1 0 1 0 2.7 3.1V2h3.4c0 .4 0 .8.1 1.1z"/><path fill="#fff" d="M14.4 2h1.1c.1 1.2.5 2.2 1.2 3.1.8.9 1.9 1.4 3.1 1.5v1.1c-2.5-.3-4.3-1.9-4.8-4.2-.1-.4-.2-.9-.2-1.5h-.4zM9.3 8.5v1.1a3.1 3.1 0 1 0 2.7 3.1v1.1a4.2 4.2 0 1 1-2.7-5.3z"/></svg>'
  };
  document.querySelectorAll('[data-social] .social-icon').forEach(icon => {
    const platform = icon.closest('[data-social]')?.dataset.social;
    if (socialSvg[platform]) icon.innerHTML = socialSvg[platform];
  });

  // Accessible full-screen image viewer with next/previous controls.
  let lightboxItems = [];
  let lightboxIndex = 0;
  const openGalleryLightbox = (items, index) => {
    lightboxItems = items; lightboxIndex = index;
    let modal = document.getElementById('gallery-lightbox');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'gallery-lightbox'; modal.className = 'gallery-lightbox';
      modal.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close full image">×</button><button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous image">‹</button><figure><img alt=""><figcaption></figcaption><div class="lightbox-counter" aria-live="polite"></div></figure><button class="lightbox-nav lightbox-next" type="button" aria-label="Next image">›</button>';
      document.body.appendChild(modal);
      modal.addEventListener('click', e => {
        if (e.target === modal || e.target.closest('.lightbox-close')) modal.classList.remove('is-open');
        if (e.target.closest('.lightbox-prev')) showLightboxImage(lightboxIndex - 1);
        if (e.target.closest('.lightbox-next')) showLightboxImage(lightboxIndex + 1);
      });
      document.addEventListener('keydown', e => {
        const activeModal = document.getElementById('gallery-lightbox');
        if (!activeModal?.classList.contains('is-open')) return;
        if (e.key === 'Escape') activeModal.classList.remove('is-open');
        if (e.key === 'ArrowRight') showLightboxImage(lightboxIndex + 1);
        if (e.key === 'ArrowLeft') showLightboxImage(lightboxIndex - 1);
      });
    }
    showLightboxImage(index);
    modal.classList.add('is-open'); modal.querySelector('.lightbox-close').focus();
  };
  const showLightboxImage = index => {
    if (!lightboxItems.length) return;
    lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    const item = lightboxItems[lightboxIndex];
    const modal = document.getElementById('gallery-lightbox');
    if (!modal) return;
    const img = modal.querySelector('img'); img.src = item.image; img.alt = item.alt || item.title || 'Metalwork project';
    modal.querySelector('figcaption').textContent = item.title || 'Metalwork project';
    modal.querySelector('.lightbox-counter').textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
    modal.querySelector('.lightbox-prev').hidden = lightboxItems.length < 2;
    modal.querySelector('.lightbox-next').hidden = lightboxItems.length < 2;
  };

  // Gallery renders lazily; adding 200+ records to gallery-data.js is supported.
  const gallery = document.getElementById("gallery-grid");
  const filters = document.getElementById("gallery-filters");
  if (gallery && filters) {
    const items = Array.isArray(window.FORGECRAFT_GALLERY) ? window.FORGECRAFT_GALLERY : [];
    const categories = ["All", ...new Set(items.map(item => item.category).filter(Boolean))];
    let selected = "All";
    let searchTerm = "";
    let showAll = false;
    const searchInput = document.getElementById("gallery-search");
    if (searchInput) searchInput.addEventListener("input", () => { searchTerm = searchInput.value.trim().toLowerCase(); showAll = false; renderGallery(); });
    const loadMore = document.getElementById("gallery-load-more");
    if (loadMore) loadMore.addEventListener("click", () => { showAll = !showAll; renderGallery(); });
    const renderFilters = () => {
      filters.innerHTML = "";
      categories.forEach(category => {
        const button = document.createElement("button");
        button.className = "filter-button" + (selected === category ? " selected" : "");
        button.type = "button"; button.textContent = category;
        button.addEventListener("click", () => { selected = category; showAll = false; renderFilters(); renderGallery(); });
        filters.appendChild(button);
      });
    };
    const renderGallery = () => {
      gallery.innerHTML = "";
      const visible = items.filter(item => (selected === "All" || item.category === selected) && [item.title, item.category, item.details, item.price, item.alt].filter(Boolean).join(" ").toLowerCase().includes(searchTerm));
      if (!visible.length) {
        gallery.innerHTML = '<p class="muted gallery-empty">No projects match your search. Try another word or choose All.</p>';
        if (loadMore) loadMore.hidden = true;
        return;
      }
      const shown = showAll ? visible : visible.slice(0, 6);
      shown.forEach((item, imageIndex) => {
        const card = document.createElement("article"); card.className = "gallery-card";
        const img = document.createElement("img"); img.src = item.image; img.alt = item.alt || item.title || "Metalwork project";
        img.loading = "lazy"; img.decoding = "async"; img.tabIndex = 0; img.setAttribute("role", "button"); img.setAttribute("aria-label", `Open full image: ${item.title || "Metalwork project"}`);
        const openImage = () => openGalleryLightbox(shown, imageIndex);
        img.addEventListener("click", openImage); img.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openImage(); } });
        img.onerror = () => { img.removeAttribute("src"); img.classList.add("image-missing"); img.alt = "Add an image file for this gallery item"; };
        const body = document.createElement("div"); body.className = "gallery-card-caption";
        const cat = document.createElement("span"); cat.className = "service-number"; cat.textContent = item.category || "Project";
        const title = document.createElement("h3"); title.textContent = item.title || "Metalwork project";
        const details = document.createElement("p"); details.className = "gallery-card-details"; details.textContent = item.details || "Custom-made to your measurements and finish requirements.";
        const price = document.createElement("p"); price.className = "gallery-card-price"; price.textContent = `Indicative price: ${item.price || "Request a quote"}`;
        const note = document.createElement("p"); note.className = "gallery-card-note"; note.textContent = "Estimate only; final price depends on size, materials and installation.";
        const link = document.createElement("a"); link.href = `contact.html#quote`; link.className = "gallery-quote-link"; link.textContent = "Request an exact quote ↗";
        body.append(cat, title, details, price, note, link); card.append(img, body); gallery.appendChild(card);
      });
      if (loadMore) {
        loadMore.hidden = visible.length <= 6;
        loadMore.textContent = showAll ? "Show Fewer Projects ↑" : `View More Projects (${visible.length - 6}) ↓`;
      }
    };
    renderFilters(); renderGallery();
  }

  // Live typewriter phrases across the homepage and interior-page hero banners.
  const typingTargets = document.querySelectorAll("[data-typing-phrase]");
  if (typingTargets.length) {
    const phrases = ["strong security gates", "elegant steel railings", "custom steel doors", "carports built to fit", "reliable welding and repairs", "metalwork made for your space"];
    typingTargets.forEach((target, targetIndex) => {
      let phraseIndex = targetIndex % phrases.length, charIndex = 0, deleting = false;
      const tick = () => {
        const phrase = phrases[phraseIndex];
        charIndex += deleting ? -1 : 1;
        target.textContent = phrase.slice(0, Math.max(0, charIndex));
        let delay = deleting ? 35 : 68;
        if (!deleting && charIndex >= phrase.length) { deleting = true; delay = 1450; }
        else if (deleting && charIndex <= 0) { deleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; delay = 260; }
        window.setTimeout(tick, delay);
      };
      window.setTimeout(tick, 500 + targetIndex * 220);
    });
  }

  // Recent project strip: rotate featured cards so additional work can be browsed.
  const recentGrid = document.getElementById("recent-project-grid");
  if (recentGrid && recentGrid.children.length > 1) {
    const previous = document.getElementById("recent-prev"), next = document.getElementById("recent-next");
    const move = direction => {
      if (direction > 0) recentGrid.appendChild(recentGrid.firstElementChild);
      else recentGrid.insertBefore(recentGrid.lastElementChild, recentGrid.firstElementChild);
      recentGrid.classList.remove("carousel-refresh"); void recentGrid.offsetWidth; recentGrid.classList.add("carousel-refresh");
    };
    if (previous) previous.addEventListener("click", () => move(-1));
    if (next) next.addEventListener("click", () => move(1));
    let autoRotate = window.setInterval(() => move(1), 5000);
    recentGrid.addEventListener("mouseenter", () => window.clearInterval(autoRotate));
    recentGrid.addEventListener("mouseleave", () => { window.clearInterval(autoRotate); autoRotate = window.setInterval(() => move(1), 5000); });
    recentGrid.addEventListener("focusin", () => window.clearInterval(autoRotate));
    recentGrid.addEventListener("focusout", () => { window.clearInterval(autoRotate); autoRotate = window.setInterval(() => move(1), 5000); });
  }

  // Accessible floating back-to-top control.
  const backTop = document.createElement("button");
  backTop.type = "button"; backTop.className = "back-to-top"; backTop.setAttribute("aria-label", "Back to top"); backTop.title = "Back to top"; backTop.innerHTML = "↑<span>Top</span>";
  document.body.appendChild(backTop);
  const updateBackTop = () => backTop.classList.toggle("is-visible", window.scrollY > 420);
  window.addEventListener("scroll", updateBackTop, { passive: true }); updateBackTop();
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();
