const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// Harness
//
// jsdom does not share top-level const bindings across separate external
// <script> tags. We combine config.js + data.js + app.js into a single inline
// script. All text splicing uses split/join (NOT .replace) to avoid $ corruption.
// ---------------------------------------------------------------------------

function buildScript() {
  const config = fs.readFileSync(path.join(ROOT, "js", "config.js"), "utf8");
  const data = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8");
  let app = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");

  const hook =
    "  window.__trip = {\n" +
    "    state: state,\n" +
    "    init: init,\n" +
    "    renderAll: renderAll,\n" +
    "    renderHero: renderHero,\n" +
    "    renderOverview: renderOverview,\n" +
    "    renderTimeline: renderTimeline,\n" +
    "    setLang: setLang,\n" +
    "    t: t,\n" +
    "    escapeHtml: escapeHtml,\n" +
    "    parseDate: parseDate,\n" +
    "    buildDayMap: buildDayMap,\n" +
    "    TRIP: TRIP,\n" +
    "    TRIP_CONFIG: TRIP_CONFIG\n" +
    "  };\n";

  app = app.split('  document.addEventListener("DOMContentLoaded", init);')
    .join(hook + '\n  document.addEventListener("DOMContentLoaded", init);');

  return config + "\n" + data + "\n" + app;
}

function makeDom() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const inline = buildScript().split("</script>").join("<\\/script>");
  const processed = html
    .replace(/<script src="[^"]*"><\/script>/g, "")
    .split("</body>").join("<script>" + inline + "</script></body>");

  const vc = new VirtualConsole();
  vc.on("jsdomError", () => {});
  const dom = new JSDOM(processed, {
    runScripts: "dangerously",
    url: "http://localhost/",
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  dom.window.__trip.init();
  return dom;
}

function fresh() {
  return makeDom();
}

// --- DOM helpers ----------------------------------------------------------

function cardFor(w, dateLabel) {
  return Array.from(w.document.querySelectorAll("#timeline .timeline-card"))
    .find((c) => c.querySelector(".tc-date").textContent === dateLabel);
}

function click(w, selector) {
  w.document.querySelector(selector)
    .dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
}

function openCalendar(w) {
  click(w, "#plan-toggle");
}

function reopenCalendar(w) {
  click(w, "#plan-toggle");
  click(w, "#plan-toggle");
}

function cellFor(w, label) {
  return Array.from(w.document.querySelectorAll("#calendar .cal-day"))
    .find((c) => c.querySelector(".cal-day-date").textContent === label);
}

function optionFor(w, value) {
  return Array.from(w.document.querySelectorAll("#plan-day option"))
    .find((o) => o.value === value);
}

function sight(nameEn, infoEn) {
  return {
    name: { en: nameEn, ja: nameEn + "（日本語）" },
    info: { en: infoEn, ja: infoEn + "（日本語）" }
  };
}

// ---------------------------------------------------------------------------
// 1. Data integrity
// ---------------------------------------------------------------------------

test("TRIP data has bilingual title, subtitle, travelers, and legs", () => {
  const w = fresh().window;
  const trip = w.__trip.TRIP;
  assert.ok(trip.title && trip.title.en && trip.title.ja, "title has en/ja");
  assert.ok(trip.subtitle && trip.subtitle.en && trip.subtitle.ja, "subtitle has en/ja");
  assert.ok(Array.isArray(trip.travelers) && trip.travelers.length === 2, "2 travelers");
  assert.ok(Array.isArray(trip.legs) && trip.legs.length > 0, "legs array populated");
});

test("trip range covers Nov 25 through Dec 13, 2026", () => {
  const w = fresh().window;
  const cfg = w.__trip.TRIP_CONFIG;
  assert.strictEqual(cfg.year, 2026, "trip year is 2026");
  assert.strictEqual(cfg.range.start, "Nov 25", "range starts Nov 25");
  assert.strictEqual(cfg.range.end, "Dec 13", "range ends Dec 13");
  assert.strictEqual(w.__trip.parseDate("Nov 25").from, 25, "parseDate reads day");
  assert.strictEqual(w.__trip.parseDate("Dec 13").fromM, 11, "parseDate reads December");
});

test("each leg has required bilingual fields", () => {
  const w = fresh().window;
  w.__trip.TRIP.legs.forEach((leg) => {
    assert.ok(leg.id, `leg has id`);
    assert.ok(leg.date, `${leg.id} has date`);
    assert.ok(leg.day && leg.day.en && leg.day.ja, `${leg.id} has day en/ja`);
    assert.ok(leg.title && leg.title.en && leg.title.ja, `${leg.id} has title en/ja`);
    assert.ok(leg.notes && leg.notes.en && leg.notes.ja, `${leg.id} has notes en/ja`);
    assert.ok(Array.isArray(leg.thingsToSee), `${leg.id} has thingsToSee array`);
    assert.ok(w.__trip.parseDate(leg.date), `${leg.id} date parses`);
  });
});

test("flights have all required fields", () => {
  const w = fresh().window;
  w.__trip.TRIP.legs.forEach((leg) => {
    const flights = leg.flight ? [leg.flight] : (leg.flights || []);
    flights.forEach((f) => {
      assert.ok(f.airline, `${leg.id} flight has airline`);
      assert.ok(f.number, `${leg.id} flight has number`);
      assert.ok(f.depart, `${leg.id} flight has depart`);
      assert.ok(f.arrive, `${leg.id} flight has arrive`);
      assert.ok(f.duration, `${leg.id} flight has duration`);
    });
  });
});

test("outbound and return flight numbers match the booked itinerary", () => {
  const w = fresh().window;
  const legs = w.__trip.TRIP.legs;
  const numbers = (leg) => (leg.flights || []).map((f) => f.number).join(",");
  assert.strictEqual(numbers(legs.find((l) => l.id === "depart-pdx")), "AS2408,AS123");
  assert.strictEqual(numbers(legs.find((l) => l.id === "george-return")), "AS124,AS488");
  assert.strictEqual(numbers(legs.find((l) => l.id === "harue-return")), "AS124,AS488");
});

test("Harue's Dec 13 return repeats George's flights exactly", () => {
  const w = fresh().window;
  const legs = w.__trip.TRIP.legs;
  const george = legs.find((l) => l.id === "george-return");
  const harue = legs.find((l) => l.id === "harue-return");
  assert.strictEqual(harue.date, "Dec 13", "Harue returns Dec 13");
  assert.strictEqual(george.date, "Dec 7", "George returns Dec 7");
  assert.strictEqual(
    JSON.stringify(harue.flights),
    JSON.stringify(george.flights),
    "identical flight lists"
  );
});

test("all accommodations have names", () => {
  const w = fresh().window;
  const named = w.__trip.TRIP.legs.filter((l) => l.accommodation);
  assert.ok(named.length >= 1, "at least 1 accommodation entry");
  named.forEach((l) => {
    assert.ok(l.accommodation.name && l.accommodation.name.length > 0, `${legId(l)} has name`);
  });
});

function legId(l) {
  return l.id || "leg";
}

test("no Bulgarian keys or labels survive the template copy", () => {
  const configSrc = fs.readFileSync(path.join(ROOT, "js", "config.js"), "utf8");
  const dataSrc = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.ok(!/"bg"\s*:/.test(configSrc + dataSrc), "no bg: keys in config/data");
  assert.ok(!/data-lang="bg"/.test(html), "no BG language button");
  assert.ok(/data-lang="ja"/.test(html), "JA language button present");
});

// ---------------------------------------------------------------------------
// 2. Page structure
// ---------------------------------------------------------------------------

test("index.html has lang=en and the Japan title", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.ok(/<html lang="en">/.test(html), "html lang is en");
  assert.ok(html.includes("Japan Trip 2026"), "page title present");
});

