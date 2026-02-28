(() => {
  const CONTENT_URL = "assets/data/site-content.json";
  let currentBookingUrl = "mailto:as@hutech.ventures";
  let currentCtaConfig = {
    primary_label: "Email us",
    secondary_label: "View case study",
    helper_text: "Email us only: as@hutech.ventures"
  };
  const BOOKING_UTM_DEFAULTS = {
    utm_source: "incubation_studio_site",
    utm_medium: "website",
    utm_campaign: "studio_launch"
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const analytics = window.HuTechAnalytics;
    const page = document.body?.dataset.page || "unknown";

    if (analytics) {
      analytics.init({ page });
    }

    setCurrentYear();
    setupRevealAnimations();
    setupStickyCtaVisibility();

    if (page === "home") {
      const content = await loadContent();

      if (content) {
        applyHomeContent(content);
      }

      setupCaseTracking(analytics);
      setupCaseSectionTracking(analytics);
    }

    setupBookingLinkTracking(analytics);
  }

  async function loadContent() {
    try {
      const response = await fetch(CONTENT_URL, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Unexpected status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("Failed to load site content JSON; using static fallbacks.", error);
      return null;
    }
  }

  function applyHomeContent(content) {
    const site = content.site || {};

    setText("hero-headline", site.hero_headline);
    setText("hero-subhead", site.hero_subhead);
    setText("contact-email", site.contact_email);

    const contactEmailLink = document.getElementById("contact-email");
    if (contactEmailLink && site.contact_email) {
      contactEmailLink.setAttribute("href", `mailto:${site.contact_email}`);
    }

    applyCtaContent(content.cta, site.contact_email, site.booking_url);
    applyBrandDistinction(content.brand_distinction);

    if (Array.isArray(content.trust_signals) && content.trust_signals.length > 0) {
      renderTrustSignals(content.trust_signals);
    }

    if (Array.isArray(content.capabilities) && content.capabilities.length > 0) {
      renderCapabilities(content.capabilities);
    }

    if (Array.isArray(content.process_steps) && content.process_steps.length > 0) {
      renderProcessSteps(content.process_steps);
    }

    if (Array.isArray(content.case_studies) && content.case_studies.length > 0) {
      renderCaseStudies(content.case_studies);
    }

    if (content.seo) {
      applySeo(content.seo);
    }

    if (site.studio_name) {
      document.querySelectorAll(".brand span").forEach((node) => {
        node.textContent = site.studio_name;
      });
    }
  }

  function applyCtaContent(cta, contactEmail, fallbackUrl) {
    if (cta && typeof cta === "object") {
      currentCtaConfig = {
        ...currentCtaConfig,
        ...cta
      };

      setText("hero-email-cta", currentCtaConfig.primary_label);
      setText("final-email-cta", currentCtaConfig.primary_label);
      setText("hero-secondary-cta", currentCtaConfig.secondary_label);
      setText("hero-cta-helper", currentCtaConfig.helper_text);
    }

    if (contactEmail) {
      currentBookingUrl = `mailto:${contactEmail}`;
      setBookingBaseLinks(currentBookingUrl);
      return;
    }

    if (fallbackUrl) {
      currentBookingUrl = fallbackUrl;
      setBookingBaseLinks(currentBookingUrl);
    }
  }

  function applyBrandDistinction(brandDistinction) {
    if (!brandDistinction || typeof brandDistinction !== "object") {
      return;
    }

    setText("brand-distinction-text", brandDistinction.message);

    const link = document.getElementById("hutech-tech-link");
    if (!link) {
      return;
    }

    const url = brandDistinction.hutech_tech_url || "";
    if (typeof url === "string" && url.trim().length > 0) {
      link.href = url;
      link.hidden = false;
    } else {
      link.hidden = true;
    }
  }

  function renderTrustSignals(trustSignals) {
    const list = document.getElementById("trust-signal-list");
    if (!list) {
      return;
    }

    list.innerHTML = "";
    trustSignals.forEach((signal) => {
      const item = document.createElement("li");
      item.className = "trust-chip";

      const label = document.createElement("span");
      label.className = "trust-label";
      label.textContent = signal.label || "";

      const value = document.createElement("strong");
      value.textContent = signal.value || "";

      item.appendChild(label);
      item.appendChild(value);
      list.appendChild(item);
    });
  }

  function renderCapabilities(capabilities) {
    const list = document.getElementById("capability-list");
    if (!list) {
      return;
    }

    list.innerHTML = "";

    capabilities.forEach((capability) => {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      title.textContent = capability.title || "Capability";

      const description = document.createTextNode(` ${capability.description || ""}`);
      item.appendChild(title);
      item.appendChild(description);
      list.appendChild(item);
    });
  }

  function renderProcessSteps(steps) {
    const grid = document.getElementById("process-grid");
    if (!grid) {
      return;
    }

    grid.innerHTML = "";

    steps.forEach((step, index) => {
      const article = document.createElement("article");
      article.className = "process-step";
      article.setAttribute("data-reveal", "");

      const stepNumber = document.createElement("p");
      stepNumber.className = "step-number";
      stepNumber.textContent = step.step || String(index + 1).padStart(2, "0");

      const heading = document.createElement("h3");
      heading.textContent = step.title || "Step";

      const desc = document.createElement("p");
      desc.textContent = step.description || "";

      article.appendChild(stepNumber);
      article.appendChild(heading);
      article.appendChild(desc);
      grid.appendChild(article);
    });

    setupRevealAnimations();
  }

  function renderCaseStudies(caseStudies) {
    const grid = document.getElementById("case-grid");
    if (!grid) {
      return;
    }

    grid.innerHTML = "";

    caseStudies.forEach((caseStudy) => {
      const card = document.createElement("article");
      card.className = "case-card";
      card.dataset.caseId = caseStudy.id || "unknown-case";
      card.setAttribute("data-reveal", "");

      const typePill = document.createElement("p");
      typePill.className = "case-type";
      typePill.textContent = caseStudy.audience_type || "Internal";

      const title = document.createElement("h3");
      title.textContent = caseStudy.title || "Case Study";

      const problem = createLabeledParagraph("Problem", caseStudy.problem);
      const prototype = createLabeledParagraph("Prototype", caseStudy.prototype);
      const outcome = createLabeledParagraph("Outcome", caseStudy.outcome);

      const metrics = document.createElement("p");
      metrics.innerHTML = `<strong>Metrics:</strong> ${escapeHtml(caseStudy.metrics || "Evidence is available on request.")}`;

      card.appendChild(typePill);
      card.appendChild(title);
      card.appendChild(problem);
      card.appendChild(prototype);
      card.appendChild(outcome);
      card.appendChild(metrics);

      if (caseStudy.confidentiality !== "public" || caseStudy.redaction_note) {
        const note = document.createElement("p");
        note.className = "redaction-note";
        note.textContent = caseStudy.redaction_note || "Sensitive implementation details are intentionally redacted.";
        card.appendChild(note);
      }

      const cta = document.createElement("a");
      cta.className = "btn btn-secondary js-booking-link js-case-cta";
      cta.dataset.source = `case_card_${caseStudy.id || "unknown"}`;
      cta.dataset.baseHref = currentBookingUrl;
      cta.href = buildCtaHref(currentBookingUrl, cta.dataset.source);
      if (isHttpUrl(currentBookingUrl)) {
        cta.target = "_blank";
        cta.rel = "noopener";
      }
      cta.textContent = caseStudy.cta_label || "Discuss a similar challenge";
      card.appendChild(cta);

      grid.appendChild(card);
    });

    setupRevealAnimations();
  }

  function applySeo(seo) {
    if (seo.title) {
      document.title = seo.title;
    }

    setMetaTag('meta[name="description"]', seo.description);
    setMetaTag('meta[property="og:title"]', seo.og_title);
    setMetaTag('meta[property="og:description"]', seo.og_description);
    setMetaTag('meta[name="twitter:title"]', seo.og_title);
    setMetaTag('meta[name="twitter:description"]', seo.og_description);

    if (seo.canonical_url) {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute("href", seo.canonical_url);
      }
    }
  }

  function setupBookingLinkTracking(analytics) {
    document.querySelectorAll(".js-booking-link").forEach((link) => {
      if (link.dataset.bound === "1") {
        return;
      }

      link.dataset.bound = "1";
      link.dataset.baseHref = link.dataset.baseHref || link.getAttribute("href") || "";
      updateBookingHref(link);

      link.addEventListener("click", () => {
        const source = link.dataset.source || "unknown";
        const caseCard = link.closest(".case-card");
        const caseId = caseCard?.dataset.caseId || "";
        const section = link.closest("section")?.id || document.body?.dataset.page || "site";

        updateBookingHref(link);

        if (analytics) {
          analytics.trackOutboundBooking(link.href, source);

          if (link.classList.contains("js-case-cta")) {
            analytics.trackCaseCtaClick(caseId, link.textContent.trim());
          }

          if (link.classList.contains("js-sticky-cta")) {
            analytics.trackStickyCtaClick("floating", section);
          }
        }
      });
    });
  }

  function setupCaseTracking(analytics) {
    if (!analytics || !("IntersectionObserver" in window)) {
      return;
    }

    const caseCards = document.querySelectorAll(".case-card");
    if (caseCards.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.55) {
            return;
          }

          const card = entry.target;
          const caseId = card.dataset.caseId || "unknown";
          const caseTitle = card.querySelector("h3")?.textContent || "";

          analytics.trackCaseCardView(caseId, caseTitle);
          observer.unobserve(card);
        });
      },
      {
        threshold: [0.55]
      }
    );

    caseCards.forEach((card) => observer.observe(card));
  }

  function setupCaseSectionTracking(analytics) {
    if (!analytics || !("IntersectionObserver" in window)) {
      return;
    }

    const section = document.getElementById("case-studies");
    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            analytics.trackSectionView("case_studies");
            observer.unobserve(section);
          }
        });
      },
      {
        threshold: [0.35]
      }
    );

    observer.observe(section);
  }

  function setupStickyCtaVisibility() {
    const stickyCta = document.querySelector(".js-sticky-cta");
    if (!stickyCta) {
      return;
    }

    let threshold = Math.max(280, Math.round(window.innerHeight * 0.6));
    let ticking = false;

    const updateVisibility = () => {
      stickyCta.classList.toggle("is-visible", window.scrollY > threshold);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      threshold = Math.max(280, Math.round(window.innerHeight * 0.6));
      updateVisibility();
    });

    updateVisibility();
  }

  function setupRevealAnimations() {
    const targets = document.querySelectorAll("[data-reveal]");
    if (targets.length === 0) {
      return;
    }

    targets.forEach((target) => {
      target.classList.add("reveal");
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
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
        threshold: 0.15
      }
    );

    targets.forEach((target) => {
      if (!target.dataset.revealObserved) {
        target.dataset.revealObserved = "1";
        observer.observe(target);
      }
    });
  }

  function setCurrentYear() {
    const year = new Date().getFullYear();
    document.querySelectorAll(".js-year").forEach((node) => {
      node.textContent = String(year);
    });
  }

  function setBookingBaseLinks(bookingUrl) {
    document.querySelectorAll(".js-booking-link").forEach((link) => {
      link.dataset.baseHref = bookingUrl;
      const source = link.dataset.source || "unknown";
      link.setAttribute("href", buildCtaHref(bookingUrl, source));

      if (isHttpUrl(bookingUrl)) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
      } else {
        link.removeAttribute("target");
        link.removeAttribute("rel");
      }
    });
  }

  function updateBookingHref(link) {
    const baseHref = link.dataset.baseHref || link.getAttribute("href") || "";
    const source = link.dataset.source || "unknown";
    link.setAttribute("href", buildCtaHref(baseHref, source));
  }

  function buildCtaHref(url, source) {
    if (isMailtoUrl(url)) {
      return withMailtoParams(url);
    }

    return withTrackingParams(url, {
      ...BOOKING_UTM_DEFAULTS,
      utm_content: source
    });
  }

  function withTrackingParams(url, params) {
    if (!url) {
      return url;
    }

    try {
      const target = new URL(url, window.location.href);
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          target.searchParams.set(key, value);
        }
      });
      return target.toString();
    } catch (error) {
      return url;
    }
  }

  function withMailtoParams(url) {
    if (!url) {
      return url;
    }

    try {
      const target = new URL(url, window.location.href);
      return `mailto:${target.pathname}`;
    } catch (error) {
      return url;
    }
  }

  function isMailtoUrl(url) {
    return /^mailto:/i.test(url);
  }

  function isHttpUrl(url) {
    return /^https?:/i.test(url);
  }

  function setText(id, value) {
    if (!value) {
      return;
    }

    const node = document.getElementById(id);
    if (node) {
      node.textContent = value;
    }
  }

  function setMetaTag(selector, value) {
    if (!value) {
      return;
    }

    const meta = document.querySelector(selector);
    if (meta) {
      meta.setAttribute("content", value);
    }
  }

  function createLabeledParagraph(label, value) {
    const paragraph = document.createElement("p");
    paragraph.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || "")}`;
    return paragraph;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
