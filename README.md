# Soaring NOTAM V2.6

Task-oriented soaring briefing for a selected date, local briefing window, maximum altitude, route and corridor. FAA NMS staging is the primary NOTAM source. OpenAIP supplies baseline airspace; baseline presence is not itself proof of current activation.

## Operational map

Task-relevant FAA centre/radius geometry is drawn as a circle, reliable Polygon/MultiPolygon geometry as an area, and a source point without radius as a marker. Unsupported geometry is omitted rather than invented. Transparent red, orange and yellow styling represents operational significance (critical, uncertain, and high temporary activity); subdued outlines retain baseline context. Selecting map geometry selects and reveals its briefing card. Selecting a NOTAM card highlights and locates its map object with a conservative maximum zoom.

The normal UI remains task-first: date, briefing window, maximum altitude, task and corridor determine the result. It is not intended as a generic NOTAM database browser.

## Independent validation

[`validation.html`](validation.html) is a developer/debug comparator. It compares normalized records by NOTAM identifier and reports presence, validity times, altitude, geometry type, classification and Q-code as `MATCH`, `INVESTIGATE`, or a documented `EXPECTED DIFFERENCE`. Comparator data never changes the production briefing engine.

The reproducible initial case is stored in [`validation-data/ehhv-demo-reference.json`](validation-data/ehhv-demo-reference.json): EHHV, 2026-08-21, 10:00–18:00 Europe/Amsterdam, 6000 ft, 25 km, using the documented central/eastern Netherlands demo triangle. Its SkyGlider capture is deliberately marked `PENDING MANUAL CAPTURE` until a human records the independent result; the application never scrapes SkyGlider at runtime. To repeat the comparison, open the task in Soaring NOTAM, record the identifiers and fields shown by SkyGlider, add those records to a dated validation fixture, and inspect every disagreement rather than assuming either source is correct.

Future fixtures may use Helispot, LVNL Homebriefing/official PIB, or EUROCONTROL EAD without changing the production engine. An official PIB should ultimately receive the highest validation weight. SkyGlider, Helispot and other third-party sites are independent comparators, not production dependencies.

## Limitations

- FAA NMS is a staging service and remains subject to source availability and source geometry quality.
- Point-only markers show a known source location, not an affected area.
- Geometry comparison currently compares availability/type; detailed coordinate tolerance is left for a later validation fixture with trustworthy matching geometries.
- `NO ACTIVATION FOUND` never means confirmed inactive.
- Independent comparator captures are time-sensitive and require provenance and a capture timestamp.