test("language selector buttons exist for EN and JA", () => {
  const w = fresh().window;
  const btns = w.document.querySelectorAll(".lang-btn");
  assert.strictEqual(btns.length, 2, "2 lang buttons");
  assert.strictEqual(btns[0].getAttribute("data-lang"), "en");
  assert.strictEqual(btns[1].getAttribute("data-lang"), "ja");
});

test("calendar section is hidden by default", () => {
  const w = fresh().window;
  const section = w.document.querySelector("#calendar-section");
  assert.ok(section.classList.contains("hidden"), "calendar hidden on load");
  assert.strictEqual(w.document.querySelectorAll("#calendar .cal-day").length, 0,
    "no cells rendered until opened");
});

// ---------------------------------------------------------------------------
// 3. Timeline rendering (English default)
// ---------------------------------------------------------------------------

test("timeline renders all legs", () => {
  const w = fresh().window;
  const cards = w.document.querySelectorAll("#timeline .timeline-card");
  assert.strictEqual(cards.length, w.__trip.TRIP.legs.length, "one card per leg");
  assert.strictEqual(cards.length, 10, "ten legs (8 planned days + 2 returns)");
});

test("timeline card shows date, day, and title in English", () => {
  const w = fresh().window;
  const first = w.__trip.TRIP.legs[0];
  const card = w.document.querySelector("#timeline .timeline-card");
  assert.ok(card.querySelector(".tc-date").textContent.includes(first.date), "date shown");
  assert.ok(card.querySelector(".tc-day").textContent.includes("Wednesday"), "Wednesday shown");
  assert.ok(card.querySelector(".tc-title").textContent.includes(first.title.en), "title in English");
});

test("outbound flights render as boarding-pass blocks", () => {
  const w = fresh().window;
  const card = cardFor(w, "Nov 25");
  assert.ok(card, "Nov 25 card rendered");
  const flights = card.querySelectorAll(".tc-flight");
  assert.strictEqual(flights.length, 2, "both flights rendered");
  assert.ok(card.textContent.includes("AS2408"), "AS2408 shown");
  assert.ok(card.textContent.includes("AS123"), "AS123 shown");
  assert.ok(card.textContent.includes("PDX 9:25 AM"), "PDX departure time shown");
  assert.ok(card.textContent.includes("NRT 3:25 PM (+1 day)"), "Narita arrival shown");
});

test("return flights render for George on Dec 7", () => {
  const w = fresh().window;
  const card = cardFor(w, "Dec 7");
  assert.ok(card, "Dec 7 card rendered");
  assert.ok(card.textContent.includes("AS124"), "AS124 shown");
  assert.ok(card.textContent.includes("AS488"), "AS488 shown");
  assert.ok(card.textContent.includes("NRT 5:25 PM"), "Narita departure shown");
  assert.ok(card.textContent.includes("PDX 1:28 PM"), "Portland landing shown");
});

