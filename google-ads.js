(() => {
  const conversionId = "AW-18412968554";
  const conversionLabels = new Map([
    ["smartstore-click", "icokCLHGkf4cEOq0_stE"],
    ["etsy-click", "8Yz9CK_D24sdEOq0_stE"]
  ]);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", conversionId);

  const bindConversionLinks = () => {
    document.querySelectorAll("[data-google-ads-conversion]").forEach((link) => {
      const conversionLabel = conversionLabels.get(link.dataset.googleAdsConversion);

      if (!conversionLabel) {
        return;
      }

      link.addEventListener("click", () => {
        if (typeof window.gtag !== "function") {
          return;
        }

        window.gtag("event", "conversion", {
          send_to: `${conversionId}/${conversionLabel}`
        });
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindConversionLinks, { once: true });
  } else {
    bindConversionLinks();
  }
})();
