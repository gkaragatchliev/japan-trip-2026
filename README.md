# Japan Trip 2026

A bilingual (EN/JA) static reference site for George and Harue's
November 25 - December 13, 2026 trip to Japan. Displays the itinerary,
flights, and things to see at each stop. Deployed on GitHub Pages.

Ten legs are filled in: both flights out, the Nov 27 Kinshicho day, the
Nov 29 samba, Nov 30, Dec 1, the Dec 2 - Dec 3 Hakone stay, Dec 6, and both
returns. Nov 28, Dec 4, and Dec 5 are deliberately open. See `BACKLOG.md`
for what is pending.

## Run locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Run tests

```bash
npm install
npm test
```

The suite (`tests/site.test.js`, 57 tests) loads the real page in jsdom:
legs render, EN/JA toggle works, flights and day badges are correct, the
two-month calendar aligns to weekdays, free days are reservable, busy days
are blocked, and no Bulgarian keys survive from the template.

## Structure

| File | Purpose |
|---|---|
| `index.html` | Page structure (hero, timeline, calendar, footer) |
| `css/style.css` | Styles (teal/ink palette, location accents, calendar) |
| `js/config.js` | Trip settings (title, dates, travelers, range) |
| `js/data.js` | Trip data model (legs, flights, busyDays) |
| `js/app.js` | Rendering, date engine, language toggle, calendar |
| `images/japan-map.svg` | Map placeholder (replace when a real map is picked) |
| `PRD.md` | Product requirements document |
| `BACKLOG.md` | Open work |
| `tests/site.test.js` | 57 tests, all passing |

## Editing the itinerary

Trip details live in `js/data.js`. Add or edit entries in `TRIP.legs`; each
leg needs `id`, `date`, `day`, `title`, `notes`, `thingsToSee`. All text has
`en` and `ja` variants. Date range and calendar bounds come from
`js/config.js` (`range`, `year`).

## Deploy

Commit + push to `main`. GitHub Pages publishes automatically (~1 min).
Use cache-busting query strings (`?v=N`) when changing CSS or JS.