test("Harue's Dec 13 card repeats the same flight times", () => {
  const w = fresh().window;
  const card = cardFor(w, "Dec 13");
  assert.ok(card, "Dec 13 card rendered");
  assert.ok(card.textContent.includes("AS124"), "AS124 shown");
  assert.ok(card.textContent.includes("AS488"), "AS488 shown");
  assert.ok(card.textContent.includes("12:25 PM"), "SEA departure shown");
  const george = cardFor(w, "Dec 7");
  const times = (c) => Array.from(c.querySelectorAll(".tc-flight-detail"))
    .map((el) => el.textContent).join("|");
  assert.strictEqual(times(card), times(george), "identical flight blocks");
});

test("arrival leg shows a TBD accommodation badge without a map link", () => {
  const w = fresh().window;
  const card = cardFor(w, "Nov 26");
  assert.ok(card, "Nov 26 card rendered");
  const acc = card.querySelector(".tc-accommodation");
  assert.ok(acc, "accommodation section rendered");
  assert.ok(acc.classList.contains("is-tbd"), "TBD styling applied");
  assert.ok(acc.textContent.includes("TBD"), "TBD shown");
  assert.strictEqual(acc.querySelector(".tc-map"), null, "no map link for TBD");
});

test("day badges count from Nov 25 as Day 1", () => {
  const w = fresh().window;
  const badge = (label) => cardFor(w, label).querySelector(".tc-day-badge").textContent;
  assert.strictEqual(badge("Nov 25"), "Day 1");
  assert.strictEqual(badge("Nov 26"), "Day 2");
  assert.strictEqual(badge("Nov 27"), "Day 3");
  assert.strictEqual(badge("Dec 1"), "Day 7");
  assert.strictEqual(badge("Dec 2 - Dec 3"), "Day 8");
  assert.strictEqual(badge("Dec 6"), "Day 12");
  assert.strictEqual(badge("Dec 7"), "Day 13");
  assert.strictEqual(badge("Dec 13"), "Day 19");
});

test("Nov 27 card carries the Kinshicho appointment, lunch, and dinner plans", () => {
  const w = fresh().window;
  const card = cardFor(w, "Nov 27");
  assert.ok(card, "Nov 27 card rendered");
  assert.strictEqual(card.querySelector(".tc-day").textContent, "Friday", "Nov 27 is a Friday");
  assert.strictEqual(card.querySelector(".tc-day-badge").textContent, "Day 3", "third trip day");

  const event = card.querySelector(".tc-event");
  assert.ok(event, "event section rendered");
  assert.ok(event.textContent.includes("10:30"), "appointment time shown");
  assert.ok(event.textContent.includes("Kinshicho"), "station named");
  const map = event.querySelector("a.tc-map");
  assert.ok(map, "map link rendered");
  assert.ok(map.getAttribute("href").indexOf("google.com/maps") !== -1, "map points at Google Maps");

  const notes = card.querySelector(".tc-notes").textContent;
  assert.ok(notes.includes("Tai Ramen"), "lunch shown");
  assert.ok(notes.includes("Koshigaya"), "dinner shown");
  assert.ok(notes.includes("onsen"), "onsen kept as an option");

  w.__trip.setLang("ja");
  const jaCard = cardFor(w, "Nov 27");
  assert.ok(jaCard.querySelector(".tc-event").textContent.includes("錦糸町"),
    "JA appointment names Kinshicho");
  assert.ok(jaCard.querySelector(".tc-notes").textContent.includes("越谷"),
    "JA notes name Koshigaya");
});

test("thingsToSee renders an expandable list with map links", () => {
  const w = fresh().window;
  w.__trip.TRIP.legs[1].thingsToSee = [sight("Meiji Shrine", "Shrine in Shibuya.")];
  w.__trip.renderAll();

  const card = cardFor(w, "Nov 26");
  const things = card.querySelector(".tc-things");
  assert.ok(things, "expandable section rendered");
  assert.ok(things.querySelector("summary").textContent.includes("Things to see"), "EN summary");
  const items = things.querySelectorAll(".tc-things-list li");
  assert.strictEqual(items.length, 1, "one sight listed");
  assert.ok(items[0].textContent.includes("Meiji Shrine"), "sight name shown");
  const map = things.querySelector(".tc-things-list .tc-map");
  assert.ok(map, "map link rendered");
  assert.ok(map.getAttribute("href").indexOf("google.com/maps") !== -1, "points at Google Maps");
});

test("drive legs render a route block with map and traffic links", () => {
  const w = fresh().window;
  w.__trip.TRIP.legs.push({
    id: "test-drive",
    location: { en: "Hakone", ja: "Hakone (ja)" },
    date: "Dec 1",
    day: { en: "Tuesday", ja: "Tuesday (ja)" },
    title: { en: "Test drive leg", ja: "Test drive leg (ja)" },
    flight: null,
    drive: {
      from: { en: "Tokyo", ja: "Tokyo (ja)" },
      to: { en: "Hakone", ja: "Hakone (ja)" },
      duration: "1h 30min"
    },
    accommodation: null,
    notes: { en: "Test notes.", ja: "Test notes (ja)." },
    thingsToSee: []
  });
  w.__trip.renderAll();

  const blocks = w.document.querySelectorAll(".tc-drive");
  assert.strictEqual(blocks.length, 1, "one drive block for the injected leg");
  const links = blocks[0].querySelectorAll(".tc-map");
  assert.strictEqual(links.length, 2, "map + road conditions links");
  links.forEach((a) => assert.ok(a.getAttribute("href").indexOf("google.com/maps") !== -1));
  assert.ok(blocks[0].textContent.includes("Tokyo"), "origin shown");
  assert.ok(blocks[0].textContent.includes("Hakone"), "destination shown");
});

