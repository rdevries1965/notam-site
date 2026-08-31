# Soaring NOTAM public site

Static GitHub Pages deployment for <https://notam.rdevries.info>. The authoritative development source is the private `rdevries1965/NOTAM` repository; its publisher copies the approved runtime asset set into this repository.

## GoatCounter configuration

Analytics is disabled by default. After creating the GoatCounter site for `notam.rdevries.info`, open `analytics.js` and set `GOATCOUNTER_ENDPOINT` to the complete HTTPS count endpoint shown by GoatCounter. It has the form `https://<your-site-code>.goatcounter.com/count`. This is the only analytics configuration value.

The official GoatCounter script is loaded asynchronously only when that value is a valid HTTPS `/count` URL. It reports the page pathname and GoatCounter's normal aggregate page-view metadata. Query parameters, task state, route coordinates, turnpoints, briefing settings, NOTAM contents and FAA data are not read or sent. Automatic click/event tracking is disabled.

`index.html` and the user-facing print page `briefing.html` are instrumented. The developer-only `validation.html` page is intentionally excluded.

The application remains fully functional when the endpoint is unset, blocked or unavailable. No analytics resource is part of the service worker's required application shell. When the authoritative publisher next updates this deployment, the same `analytics.js` asset and the two script tags must also be present in the private source repository's publish manifest to preserve the integration.
