(function () {
  "use strict";

  // After creating the GoatCounter site, paste its complete /count URL here.
  // Leave empty to disable analytics without affecting the application.
  const GOATCOUNTER_ENDPOINT = "";

  function validEndpoint(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.pathname === "/count";
    } catch (_) {
      return false;
    }
  }

  if (!validEndpoint(GOATCOUNTER_ENDPOINT)) return;

  // Suppress the HTTP Referer header for the analytics script and its request.
  // This is added only when analytics is enabled, before any remote code loads.
  const referrerPolicy = document.createElement("meta");
  referrerPolicy.name = "referrer";
  referrerPolicy.content = "no-referrer";
  document.head.appendChild(referrerPolicy);

  // Deliberately report only the pathname. Query parameters and all application
  // state (task, route, briefing settings and NOTAM data) stay in the browser.
  window.goatcounter = {
    no_events: true,
    referrer: "",
    path: function () {
      return window.location.pathname || "/";
    }
  };

  const script = document.createElement("script");
  script.async = true;
  script.referrerPolicy = "no-referrer";
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = GOATCOUNTER_ENDPOINT;
  script.onerror = function () {};
  document.head.appendChild(script);
})();