// ---------------------------------------------------------------------------
// 4. Language toggle
// ---------------------------------------------------------------------------

test("switching to Japanese updates timeline content", () => {
  const w = fresh().window;
  const d = w.document;

  const enTitle = d.querySelector("#timeline .timeline-card .tc-title").textContent;
  assert.ok(enTitle.includes("George and Harue depart Portland"), "English title shown");

  w.__trip.setLang("ja");

  const jaTitle = d.querySelector("#timeline .timeline-card .tc-title").textContent;
  assert.ok(jaTitle.includes("ポートランド"), "Japanese title shown");
  assert.ok(!jaTitle.includes("George and Harue depart"), "English title gone");
  assert.strictEqual(d.documentElement.lang, "ja", "document lang updated");
});

test("switching to Japanese updates the hero section", () => {
  const w = fresh().window;
  w.__trip.setLang("ja");
  const h1 = w.document.querySelector(".hero h1").textContent;
  assert.ok(h1.includes("日本旅行"), "Japanese hero title");
  const kicker = w.document.querySelector(".hero-kicker").textContent;
  assert.ok(kicker.includes("日本"), "kicker names Japan in Japanese");
});

test("language buttons reflect active state", () => {
  const w = fresh().window;
  const d = w.document;
  const enBtn = d.querySelector('.lang-btn[data-lang="en"]');
  const jaBtn = d.querySelector('.lang-btn[data-lang="ja"]');

  assert.ok(enBtn.classList.contains("active"), "EN active by default");
  assert.ok(!jaBtn.classList.contains("active"), "JA not active by default");

  w.__trip.setLang("ja");
  assert.ok(!enBtn.classList.contains("active"), "EN not active after switch");
  assert.ok(jaBtn.classList.contains("active"), "JA active after switch");
});

test("language buttons expose aria-pressed state", () => {
  const w = fresh().window;
  const d = w.document;
  assert.strictEqual(d.querySelector('.lang-btn[data-lang="en"]').getAttribute("aria-pressed"), "true");
  assert.strictEqual(d.querySelector('.lang-btn[data-lang="ja"]').getAttribute("aria-pressed"), "false");
  w.__trip.setLang("ja");
  assert.strictEqual(d.querySelector('.lang-btn[data-lang="en"]').getAttribute("aria-pressed"), "false");
  assert.strictEqual(d.querySelector('.lang-btn[data-lang="ja"]').getAttribute("aria-pressed"), "true");
});

test("clicking the JA button switches language", () => {
  const w = fresh().window;
  click(w, '.lang-btn[data-lang="ja"]');
  const title = w.document.querySelector("#timeline .timeline-card .tc-title").textContent;
  assert.ok(title.includes("出発"), "language switched on click");
});

test("Japanese flight labels render correctly", () => {
  const w = fresh().window;
  w.__trip.setLang("ja");
  const labels = w.document.querySelectorAll(".tc-flight .tc-label");
  assert.ok(labels.length > 0, "flight labels exist");
  assert.strictEqual(labels[0].textContent, "フライト", "Japanese flight label");
});

test("Japanese section labels render correctly", () => {
  const w = fresh().window;
  w.__trip.setLang("ja");
  const card = cardFor(w, "Nov 26");
  assert.strictEqual(card.querySelector(".tc-accommodation .tc-label").textContent, "宿泊");
  assert.strictEqual(cardFor(w, "Nov 25").querySelector(".tc-flight .tc-label").textContent, "フライト");
});

test("Japanese thingsToSee label renders correctly", () => {
  const w = fresh().window;
  w.__trip.TRIP.legs[1].thingsToSee = [sight("Meiji Shrine", "Shrine in Shibuya.")];
  w.__trip.renderAll();
  w.__trip.setLang("ja");
  const summary = w.document.querySelector(".tc-things summary");
  assert.strictEqual(summary.textContent, "見どころ (1)", "Japanese things label");
});

test("Japanese flight times switch to the 24-hour clock", () => {
  const w = fresh().window;
  w.__trip.setLang("ja");
  const detail = cardFor(w, "Nov 25").querySelector(".tc-flight-detail").textContent;
  assert.ok(detail.includes("09:25"), "9:25 AM becomes 09:25");
  assert.ok(!/\d\s*AM/i.test(detail), "no AM marker left");
  const arrival = cardFor(w, "Nov 25").querySelectorAll(".tc-flight-detail")[1].textContent;
  assert.ok(arrival.includes("15:25"), "3:25 PM becomes 15:25");
});

test("static UI (plan button, legend, form) translates to Japanese", () => {
  const w = fresh().window;
  const d = w.document;
  const text = (sel) => d.querySelector(sel).textContent;

  assert.strictEqual(text('[data-i18n="plan"]'), "Plan Activity");
  assert.strictEqual(text('[data-i18n="legendFree"]'), "Free");
  assert.strictEqual(text('[data-i18n="formTitle"]'), "Propose an Activity");

  w.__trip.setLang("ja");

  assert.strictEqual(text('[data-i18n="plan"]'), "アクティビティを提案");
  assert.strictEqual(text('[data-i18n="legendFree"]'), "空き");
  assert.strictEqual(text('[data-i18n="formTitle"]'), "アクティビティを提案");
  assert.strictEqual(d.querySelector("#plan-who option:nth-child(2)").textContent, "George");
});

