(() => {
  const EVENTS = {
    PAGE_VIEW: "page_view",
    CASE_CARD_VIEW: "case_card_view",
    CASE_CTA_CLICK: "case_cta_click",
    STICKY_BOOKING_CTA_CLICK: "sticky_booking_cta_click",
    OUTBOUND_BOOKING_CLICK: "outbound_booking_click"
  };

  const state = {
    pageViewSent: false,
    seenCaseCards: new Set(),
    seenSections: new Set()
  };

  function isDevHost() {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }

  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || ""
    };
  }

  function send(eventName, payload) {
    if (typeof window.plausible === "function") {
      window.plausible(eventName, { props: payload });
      return;
    }

    if (isDevHost()) {
      console.info("[analytics]", eventName, payload);
    }
  }

  function init(config = {}) {
    if (state.pageViewSent) {
      return;
    }

    const page = config.page || document.body?.dataset.page || "unknown";
    send(EVENTS.PAGE_VIEW, {
      page,
      referrer: document.referrer || "",
      ...getUtmParams()
    });

    state.pageViewSent = true;
  }

  function track(eventName, payload = {}) {
    send(eventName, payload);
  }

  function trackCaseCardView(caseId, caseTitle) {
    if (!caseId || state.seenCaseCards.has(caseId)) {
      return;
    }

    state.seenCaseCards.add(caseId);
    send(EVENTS.CASE_CARD_VIEW, {
      case_id: caseId,
      case_title: caseTitle || ""
    });
  }

  function trackCaseCtaClick(caseId, ctaLabel) {
    if (!caseId) {
      return;
    }

    send(EVENTS.CASE_CTA_CLICK, {
      case_id: caseId,
      cta_label: ctaLabel || ""
    });
  }

  function trackStickyCtaClick(location, sourceSection) {
    send(EVENTS.STICKY_BOOKING_CTA_CLICK, {
      location: location || "floating",
      source_section: sourceSection || "unknown"
    });
  }

  function trackOutboundBooking(destination, source) {
    send(EVENTS.OUTBOUND_BOOKING_CLICK, {
      destination: destination || "",
      source: source || "unknown"
    });
  }

  function trackSectionView(sectionId) {
    if (!sectionId || state.seenSections.has(sectionId)) {
      return;
    }

    state.seenSections.add(sectionId);
    send("case_study_section_view", {
      section: sectionId
    });
  }

  window.HuTechAnalytics = Object.freeze({
    EVENTS,
    init,
    track,
    trackCaseCardView,
    trackCaseCtaClick,
    trackStickyCtaClick,
    trackOutboundBooking,
    trackSectionView
  });
})();
