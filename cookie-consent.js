(() => {
  const config = window.SITE_ANALYTICS_CONFIG;
  if (!config || !config.measurementId || !config.consentCookie) return;

  const consentScript = document.currentScript;
  const adsId = consentScript?.dataset.adsId || "";
  const adsHelper = consentScript?.dataset.adsHelper || "";
  const isPortfolio = location.hostname.includes("jiwon-lee-portfolio");
  const maxAge = 60 * 60 * 24 * 183;
  const cookieName = config.consentCookie;
  const text = {
    en: {
      title: "Cookies",
      intro: `GA4 analytics${adsId ? " and Shop ad-click measurement" : ""} start only if allowed.<br><a href="/privacy.html">Privacy Policy</a> · choice saved for 6 months.`,
      analytics: "Site analytics (Google Analytics 4)",
      ads: "Advertising conversion measurement (Shop only)",
      allow: "Allow",
      reject: "Reject",
      settings: "Settings",
      save: "Save choices",
      back: "Back",
      privacy: "Privacy Policy",
      cookieSettings: "Cookie settings",
      status: "Your choice is stored only in this browser."
    },
    ko: {
      title: "쿠키",
      intro: `방문 분석${adsId ? "과 Shop 광고 클릭 측정" : " (GA4)"}은 허용하신 경우에만 실행됩니다.<br><a href="/privacy.html">개인정보처리방침</a> · 선택 사항은 6개월간 저장됩니다.`,
      analytics: "사이트 방문 분석 (Google Analytics 4)",
      ads: "광고 전환 클릭 측정 (Shop에만 적용)",
      allow: "허용",
      reject: "거부",
      settings: "설정",
      save: "선택 저장",
      back: "돌아가기",
      privacy: "개인정보처리방침",
      cookieSettings: "쿠키 설정",
      status: "선택은 이 브라우저에만 저장됩니다."
    }
  };
  const language = () => document.documentElement.dataset.lang === "en" || document.documentElement.lang === "en" ? "en" : "ko";
  const parseChoice = () => {
    const pair = document.cookie.split(";").map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`));
    if (!pair) return null;
    try {
      const value = JSON.parse(decodeURIComponent(pair.slice(cookieName.length + 1)));
      if (typeof value.analytics !== "boolean" || typeof value.ads !== "boolean") return null;
      return { analytics: value.analytics, ads: value.ads && Boolean(adsId) };
    } catch {
      return null;
    }
  };
  const writeChoice = choice => {
    let cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(choice))}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
    if (location.hostname.endsWith("seori.studio")) cookie += "; Domain=.seori.studio";
    if (location.protocol === "https:") cookie += "; Secure";
    document.cookie = cookie;
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });

  let libraryRequested = false;
  let analyticsConfigured = false;
  let adsConfigured = false;
  let adsHelperRequested = false;
  const appendGoogleLibrary = () => {
    if (libraryRequested) return;
    libraryRequested = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`;
    document.head.appendChild(script);
    window.gtag("js", new Date());
  };
  const loadAdsHelper = () => {
    if (!adsHelper || adsHelperRequested) return;
    adsHelperRequested = true;
    const script = document.createElement("script");
    script.src = adsHelper;
    document.head.appendChild(script);
  };
  const clearGoogleCookies = () => {
    const names = document.cookie.split(";").map(value => value.trim().split("=")[0]);
    for (const name of names) {
      if (!/^(_ga($|_)|_gid$|_gat($|_)|_gcl_)/.test(name)) continue;
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      if (location.hostname.endsWith("seori.studio")) {
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.seori.studio; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      }
    }
  };
  const applyChoice = (choice, persist) => {
    const next = { analytics: Boolean(choice.analytics), ads: Boolean(choice.ads && adsId) };
    window.siteTrackingConsent = next;
    if (persist) writeChoice(next);
    window.gtag("consent", "update", {
      analytics_storage: next.analytics ? "granted" : "denied",
      ad_storage: next.ads ? "granted" : "denied",
      ad_user_data: next.ads ? "granted" : "denied",
      ad_personalization: "denied"
    });
    if (next.analytics || next.ads) {
      appendGoogleLibrary();
      if (next.analytics && !analyticsConfigured) {
        analyticsConfigured = true;
        window.gtag("config", config.measurementId);
      }
      if (next.ads && !adsConfigured) {
        adsConfigured = true;
        window.gtag("config", adsId);
        loadAdsHelper();
      }
    } else {
      clearGoogleCookies();
    }
  };

  const banner = document.createElement("section");
  banner.id = "site-cookie-banner";
  banner.className = "site-cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-labelledby", "site-cookie-title");
  banner.setAttribute("aria-describedby", "site-cookie-intro");
  banner.hidden = true;
  banner.innerHTML = `
    <div class="site-cookie-panel">
      <div class="site-cookie-copy">
        <h2 id="site-cookie-title"></h2>
        <p id="site-cookie-intro"></p>
        <p class="site-cookie-status" id="site-cookie-status"></p>
      </div>
      <div class="site-cookie-controls">
        <div class="site-cookie-actions">
          <button type="button" class="site-cookie-button site-cookie-button--primary" data-consent-allow></button>
          <button type="button" class="site-cookie-button" data-consent-reject></button>
          <button type="button" class="site-cookie-text-button" data-consent-toggle aria-expanded="false" aria-controls="site-cookie-settings"></button>
        </div>
        <div id="site-cookie-settings" class="site-cookie-settings" hidden>
          <label><input type="checkbox" data-consent-analytics><span data-consent-label="analytics"></span></label>
          <label data-consent-ads-row><input type="checkbox" data-consent-ads><span data-consent-label="ads"></span></label>
          <div class="site-cookie-settings-actions">
            <button type="button" class="site-cookie-button site-cookie-button--primary" data-consent-save></button>
            <button type="button" class="site-cookie-text-button" data-consent-back></button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(banner);

  const analyticsBox = banner.querySelector("[data-consent-analytics]");
  const adsBox = banner.querySelector("[data-consent-ads]");
  const settings = banner.querySelector("#site-cookie-settings");
  const toggle = banner.querySelector("[data-consent-toggle]");
  const copyLabels = () => {
    const words = text[language()];
    banner.querySelector("#site-cookie-title").textContent = words.title;
    banner.querySelector("#site-cookie-intro").innerHTML = words.intro;
    banner.querySelector("#site-cookie-status").textContent = words.status;
    banner.querySelector("[data-consent-allow]").textContent = words.allow;
    banner.querySelector("[data-consent-reject]").textContent = words.reject;
    toggle.textContent = words.settings;
    banner.querySelector("[data-consent-label=analytics]").textContent = words.analytics;
    banner.querySelector("[data-consent-label=ads]").textContent = words.ads;
    banner.querySelector("[data-consent-save]").textContent = words.save;
    banner.querySelector("[data-consent-back]").textContent = words.back;
    document.querySelectorAll("[data-cookie-text]").forEach(node => {
      node.textContent = node.dataset.cookieText === "privacy" ? words.privacy : words.cookieSettings;
    });
    banner.querySelector("[data-consent-ads-row]").hidden = !adsId;
  };
  const reveal = () => {
    const current = parseChoice();
    analyticsBox.checked = Boolean(current?.analytics);
    adsBox.checked = Boolean(current?.ads);
    banner.hidden = false;
    copyLabels();
    const open = !settings.hidden;
    if (open) analyticsBox.focus();
    else banner.querySelector("[data-consent-allow]").focus();
  };
  const close = () => { banner.hidden = true; settings.hidden = true; toggle.setAttribute("aria-expanded", "false"); };
  const choose = choice => { applyChoice(choice, true); close(); };

  banner.querySelector("[data-consent-allow]").addEventListener("click", () => choose({ analytics: true, ads: Boolean(adsId) }));
  banner.querySelector("[data-consent-reject]").addEventListener("click", () => choose({ analytics: false, ads: false }));
  banner.querySelector("[data-consent-save]").addEventListener("click", () => choose({ analytics: analyticsBox.checked, ads: adsBox.checked }));
  toggle.addEventListener("click", () => {
    settings.hidden = !settings.hidden;
    toggle.setAttribute("aria-expanded", String(!settings.hidden));
    if (!settings.hidden) {
      const current = parseChoice();
      analyticsBox.checked = Boolean(current?.analytics);
      adsBox.checked = Boolean(current?.ads);
      analyticsBox.focus();
    }
  });
  banner.querySelector("[data-consent-back]").addEventListener("click", () => { settings.hidden = true; toggle.setAttribute("aria-expanded", "false"); });
  document.querySelectorAll("[data-cookie-settings]").forEach(button => button.addEventListener("click", reveal));
  new MutationObserver(copyLabels).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
  copyLabels();

  const saved = parseChoice();
  if (saved) applyChoice(saved, false);
  else reveal();
})();


(() => {
  document.addEventListener("click", event => {
    const link = event.target.closest && event.target.closest('a[href^="mailto:"]');
    if (!link || window.siteTrackingConsent?.analytics !== true || typeof window.gtag !== "function") return;
    window.gtag("event", "email_click", { link_url: link.href, page_path: location.pathname });
  });
})();

(() => {
  if (!location.hostname.endsWith("seori.studio")) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = "/_vercel/insights/script.js";
  document.head.appendChild(script);
})();