// ---------------------------------------------------------------------------
// 5. XSS safety
// ---------------------------------------------------------------------------

test("escapeHtml handles all five special characters", () => {
  const w = fresh().window;
  assert.strictEqual(w.__trip.escapeHtml('a&b<c>d"e\'f'), "a&amp;b&lt;c&gt;d&quot;e&#39;f");
  assert.strictEqual(w.__trip.escapeHtml("東京"), "東京");
});

// ---------------------------------------------------------------------------
// 6. Helper function t() returns correct language
// ---------------------------------------------------------------------------

test("t() returns English by default", () => {
  const w = fresh().window;
  assert.strictEqual(w.__trip.t({ en: "Hello", ja: "こんにちは" }), "Hello");
});

test("t() returns Japanese after setLang", () => {
  const w = fresh().window;
  w.__trip.setLang("ja");
  assert.strictEqual(w.__trip.t({ en: "Hello", ja: "こんにちは" }), "こんにちは");
});

test("t() handles string input", () => {
  const w = fresh().window;
  assert.strictEqual(w.__trip.t("plain string"), "plain string");
});

test("t() handles null/undefined", () => {
  const w = fresh().window;
  assert.strictEqual(w.__trip.t(null), "");
  assert.strictEqual(w.__trip.t(undefined), "");
});

// ---------------------------------------------------------------------------
// 7. Overview strip, map, hero
// ---------------------------------------------------------------------------

test("overview strip renders distinct stops in trip order", () => {
  const w = fresh().window;
  const chips = Array.from(w.document.querySelectorAll("#overview .ov-chip"))
    .map((c) => c.textContent);
  assert.deepStrictEqual(chips, ["Tokyo", "Hakone", "Tokyo"], "out to Hakone and back to Tokyo");
});

test("overview chips switch language with the page", () => {
  const w = fresh().window;
  w.__trip.setLang("ja");
  const chips = Array.from(w.document.querySelectorAll("#overview .ov-chip"))
    .map((c) => c.textContent);
  assert.deepStrictEqual(chips, ["東京", "箱根", "東京"], "Tokyo and Hakone in Japanese");
});

test("map figure points at a committed local placeholder asset", () => {
  const w = fresh().window;
  const figure = w.document.querySelector(".route-map");
  assert.ok(figure, "map figure present");
  const img = figure.querySelector("img.map-img");
  assert.ok(img, "map image present");
  assert.ok(img.getAttribute("src").indexOf("images/japan-map.svg") !== -1, "points at local map");
  assert.ok(fs.existsSync(path.join(ROOT, "images", "japan-map.svg")), "map asset committed");
});

test("hero shows the travelers line", () => {
  const w = fresh().window;
  const text = w.document.querySelector(".hero-travelers").textContent;
  assert.ok(text.includes("George"));
  assert.ok(text.includes("Harue"));
  assert.ok(text.includes("Portland"));
  assert.ok(text.includes("Japan"));
});

// ---------------------------------------------------------------------------
// 8. Calendar (two month grids)
// ---------------------------------------------------------------------------

test("calendar renders one grid per month with month headings", () => {
  const w = fresh().window;
  openCalendar(w);
  const months = w.document.querySelectorAll("#calendar .cal-month");
  assert.strictEqual(months.length, 2, "November and December grids");
  assert.strictEqual(months[0].querySelector(".cal-month-title").textContent, "November 2026");
  assert.strictEqual(months[1].querySelector(".cal-month-title").textContent, "December 2026");
  assert.ok(!w.document.querySelector("#calendar-section").classList.contains("hidden"),
    "section revealed");
});

test("November grid has 30 cells and only Nov 25-30 are trip days", () => {
  const w = fresh().window;
  openCalendar(w);
  const nov = w.document.querySelectorAll("#calendar .cal-month")[0];
  const cells = nov.querySelectorAll(".cal-body > div");
  assert.strictEqual(cells.length, 30, "30 days in November");
  assert.strictEqual(nov.querySelectorAll(".cal-header-cell")[0].textContent, "Sun", "week starts Sunday");
  for (let d = 1; d <= 24; d++) {
    const cell = cells[d - 1];
    assert.ok(cell.classList.contains("cal-empty"), `Nov ${d} is outside the trip`);
  }
  for (let d = 25; d <= 30; d++) {
    assert.ok(!cells[d - 1].classList.contains("cal-empty"), `Nov ${d} is a trip day`);
  }
});

test("December grid pads two blanks for the Tue start and covers Dec 1-13", () => {
  const w = fresh().window;
  openCalendar(w);
  const dec = w.document.querySelectorAll("#calendar .cal-month")[1];
  const cells = dec.querySelectorAll(".cal-body > div");
  assert.strictEqual(cells.length, 33, "2 leading blanks + 31 days in December");
  assert.strictEqual(dec.querySelectorAll(".cal-header-cell")[2].textContent, "Tue",
    "header row starts on Sunday");
  assert.ok(cells[0].classList.contains("cal-empty"), "blank before Tue Dec 1");
  assert.ok(cells[1].classList.contains("cal-empty"), "second blank before Tue Dec 1");
  for (let d = 1; d <= 13; d++) {
    assert.ok(!cells[1 + d].classList.contains("cal-empty"), `Dec ${d} is a trip day`);
  }
  assert.ok(cells[15].classList.contains("cal-empty"), "Dec 14 is outside the trip");
});

