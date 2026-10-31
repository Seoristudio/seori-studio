(() => {
  const conversionId = "AW-18412968554";
  const conversionLabels = new Map([
    ["smartstore-click", "icokCLHGkf4cEOq0_stE"],
    ["etsy-click", "8Yz9CK_D24sdEOq0_stE"]
  ]);

  const bindConversionLinks = () => {
    document.querySelectorAll("[data-google-ads-conversion]").forEach((link) => {
      const conversionLabel = conversionLabels.get(link.dataset.googleAdsConversion);
      if (!conversionLabel || link.dataset.adsConsentBound === "true") return;
      link.dataset.adsConsentBound = "true";
      link.addEventListener("click", () => {
        if (window.siteTrackingConsent?.ads !== true || typeof window.gtag !== "function") return;
        window.gtag("event", "conversion", { send_to: `${conversionId}/${conversionLabel}` });
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindConversionLinks, { once: true });
  } else {
    bindConversionLinks();
  }
})();
