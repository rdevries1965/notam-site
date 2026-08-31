const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "analytics.js"), "utf8");

function run(endpoint) {
  const appended = [];
  const context = {
    URL,
    window: { location: { pathname: "/briefing.html", search: "?task=secret" } },
    document: {
      referrer: "https://previous.example/flight?task=secret-coordinates",
      createElement: (tagName) => ({ dataset: {}, tagName }),
      head: { appendChild: (node) => appended.push(node) }
    }
  };
  const configured = source.replace(
    /const GOATCOUNTER_ENDPOINT = "[^"]*";/,
    `const GOATCOUNTER_ENDPOINT = ${JSON.stringify(endpoint)};`
  );
  vm.runInNewContext(configured, context);
  return { context, appended };
}

test("analytics is inert while no real endpoint is configured", () => {
  const result = run("");
  assert.equal(result.appended.length, 0);
  assert.equal(result.context.window.goatcounter, undefined);
});

test("repository config uses the official GoatCounter endpoint", () => {
  assert.match(
    source,
    /const GOATCOUNTER_ENDPOINT = "https:\/\/zuluecho\.goatcounter\.com\/count";/
  );
});

test("configured analytics loads official script asynchronously and sends pathname only", () => {
  const endpoint = "https://real-site-code.goatcounter.com/count";
  const result = run(endpoint);
  assert.equal(result.appended.length, 2);
  assert.equal(result.appended[0].tagName, "meta");
  assert.equal(result.appended[0].name, "referrer");
  assert.equal(result.appended[0].content, "no-referrer");
  assert.equal(result.appended[1].src, "https://gc.zgo.at/count.js");
  assert.equal(result.appended[1].async, true);
  assert.equal(result.appended[1].referrerPolicy, "no-referrer");
  assert.equal(result.appended[1].dataset.goatcounter, endpoint);
  assert.equal(result.context.window.goatcounter.no_events, true);
  assert.equal(result.context.window.goatcounter.referrer, "");
  assert.equal(result.context.window.goatcounter.path(), "/briefing.html");
  assert.doesNotMatch(result.context.window.goatcounter.path(), /secret/);
});

test("invalid or non-HTTPS endpoints cannot load analytics", () => {
  for (const endpoint of ["not-a-url", "http://example.test/count", "https://example.test/other"]) {
    assert.equal(run(endpoint).appended.length, 0);
  }
});

test("a sensitive document referrer cannot be sent to GoatCounter", () => {
  const result = run("https://real-site-code.goatcounter.com/count");
  assert.match(result.context.document.referrer, /task=secret-coordinates/);
  assert.equal(result.context.window.goatcounter.referrer, "");
  assert.doesNotMatch(
    JSON.stringify(result.context.window.goatcounter),
    /secret-coordinates|previous\.example/
  );
});

test("only user-facing pages are instrumented and privacy text is in Help", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const briefing = fs.readFileSync(path.join(root, "briefing.html"), "utf8");
  const validation = fs.readFileSync(path.join(root, "validation.html"), "utf8");
  assert.match(index, /<script src="analytics\.js" defer><\/script>/);
  assert.match(briefing, /<script src="analytics\.js" defer><\/script>/);
  assert.doesNotMatch(validation, /analytics\.js/);
  assert.match(index, /cookie-free aggregate visitor statistics/);
  assert.doesNotMatch(index + briefing, /data-goatcounter-click|visitor count/i);
});

test("analytics cannot inspect operational state or URL query data", () => {
  assert.doesNotMatch(source, /location\.search|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /querySelector|getElementById|addEventListener/);
  assert.match(source, /no_events:\s*true/);
  assert.match(source, /referrer:\s*""/);
});

test("analytics is not a required service-worker shell resource", () => {
  const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const core = worker.match(/const CORE=\[(.*?)\];/s)[1];
  assert.doesNotMatch(core, /analytics|goatcounter|gc\.zgo\.at/);
  assert.match(worker, /data\/notams-live\.json/);
  assert.match(worker, /fetch\(request,\{cache:'no-store'\}\)/);
});