test("travel days are planned in the calendar and cannot be reserved", () => {
  const w = fresh().window;
  openCalendar(w);
  [["Nov 25", "depart"], ["Dec 7", "George"], ["Dec 13", "Harue"]].forEach(([label, expect]) => {
    const cell = cellFor(w, label);
    assert.ok(cell, `${label} cell rendered`);
    assert.ok(cell.classList.contains("planned"), `${label} is a travel day`);
    assert.ok(!cell.classList.contains("free"), `${label} is not free`);
    assert.ok(cell.querySelector(".cal-day-desc").textContent.includes(expect),
      `${label} description names ${expect}`);

    const opt = optionFor(w, label);
    assert.ok(opt, `${label} option rendered`);
    assert.ok(opt.disabled, `${label} cannot be reserved`);
    assert.ok(opt.textContent.includes("[Travel]"), `${label} tagged Travel`);
  });
});

test("the arrival day is booked, not free", () => {
  const w = fresh().window;
  openCalendar(w);
  const cell = cellFor(w, "Nov 26");
  assert.ok(cell, "Nov 26 cell rendered");
  assert.ok(cell.classList.contains("booked"), "Nov 26 is booked");
  assert.ok(!cell.classList.contains("free"), "Nov 26 is not free");
  const opt = optionFor(w, "Nov 26");
  assert.ok(opt.disabled, "Nov 26 cannot be reserved");
  assert.ok(opt.textContent.includes("[Booked]"), "Nov 26 tagged Booked");
});

test("open days stay free, show a free-day label, and can be reserved", () => {
  const w = fresh().window;
  openCalendar(w);
  ["Nov 28", "Dec 4", "Dec 5", "Dec 11"].forEach((label) => {
    const cell = cellFor(w, label);
    assert.ok(cell, `${label} cell rendered`);
    assert.ok(cell.classList.contains("free"), `${label} is free`);
    assert.ok(cell.querySelector(".cal-day-desc").textContent.includes("Free day"),
      `${label} shows free day`);

    const opt = optionFor(w, label);
    assert.ok(opt, `${label} option rendered`);
    assert.ok(!opt.disabled, `${label} can be reserved`);
    assert.ok(opt.textContent.includes("[Free]"), `${label} tagged Free`);
  });
});

test("the day select lists all 19 trip days with correct weekday names", () => {
  const w = fresh().window;
  openCalendar(w);
  const opts = Array.from(w.document.querySelectorAll("#plan-day option"))
    .filter((o) => o.value !== "");
  assert.strictEqual(opts.length, 19, "19 trip days");

  const label = (v) => optionFor(w, v).textContent;
  assert.ok(label("Nov 25").includes("Wednesday"), "Nov 25 is a Wednesday");
  assert.ok(label("Dec 7").includes("Monday"), "Dec 7 is a Monday");
  assert.ok(label("Dec 13").includes("Sunday"), "Dec 13 is a Sunday");
});

test("calendar cells and month headings switch to Japanese", () => {
  const w = fresh().window;
  openCalendar(w);
  w.__trip.setLang("ja");
  reopenCalendar(w);

  const titles = Array.from(w.document.querySelectorAll(".cal-month-title"))
    .map((t) => t.textContent);
  assert.deepStrictEqual(titles, ["2026年11月", "2026年12月"], "Japanese month headings");

  assert.ok(cellFor(w, "11月25日"), "Nov 25 cell labelled in Japanese");
  const free = cellFor(w, "11月28日");
  assert.ok(free, "Nov 28 cell labelled in Japanese");
  assert.ok(free.querySelector(".cal-day-desc").textContent.includes("自由日"), "free day in Japanese");

  const opt = optionFor(w, "Dec 11");
  assert.ok(opt.textContent.includes("金曜日"), "weekday in Japanese");
  assert.ok(opt.textContent.includes("[空き]"), "free tag in Japanese");
});

test("busyDays entries block the day on the calendar and the form", () => {
  const w = fresh().window;
  w.__trip.TRIP.busyDays.push({
    date: "Dec 5",
    title: { en: "Reserved dinner", ja: "Reserved dinner (ja)" }
  });
  openCalendar(w);

  const cell = cellFor(w, "Dec 5");
  assert.ok(cell, "Dec 5 cell rendered");
  assert.ok(cell.classList.contains("busy"), "Dec 5 is busy");
  assert.ok(!cell.classList.contains("free"), "Dec 5 is not free");
  assert.ok(cell.querySelector(".cal-day-desc").textContent.includes("Reserved dinner"),
    "busy description shown");

  const opt = optionFor(w, "Dec 5");
  assert.ok(opt.disabled, "Dec 5 cannot be reserved");
  assert.ok(opt.textContent.includes("[Busy]"), "Dec 5 tagged Busy");
});

test("busy, free, and booked calendar colors are distinct", () => {
  const css = fs.readFileSync(path.join(ROOT, "css", "style.css"), "utf8");
  const bgOf = (cls) =>
    (css.match(new RegExp("\\." + cls + "\\s*\\{[^}]*background:\\s*(#\\w+)")) || [])[1];
  assert.ok(bgOf("cal-day\\.busy"), "busy rule has a background");
  assert.notStrictEqual(bgOf("cal-day\\.busy"), bgOf("cal-day\\.free"), "busy differs from free");
  assert.notStrictEqual(bgOf("cal-day\\.busy"), bgOf("cal-day\\.booked"), "busy differs from booked");
  assert.notStrictEqual(bgOf("cal-day\\.planned"), bgOf("cal-day\\.free"), "planned differs from free");
});

