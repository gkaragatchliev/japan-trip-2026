# AGENTS.md - Project Context

This file is auto-loaded by opencode at the start of every session. Read first:
conventions, pitfalls we've hit, and current state.

## What this repo is

**Trip Site Template** -- reusable bilingual (EN/JA) static site for trips.
Currently deployed as **Japan Trip 2026** for George and Harue's
November 25 - December 13, 2026 Japan trip. Cloned from the Bulgaria
template (`Projects/Hotspring_BG`).

To create a new trip: copy the folder, edit `js/config.js` + `js/data.js`,
update `--loc-*` colors in `css/style.css`, deploy.

## Tech stack and structure

- Vanilla HTML/CSS/JS (ES5 style, IIFE, `var`). No frameworks, no build step.
- `vendor/` -- third-party libraries, committed as minified files for offline dev.
  Reference locally (e.g. `vendor/splitting.min.js?v=N`). **Do not use CDN URLs.**
- `index.html` -- page structure (hero with language selector, timeline,
  calendar, footer). Static strings carry `data-i18n="key"` attributes.
- `css/style.css` -- styles (CSS custom properties, teal/ink palette,
  `--loc-tokyo/kyoto/osaka/transit` accents, two-month calendar grid).
- `js/config.js` -- **trip-specific settings**: title, subtitle, kicker,
  travelers, email, country, `year`, `range { start, end }`, primary color.
- `js/data.js` -- `TRIP` object with `legs[]` and `busyDays[]`. Each leg has
  `id`, `date`, `day`, `title`, `flight` or `flights`, `drive`,
  `accommodation`, `notes`, `thingsToSee`, `pullquote`.
- `js/app.js` -- all logic in one IIFE: date engine (`parseDate`, `tripDays`,
  `dayNumberFor`, `buildDayMap`), timeline rendering, two-month calendar
  rendering, language toggle, activity form, `STR` (code labels) and
  `STATIC_TEXT` (`data-i18n` labels), Splitting.js init, scroll-reveal,
  progress bar, G/H particles, XSS escaping.
- `tests/site.test.js` -- `node --test` + jsdom, **57 tests, all green**.
- `package.json` -- script `npm test`, devDependency `jsdom`.

## Commands

- Tests: `npm test`
- Local: `python -m http.server 8000` then `http://localhost:8000`
- Deploy: commit + `git push origin main`; GitHub Pages publishes (~1 min).

## Learned lessons (DO NOT repeat these mistakes)

1. **`String.prototype.replace` interprets `$` in replacement strings** --
   `$$`, `$&`, `$1`, etc. The test harness initially passed app source as a
   replacement string, corrupting `$$` in `var $`. **Always use split/join,
   never `.replace()`**, when embedding source (see `buildScript()` in tests).
2. **jsdom does not share top-level `const` across separate external `<script>` tags.**
   Harness must merge scripts into one inline script and expose internals
   via `window.__trip` before `DOMContentLoaded`.
3. **`deepStrictEqual` fails across realms.** Arrays/objects created inside jsdom
   have different prototypes than Node ones. Compare with `Array.from()` or
   `JSON.stringify`, not `deepStrictEqual` on jsdom objects.
4. **GitHub Pages browser cache.** Users saw new HTML with stale JS. Solved with
   cache-busting query strings: `css/style.css?v=N`, `js/data.js?v=N`,
   `js/app.js?v=N`. **Bump version on every change** to these files.
   If user says "button does nothing" -- suspect cache first -> hard refresh (Ctrl+F5).
5. **Bilingual data model.** All user-facing text has `{ en: "...", ja: "..." }`
   objects. The `t(obj)` helper picks the right language. Never hardcode a single
   language string -- always use the object form. Strings that live in code use
   `STR`; strings that live in markup use `STATIC_TEXT` + `data-i18n`.
6. **No `gh` CLI on this machine.** Use GitHub MCP tools (or plain `git push`).
7. **SVG filters affect text.** `feTurbulence` + `feDisplacementMap` roughens
   everything inside the element, not just edges. Keep filters on decorative
   elements only, not content containers.
8. **IntersectionObserver must re-observe after innerHTML replacement.**
   Language toggle replaces timeline HTML; new `.reveal` elements need
   re-observation. Store observer in module scope, call `observeReveals()`
   after each `renderAll()`.
9. **No hardcoded month/day offsets.** The Bulgaria template hardcoded
   `Oct`, `TRIP_START = 8`, and `(4 + day - 1) % 7` for weekdays. That broke
   the moment the trip crossed into December. All date math here goes through
   `parseDate()` + `new Date(year, month, day)`.
10. **jsdom does not implement `scrollIntoView`.** The calendar toggle guards
    with `if (section.scrollIntoView)` so the click handler does not throw.

## Current state

- 10 legs: depart PDX Nov 25 (AS2408 + AS123), arrive Tokyo Nov 26 (TBD
  accommodation), skin doctor at Kinshicho Nov 27 (10:30, lunch Tai Ramen,
  dinner Koshigaya + possible onsen), Nov 29 samba 11:00 AM - 3:00 PM,
  Nov 30 Harue at the cancer center (George free), Dec 1 samba 8:00 PM -
  10:00 PM + Harue dinner with friends (day left free), Dec 2 - Dec 3 Hakone
  onsen with mom and dad at Senkyoro (`https://senkyoro.co.jp/`, 4 nearby
  sights), Dec 6 George samba + Harue with the Oregon team at Pedro's house
  in Jiyugaoka, George returns Dec 7 (AS124 + AS488), Harue returns Dec 13
  (same flights). Nov 28, Dec 4, Dec 5 and Dec 8 - Dec 12 intentionally open.
- Flight gaps: AS2408 and AS124 arrival times/durations are `TBD` pending
  confirmation. Dec 6 samba start time is `time to be confirmed`. Tracked in
  `BACKLOG.md`.
- Calendar renders two month grids (November, December 2026) driven by
  `TRIP_CONFIG.range`; `busyDays` is empty.
- Map is a placeholder SVG (`images/japan-map.svg`).
- Location accent colors: tokyo, kyoto, osaka, transit (template) + hakone.
- All UI bilingual EN/JA with the toggle in the top-right corner.
- 57 tests green; mutation-checked (removing `leg.event` from `hasConcrete`
  fails tests 51, 53, 56; breaking `hasConcrete` or `labelDate` fails 44/47).
