# Japan Trip 2026 -- PRD

## Product
Bilingual (EN/JA) static reference site for George and Harue's
November 25 - December 13, 2026 Japan trip. Itinerary display,
flights, accommodations, things to see, activity planning.
Reusable template for future trips. Deployed on GitHub Pages,
shareable with family.

## Reusable Template
To create a new trip site from this template:
1. Copy the folder
2. Edit `js/config.js` -- trip title, subtitle, kicker, travelers, email,
   country, year, date range
3. Edit `js/data.js` -- legs (flights, drives, accommodations, notes,
   things to see) and `busyDays`
4. Update `index.html` -- `<title>`, favicon, hero fallback text
5. Update `css/style.css` -- `--loc-*` accent colors for the new stops
6. Deploy to GitHub Pages

## Tech Stack
- Vanilla HTML/CSS/JS (ES5, IIFE, var) -- no frameworks, no build step
- Vendor libs: Splitting.js (hero title char animation), Rough.js (committed
  for hand-drawn map work, unused so far)
- node --test + jsdom tests (57 tests), GitHub Pages deploy

## Data Architecture
- `js/config.js` -- trip-specific settings (title, dates, travelers, email,
  country, year, range, colors)
- `js/data.js` -- `TRIP` object: `legs[]` and `busyDays[]`, references
  `TRIP_CONFIG` for metadata
- `js/app.js` -- all rendering logic, date engine, language toggle,
  calendar, animations, XSS escaping

## Language
English/Japanese selector in the top-right corner. All `TRIP`/`TRIP_CONFIG`
text is `{ en, ja }`. Static markup text (legend, form, buttons, footer) is
swapped through `data-i18n` attributes from `STATIC_TEXT` in `app.js`.
Japanese uses a 24-hour clock for flights.

## Features

### Hero Section
- Animated title (Splitting.js char-by-char fly-in)
- Floating G/H particles (Caveat + Permanent Marker fonts)
- Language toggle (EN/JA), Plan Activity button
- Travelers display, gradient background with warm radial accents

### Timeline
- Vertical cards with connector line and location-colored dots
- Each card: date, day name, title, flight/drive/accommodation details
- Giant day number watermarks (DM Serif Display, location-tinted)
- Day badges counted from `TRIP_CONFIG.range.start` (Nov 25 = Day 1)
- Pull quotes on key legs
- Expandable "things to see" with Google Maps links
- Scroll-reveal animations (IntersectionObserver)

### Drive Routes
- Google Maps directions + live traffic links
- Country-qualified (`Japan`) to avoid ambiguity

### Flight Display
- Boarding-pass style cards with dashed border
- 24-hour time conversion for Japanese language

### Route Map
- Placeholder `images/japan-map.svg` in the map slot
- Real Japan map is an open backlog item (see `BACKLOG.md`)

### Plan Activity Feature
- "Plan Activity" button toggles the calendar section
- Two month grids (November 2026, December 2026), each with weekday headers,
  out-of-trip days rendered as empty cells
- Day status colors: travel=blue, booked=yellow, busy=red, free=green
- Activity proposal form: day selector (free days only), who, description
- Pre-filled `mailto:` to the trip organizer

### Date Engine
- `parseDate()` accepts `Nov 25`, `Dec 13`, `Dec 1 - 3`, `Dec 1 - Dec 3`
- `tripDays()` walks `TRIP_CONFIG.range.start` to `.end`
- Weekday math uses `new Date(year, month, day)` -- no hardcoded month offsets
- Month headings and cell labels are localized (EN `Nov 25`, JA `11月25日`)

### Design System
- Typography: DM Serif Display + Space Grotesk (+ system Japanese fallback)
- Particles: Caveat + Permanent Marker
- Colors: teal/ink palette, location accents (Tokyo=blue, Kyoto=wine,
  Osaka=amber, transit=grey)
- Card shadows, hover effects, print stylesheet

## Data Model
- TRIP_CONFIG: title, subtitle, kicker, travelers, home, email, country,
  year, range { start, end }, primary color
- TRIP.legs[]: id, location, date, day, title, flight/flights, drive,
  accommodation, event, notes, thingsToSee, pullquote
- TRIP.busyDays[]: { date, title } days forced to busy (own calendar color,
  not reservable on the form)
- Drive legs: { from, to, duration } for map + traffic links
- All user-facing text: `{ en: "...", ja: "..." }` bilingual objects
- TBD convention: accommodation named `TBD` renders the warning badge and
  skips the map link; unknown flight times use the string `TBD`

## Tests
57 tests covering:
- Itinerary renders all legs, flight numbers, day badges
- Per-day content for Nov 27, Nov 29, Nov 30, Dec 1, Dec 6, and the
  Dec 2 - Dec 3 Hakone stay (Senkyoro link, 7 sights with map links)
- Language toggle switches timeline, hero, static UI, month headings
- Japanese 24-hour flight times
- TBD accommodation badge
- Drive legs and things-to-see rendering (injected at test level)
- Overview strip reflects Tokyo -> Hakone -> Tokyo, hero travelers, map asset
- Two-month calendar: cell counts, weekday alignment, free/busy/booked/travel
  statuses, day select contents and tags, busyDays blocking
- Data guards: no Bulgarian keys left from the template copy
- XSS escaping and `t()` helper behavior

## Deployment
- GitHub Pages from main branch
- Cache-busting query strings on CSS/JS (bump on every change)
- `vendor/` folder for third-party libs (committed, referenced locally)