test("Nov 27 is booked for the appointment and Nov 28 stays free", () => {
  const w = fresh().window;
  openCalendar(w);

  const booked = cellFor(w, "Nov 27");
  assert.ok(booked, "Nov 27 cell rendered");
  assert.ok(booked.classList.contains("booked"), "Nov 27 is booked");
  assert.ok(!booked.classList.contains("free"), "Nov 27 is not free");
  const bookedOpt = optionFor(w, "Nov 27");
  assert.ok(bookedOpt.disabled, "Nov 27 cannot be reserved");
  assert.ok(bookedOpt.textContent.includes("[Booked]"), "Nov 27 tagged Booked");

  const free = cellFor(w, "Nov 28");
  assert.ok(free, "Nov 28 cell rendered");
  assert.ok(free.classList.contains("free"), "Nov 28 is free");
  const freeOpt = optionFor(w, "Nov 28");
  assert.ok(!freeOpt.disabled, "Nov 28 can still be reserved");
  assert.ok(freeOpt.textContent.includes("[Free]"), "Nov 28 tagged Free");
});

test("Nov 29 and Nov 30 cards carry the samba session and Harue's appointment", () => {
  const w = fresh().window;

  const samba = cardFor(w, "Nov 29");
  assert.ok(samba, "Nov 29 card rendered");
  assert.strictEqual(samba.querySelector(".tc-day").textContent, "Sunday", "Nov 29 is a Sunday");
  assert.strictEqual(samba.querySelector(".tc-day-badge").textContent, "Day 5", "fifth trip day");
  assert.ok(samba.querySelector(".tc-title").textContent.includes("samba"), "samba in title");
  const sambaEvent = samba.querySelector(".tc-event");
  assert.ok(sambaEvent, "samba event rendered");
  assert.ok(sambaEvent.textContent.includes("11:00 AM"), "start time shown");
  assert.ok(sambaEvent.textContent.includes("3:00 PM"), "end time shown");

  const harue = cardFor(w, "Nov 30");
  assert.ok(harue, "Nov 30 card rendered");
  assert.strictEqual(harue.querySelector(".tc-day").textContent, "Monday", "Nov 30 is a Monday");
  assert.strictEqual(harue.querySelector(".tc-day-badge").textContent, "Day 6", "sixth trip day");
  const harueNotes = harue.querySelector(".tc-notes").textContent;
  assert.ok(harueNotes.includes("cancer center"), "Harue's appointment shown");
  assert.ok(harueNotes.includes("George is free"), "George's freedom shown");

  w.__trip.setLang("ja");
  const jaSamba = cardFor(w, "Nov 29");
  assert.ok(jaSamba.querySelector(".tc-event").textContent.includes("15:00"),
    "JA end time converted to 24-hour clock");
  const jaHarue = cardFor(w, "Nov 30");
  assert.ok(jaHarue.querySelector(".tc-notes").textContent.includes("がんセンター"),
    "JA notes name the cancer center");
});

test("Nov 29 is booked for samba, Nov 30 stays free for George", () => {
  const w = fresh().window;
  openCalendar(w);

  const sambaCell = cellFor(w, "Nov 29");
  assert.ok(sambaCell, "Nov 29 cell rendered");
  assert.ok(sambaCell.classList.contains("booked"), "Nov 29 is booked");
  assert.ok(sambaCell.querySelector(".cal-day-desc").textContent.includes("samba"),
    "Nov 29 description names samba");
  const sambaOpt = optionFor(w, "Nov 29");
  assert.ok(sambaOpt.disabled, "Nov 29 cannot be reserved");
  assert.ok(sambaOpt.textContent.includes("[Booked]"), "Nov 29 tagged Booked");

  const freeCell = cellFor(w, "Nov 30");
  assert.ok(freeCell, "Nov 30 cell rendered");
  assert.ok(freeCell.classList.contains("free"), "Nov 30 stays free for George");
  assert.ok(freeCell.querySelector(".cal-day-desc").textContent.includes("cancer center"),
    "Nov 30 still shows Harue's appointment");
  const freeOpt = optionFor(w, "Nov 30");
  assert.ok(!freeOpt.disabled, "Nov 30 can be reserved");
  assert.ok(freeOpt.textContent.includes("[Free]"), "Nov 30 tagged Free");
});

