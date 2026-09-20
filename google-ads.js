(() => {
  const conversionId = "AW-18412968554";
  const conversionLabel = "icokCLHGkf4cEOq0_stE";
  const conversionSendTo = `${conversionId}/${conversionLabel}`;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", conversionId);

  window.gtag_report_conversion = function gtagReportConversion(url) {
    let hasNavigated = false;

    const navigate = () => {
      if (hasNavigated) {
        return;
      }

      hasNavigated = true;

      if (typeof url !== "undefined") {
        window.location.href = url;
      }
    };

    if (typeof window.gtag !== "function") {
      navigate();
      return false;
    }

    window.gtag("event", "conversion", {
      send_to: conversionSendTo,
      event_callback: navigate,
      event_timeout: 2000
    });

    window.setTimeout(navigate, 2000);
    return false;
  };

  const bindConversionLinks = () => {
    document.querySelectorAll("[data-google-ads-conversion]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        window.gtag_report_conversion(link.href);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindConversionLinks, { once: true });
  } else {
    bindConversionLinks();
  }
})();