test("Dec 1 keeps samba and Harue's dinner as an open day", () => {
  const w = fresh().window;
  const card = cardFor(w, "Dec 1");
  assert.ok(card, "Dec 1 card rendered");
  assert.strictEqual(card.querySelector(".tc-day").textContent, "Tuesday", "Dec 1 is a Tuesday");
  assert.strictEqual(card.querySelector(".tc-day-badge").textContent, "Day 7", "seventh trip day");
  assert.ok(card.querySelector(".tc-title").textContent.includes("samba"), "samba in title");
  assert.strictEqual(card.querySelector(".tc-event"), null, "no booked event block");
  const notes = card.querySelector(".tc-notes").textContent;
  assert.ok(notes.includes("8:00 PM"), "samba start time shown");
  assert.ok(notes.includes("10:00 PM"), "samba end time shown");
  assert.ok(notes.includes("Harue"), "Harue's dinner named");
  assert.ok(notes.includes("friends"), "dinner company named");

  openCalendar(w);
  const cell = cellFor(w, "Dec 1");
  assert.ok(cell, "Dec 1 cell rendered");
  assert.ok(cell.classList.contains("free"), "Dec 1 stays free");
  assert.ok(cell.querySelector(".cal-day-desc").textContent.includes("samba"), "desc names samba");
  const opt = optionFor(w, "Dec 1");
  assert.ok(!opt.disabled, "Dec 1 can be reserved");
  assert.ok(opt.textContent.includes("[Free]"), "Dec 1 tagged Free");

  w.__trip.setLang("ja");
  const jaNotes = cardFor(w, "Dec 1").querySelector(".tc-notes").textContent;
  assert.ok(jaNotes.includes("20:00") && jaNotes.includes("22:00"), "JA times in 24-hour clock");
});

test("Hakone leg books Senkyoro for Dec 2-3 with nearby sights", () => {
  const w = fresh().window;
  const card = cardFor(w, "Dec 2 - Dec 3");
  assert.ok(card, "Hakone card rendered");
  assert.strictEqual(card.querySelector(".tc-date").textContent, "Dec 2 - Dec 3", "date range shown");
  assert.strictEqual(card.querySelector(".tc-day-badge").textContent, "Day 8", "stay starts on day 8");
  assert.strictEqual(card.querySelector(".tc-day").textContent, "Wednesday - Thursday",
    "day label spans both nights");

  const acc = card.querySelector(".tc-accommodation");
  assert.ok(acc, "accommodation section rendered");
  assert.ok(!acc.classList.contains("is-tbd"), "real booking, not TBD");
  const site = acc.querySelector("a.tc-site");
  assert.ok(site, "website link rendered");
  assert.strictEqual(site.getAttribute("href"), "https://senkyoro.co.jp/", "points at the official site");
  assert.ok(site.textContent.includes("Senkyoro"), "ryokan named in the link");

  const things = card.querySelector(".tc-things");
  assert.ok(things, "things to see rendered");
  const items = things.querySelectorAll(".tc-things-list li");
  assert.ok(items.length >= 4, "at least 4 sights listed");
  items.forEach((li) => {
    const map = li.querySelector("a.tc-map");
    assert.ok(map, "sight has a map link");
    assert.ok(map.getAttribute("href").indexOf("google.com/maps") !== -1, "map points at Google Maps");
  });

  openCalendar(w);
  ["Dec 2", "Dec 3"].forEach((label) => {
    const cell = cellFor(w, label);
    assert.ok(cell, `${label} cell rendered`);
    assert.ok(cell.classList.contains("booked"), `${label} is booked`);
    assert.ok(cell.querySelector(".cal-day-desc").textContent.includes("Hakone"), `${label} names Hakone`);
    const opt = optionFor(w, label);
    assert.ok(opt.disabled, `${label} cannot be reserved`);
    assert.ok(opt.textContent.includes("[Booked]"), `${label} tagged Booked`);
  });
  assert.ok(!cellFor(w, "Dec 4").classList.contains("booked"), "the stay does not reach Dec 4");
});

test("Dec 6 pairs George's samba with Harue's Oregon team at Pedro's", () => {
  const w = fresh().window;
  const card = cardFor(w, "Dec 6");
  assert.ok(card, "Dec 6 card rendered");
  assert.strictEqual(card.querySelector(".tc-day").textContent, "Sunday", "Dec 6 is a Sunday");
  assert.strictEqual(card.querySelector(".tc-day-badge").textContent, "Day 12", "twelfth trip day");
  assert.ok(card.querySelector(".tc-event").textContent.includes("Samba"), "samba event shown");
  const notes = card.querySelector(".tc-notes").textContent;
  assert.ok(notes.includes("Pedro"), "Pedro's house named");
  assert.ok(notes.includes("Jiyugaoka"), "neighbourhood named");
  assert.ok(notes.includes("Oregon"), "Oregon team named");

  openCalendar(w);
  const cell = cellFor(w, "Dec 6");
  assert.ok(cell, "Dec 6 cell rendered");
  assert.ok(cell.classList.contains("booked"), "Dec 6 is booked");
  assert.ok(cell.querySelector(".cal-day-desc").textContent.includes("samba"), "desc names samba");
  const opt = optionFor(w, "Dec 6");
  assert.ok(opt.disabled, "Dec 6 cannot be reserved");
  assert.ok(opt.textContent.includes("[Booked]"), "Dec 6 tagged Booked");

  w.__trip.setLang("ja");
  assert.ok(cardFor(w, "Dec 6").querySelector(".tc-notes").textContent.includes("自由が丘"),
    "JA notes name Jiyugaoka");
});

test("activity form elements are present", () => {
  const w = fresh().window;
  const d = w.document;
  assert.ok(d.querySelector("#plan-day"), "day select");
  const who = d.querySelectorAll("#plan-who option");
  assert.strictEqual(who.length, 4, "prompt + George + Harue + Both");
  assert.ok(d.querySelector("#plan-activity"), "activity input");
  assert.ok(d.querySelector(".plan-submit-btn"), "submit button");
  openCalendar(w);
  assert.ok(d.querySelector('#plan-day option[value=""]'), "placeholder option present");
});
