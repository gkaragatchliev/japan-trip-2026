(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var state = {
    lang: "en"
  };

  function t(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[state.lang] || obj.en || "";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** UI labels that live in code (not in TRIP data). */
  var STR = {
    stay: { en: "Stay", ja: "宿泊" },
    flight: { en: "Flight", ja: "フライト" },
    drive: { en: "Drive", ja: "移動" },
    event: { en: "Event", ja: "予定" },
    things: { en: "Things to see", ja: "見どころ" },
    map: { en: "map", ja: "地図" },
    website: { en: "website", ja: "サイト" },
    route: { en: "map", ja: "ルート" },
    road: { en: "road conditions", ja: "道路状況" },
    freeDay: { en: "Free day", ja: "自由日" },
    selectDay: { en: "Select a day...", ja: "日付を選択..." },
    tagFree: { en: "[Free]", ja: "[空き]" },
    tagTravel: { en: "[Travel]", ja: "[移動]" },
    tagBooked: { en: "[Booked]", ja: "[予約済]" },
    tagBusy: { en: "[Busy]", ja: "[予定]" }
  };

  /** Static markup strings, swapped through data-i18n attributes. */
  var STATIC_TEXT = {
    plan: { en: "Plan Activity", ja: "アクティビティを提案" },
    tripCalendar: { en: "Trip Calendar", ja: "旅行カレンダー" },
    legendPlanned: { en: "Planned", ja: "旅行予定" },
    legendBooked: { en: "Booked", ja: "予約済" },
    legendBusy: { en: "Busy", ja: "予定済" },
    legendFree: { en: "Free", ja: "空き" },
    formTitle: { en: "Propose an Activity", ja: "アクティビティを提案" },
    formSubtitle: {
      en: "Pick a free day, suggest something fun. George and Harue will confirm.",
      ja: "空いている日を選び、思いついたことを提案しましょう。GeorgeとHarueが確認します。"
    },
    labelDay: { en: "Day", ja: "日" },
    labelWho: { en: "Who", ja: "対象" },
    labelActivity: { en: "Activity", ja: "内容" },
    whoPrompt: { en: "Who is this for?", ja: "誰のための提案？" },
    whoGeorge: { en: "George", ja: "George" },
    whoHarue: { en: "Harue", ja: "Harue" },
    whoBoth: { en: "Both", ja: "二人" },
    activityPlaceholder: {
      en: "e.g. Visit the zoo, go hiking, water park...",
      ja: "例：動物園に行く、ハイキング、水族館..."
    },
    submit: { en: "Propose via Email", ja: "メールで提案" },
    selectDay: { en: "Select a day...", ja: "日付を選択..." },
    footer: { en: "George & Harue \u00B7 Japan Trip 2026", ja: "George & Harue \u00B7 日本旅行 2026" }
  };

  function syncStaticText() {
    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (STATIC_TEXT[key]) el.textContent = t(STATIC_TEXT[key]);
    });
    $$("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (STATIC_TEXT[key]) el.setAttribute("placeholder", t(STATIC_TEXT[key]));
    });
  }

  function setLang(lang) {
    state.lang = lang === "ja" ? "ja" : "en";
    document.documentElement.lang = state.lang;
    renderAll();
    syncLangUI();
  }

  function syncLangUI() {
    $$(".lang-btn").forEach(function (btn) {
      var active = btn.getAttribute("data-lang") === state.lang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  var revealObserver;

  function observeReveals() {
    if (!revealObserver) return;
    $$(".reveal").forEach(function (el) { revealObserver.observe(el); });
  }

  function calendarVisible() {
    var section = $("#calendar-section");
    return !!section && !section.classList.contains("hidden");
  }

  function renderAll() {
    renderHero();
    renderOverview();
    renderTimeline();
    syncStaticText();
    if (calendarVisible()) {
      renderCalendar();
      populateDaySelect();
    }
    observeReveals();
  }

  function renderHero() {
    var titleEl = $(".hero h1");
    var subEl = $(".hero-sub");
    var kickerEl = $(".hero-kicker");
    var travelersEl = $(".hero-travelers");
    if (titleEl) titleEl.textContent = t(TRIP.title);
    if (subEl) subEl.textContent = t(TRIP.subtitle);
    if (kickerEl) kickerEl.textContent = t(TRIP_CONFIG.kicker);
    if (travelersEl) {
      travelersEl.textContent = TRIP.travelers.join(" & ") + " \u00B7 " +
        t(TRIP_CONFIG.home) + " \u2192 " + t(TRIP_CONFIG.country);
    }
    splitHeroTitle();
  }

  function splitHeroTitle() {
    var titleEl = $(".hero h1");
    if (!titleEl || typeof Splitting === "undefined") return;
    Splitting({ target: titleEl, by: "chars", force: true });
  }

  function mapsLink(q) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  }

  function renderOverview() {
    var el = $("#overview");
    if (!el) return;
    var stops = [];
    TRIP.legs.forEach(function (leg) {
      if (!leg.location) return;
      var key = leg.location.en;
      var last = stops[stops.length - 1];
      if (!last || last.key !== key) stops.push({ key: key, name: leg.location });
    });
    el.innerHTML = stops.map(function (s, i) {
      var sep = i === 0 ? "" : '<span class="ov-arrow">\u2192</span>';
      return sep + '<span class="ov-chip">' + escapeHtml(t(s.name)) + '</span>';
    }).join("");
  }

  function renderTimeline() {
    var wrap = $("#timeline");
    if (!wrap) return;
    wrap.innerHTML = TRIP.legs.map(function (leg, idx) {
      return renderLeg(leg, idx);
    }).join("");
  }

  function renderLeg(leg, idx) {
    var locKey = leg.location ? leg.location.en.toLowerCase().replace(/\s+/g, "") : "transit";
    var dayNum = dayNumberFor(leg) || idx + 1;
    var html = '<div class="timeline-card reveal" data-location="' + escapeHtml(locKey) + '" data-day-num="' + dayNum + '">';
    html += '<span class="tc-day-badge">' + escapeHtml(dayBadgeLabel(dayNum)) + '</span>';
    html += '<div class="tc-header">';
    html += '<span class="tc-date">' + escapeHtml(leg.date) + '</span>';
    html += '<span class="tc-day">' + escapeHtml(t(leg.day)) + '</span>';
    html += '</div>';
    html += '<h3 class="tc-title">' + escapeHtml(t(leg.title)) + '</h3>';

    if (leg.flight) {
      html += renderFlight(leg.flight);
    }
    if (leg.flights) {
      leg.flights.forEach(function (f) { html += renderFlight(f); });
    }

    if (leg.drive) {
      html += renderDrive(leg.drive);
    }

    if (leg.accommodation) {
      var isTbd = /tbd/i.test(leg.accommodation.name);
      html += '<div class="tc-section tc-accommodation' + (isTbd ? " is-tbd" : "") + '">';
      html += '<span class="tc-label">' + escapeHtml(t(STR.stay)) + '</span>';
      if (leg.accommodation.website && !isTbd) {
        html += '<strong><a class="tc-site" href="' + escapeHtml(leg.accommodation.website) + '" target="_blank" rel="noopener">' + escapeHtml(leg.accommodation.name) + '</a></strong>';
      } else {
        html += '<strong>' + escapeHtml(leg.accommodation.name) + '</strong>';
      }
      if (leg.accommodation.details) {
        html += '<span class="tc-detail"> ' + escapeHtml(t(leg.accommodation.details)) + '</span>';
      }
      if (!isTbd) {
        var q = leg.accommodation.name + (leg.location ? ", " + t(leg.location) : "");
        html += ' <a class="tc-map" href="' + mapsLink(q) + '" target="_blank" rel="noopener">' + escapeHtml(t(STR.map)) + '</a>';
      }
      html += '</div>';
    }

    if (leg.event) {
      html += '<div class="tc-section tc-event">';
      html += '<span class="tc-label">' + escapeHtml(t(STR.event)) + '</span>';
      html += '<span class="tc-event-detail">' + escapeHtml(t(leg.event)) + '</span>';
      if (leg.event.website) {
        html += ' <a class="tc-site" href="' + escapeHtml(leg.event.website) + '" target="_blank" rel="noopener">' +
          escapeHtml(t(STR.website)) + '</a>';
      }
      if (leg.event.mapQuery) {
        html += ' <a class="tc-map" href="' + mapsLink(leg.event.mapQuery) + '" target="_blank" rel="noopener">' +
          escapeHtml(t(STR.map)) + '</a>';
      }
      html += '</div>';
    }

    if (leg.meals) {
      leg.meals.forEach(function (meal) {
        html += '<div class="tc-section tc-meal">';
        html += '<span class="tc-label">' + escapeHtml(t(meal.label)) + '</span>';
        html += '<span class="tc-meal-detail">' + escapeHtml(t(meal.name)) + '</span>';
        if (meal.website) {
          html += ' <a class="tc-site" href="' + escapeHtml(meal.website) + '" target="_blank" rel="noopener">' +
            escapeHtml(t(STR.website)) + '</a>';
        }
        if (meal.mapQuery) {
          html += ' <a class="tc-map" href="' + mapsLink(meal.mapQuery) + '" target="_blank" rel="noopener">' +
            escapeHtml(t(STR.map)) + '</a>';
        }
        html += '</div>';
      });
    }

    if (leg.notes) {
      html += '<p class="tc-notes">' + escapeHtml(t(leg.notes)) + '</p>';
    }

    if (leg.pullquote) {
      html += '<blockquote class="tc-pullquote">' + escapeHtml(t(leg.pullquote)) + '</blockquote>';
    }

    if (leg.thingsToSee && leg.thingsToSee.length > 0) {
      html += '<details class="tc-things">';
      html += '<summary>' + escapeHtml(t(STR.things)) + ' (' + leg.thingsToSee.length + ')</summary>';
      html += '<ul class="tc-things-list">';
      leg.thingsToSee.forEach(function (thing) {
        html += '<li>';
        html += '<strong>' + escapeHtml(t(thing.name)) + '</strong>';
        html += ' \u2014 ' + escapeHtml(t(thing.info));
        var thingQ = t(thing.name) + (leg.location ? ", " + t(leg.location) : "");
        html += ' <a class="tc-map" href="' + mapsLink(thingQ) + '" target="_blank" rel="noopener">' + escapeHtml(t(STR.map)) + '</a>';
        html += '</li>';
      });
      html += '</ul>';
      html += '</details>';
    }

    html += '</div>';
    return html;
  }

  function dayBadgeLabel(n) {
    return state.lang === "ja" ? n + "\u65E5\u76EE" : "Day " + n;
  }

  function to24h(str) {
    return str.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, function (_, h, min, ap) {
      h = parseInt(h, 10);
      if (ap.toUpperCase() === "PM" && h !== 12) h += 12;
      if (ap.toUpperCase() === "AM" && h === 12) h = 0;
      return (h < 10 ? "0" : "") + h + ":" + min;
    });
  }

  function renderFlight(f) {
    var html = '<div class="tc-flight">';
    html += '<span class="tc-label">' + escapeHtml(t(STR.flight)) + '</span> ';
    html += '<strong>' + escapeHtml(f.airline) + ' ' + escapeHtml(f.number) + '</strong>';
    html += '<span class="tc-flight-detail"> ';
    var depart = state.lang === "ja" ? to24h(f.depart) : f.depart;
    var arrive = state.lang === "ja" ? to24h(f.arrive) : f.arrive;
    html += escapeHtml(depart) + ' \u2192 ' + escapeHtml(arrive);
    html += ' (' + escapeHtml(f.duration) + ')';
    html += '</span>';
    html += '</div>';
    return html;
  }

  function directionsLink(drive) {
    var country = t(TRIP_CONFIG.country);
    var from = t(drive.from) + ", " + country;
    var to = t(drive.to) + ", " + country;
    return "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(from) +
      "&destination=" + encodeURIComponent(to);
  }

  function trafficLink(drive) {
    var country = t(TRIP_CONFIG.country);
    var from = t(drive.from) + ", " + country;
    var to = t(drive.to) + ", " + country;
    return "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(from) +
      "&destination=" + encodeURIComponent(to) + "&traffic=1";
  }

  function renderDrive(drive) {
    var html = '<div class="tc-drive">';
    html += '<span class="tc-label">' + escapeHtml(t(STR.drive)) + '</span> ';
    html += '<strong>' + escapeHtml(t(drive.from)) + ' \u2192 ' + escapeHtml(t(drive.to)) + '</strong>';
    if (drive.duration) {
      html += '<span class="tc-drive-detail"> (' + escapeHtml(drive.duration) + ')</span>';
    }
    html += ' <a class="tc-map" href="' + directionsLink(drive) + '" target="_blank" rel="noopener">' +
      escapeHtml(t(STR.route)) + '</a>';
    html += ' <a class="tc-map" href="' + trafficLink(drive) + '" target="_blank" rel="noopener">' +
      escapeHtml(t(STR.road)) + '</a>';
    html += '</div>';
    return html;
  }

  function initGParticles() {
    var canvas = document.getElementById("g-particles");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var particles = [];
    var letters = ["G", "H"];
    var colors = [
      "#ff6b9d",
      "#ffd93d",
      "#6bcb77",
      "#4d96ff",
      "#ff922b",
      "#cc5de8",
      "#20c997",
      "#ff8787",
      "#748ffc",
      "#f06595"
    ];
    var fonts = [
      "'Caveat', cursive",
      "'Permanent Marker', cursive"
    ];
    var count = 18;
    var raf;

    function resize() {
      var hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    var colorIdx = 0;
    var letterIdx = 0;

    function createParticle() {
      var c = colors[colorIdx % colors.length];
      var l = letters[letterIdx % letters.length];
      colorIdx++;
      letterIdx++;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.25 - 0.04,
        size: 36 + Math.random() * 56,
        opacity: 0.18 + Math.random() * 0.22,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.005,
        letter: l,
        color: c,
        font: fonts[Math.floor(Math.random() * fonts.length)]
      };
    }

    function init() {
      resize();
      particles = [];
      for (var i = 0; i < count; i++) particles.push(createParticle());
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        if (p.x < -p.size) p.x = canvas.width + p.size;
        if (p.x > canvas.width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = canvas.height + p.size;
        if (p.y > canvas.height + p.size) p.y = -p.size;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.font = "800 " + p.size + "px " + p.font;
        ctx.fillStyle = p.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.letter, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", function () {
      resize();
    });
    init();
    draw();
  }

  function initScrollReveal() {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observeReveals();
  }

  function initProgressBar() {
    var bar = $(".progress-bar");
    if (!bar) return;
    window.addEventListener("scroll", function () {
      var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = pct + "%";
    });
  }

  /* ---- Dates and calendar ---- */
  var MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTHS_FULL_EN = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var DOW_HEADERS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DOW_HEADERS_JA = ["日", "月", "火", "水", "木", "金", "土"];
  var DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var DAY_NAMES_JA = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

  function monthIndex(name) {
    var n = String(name).slice(0, 3).toLowerCase();
    for (var i = 0; i < MONTHS_EN.length; i++) {
      if (MONTHS_EN[i].toLowerCase() === n) return i;
    }
    return -1;
  }

  /** "Nov 25", "Dec 13", "Dec 1 - 3", "Dec 1 - Dec 3" -> month/day range. */
  function parseDate(str) {
    if (!str) return null;
    var m = /^\s*([A-Za-z]+)\s+(\d{1,2})(?:\s*-\s*([A-Za-z]+)?\s*(\d{1,2}))?\s*$/.exec(str);
    if (!m) return null;
    var fromM = monthIndex(m[1]);
    var toM = m[3] ? monthIndex(m[3]) : fromM;
    if (fromM < 0 || toM < 0) return null;
    var from = parseInt(m[2], 10);
    var to = m[4] ? parseInt(m[4], 10) : from;
    return { fromM: fromM, from: from, toM: toM, to: to };
  }

  function rangeBounds(range) {
    var y = TRIP_CONFIG.year;
    return {
      start: new Date(y, range.fromM, range.from),
      end: new Date(y, range.toM, range.to)
    };
  }

  function legCovers(leg, date) {
    var range = parseDate(leg.date);
    if (!range) return false;
    var bounds = rangeBounds(range);
    return date >= bounds.start && date <= bounds.end;
  }

  function tripDays() {
    var bounds = rangeBounds(parseDate(TRIP_CONFIG.range.start));
    var end = rangeBounds(parseDate(TRIP_CONFIG.range.end)).end;
    var out = [];
    var d = new Date(bounds.start.getTime());
    while (d <= end) {
      out.push(new Date(d.getTime()));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function dayNumberFor(leg) {
    var range = parseDate(leg.date);
    var start = parseDate(TRIP_CONFIG.range.start);
    if (!range || !start) return null;
    var a = new Date(TRIP_CONFIG.year, range.fromM, range.from);
    var s = new Date(TRIP_CONFIG.year, start.fromM, start.from);
    return Math.round((a.getTime() - s.getTime()) / 86400000) + 1;
  }

  function labelDate(date, lang) {
    var m = date.getMonth() + 1;
    var n = date.getDate();
    if (lang === "ja") return m + "\u6708" + n + "\u65E5";
    return MONTHS_EN[date.getMonth()] + " " + n;
  }

  function busyOverride(date) {
    var busyDays = TRIP.busyDays || [];
    for (var i = 0; i < busyDays.length; i++) {
      var range = parseDate(busyDays[i].date);
      if (!range) continue;
      var bounds = rangeBounds(range);
      if (date >= bounds.start && date <= bounds.end) return busyDays[i];
    }
    return null;
  }

  function buildDayMap() {
    var days = tripDays().map(function (d, i) {
      return {
        date: d,
        num: d.getDate(),
        month: d.getMonth(),
        dow: d.getDay(),
        index: i,
        value: labelDate(d, "en"),
        label: labelDate(d, state.lang),
        status: "free",
        desc: "",
        leg: null
      };
    });

    days.forEach(function (entry) {
      for (var i = 0; i < TRIP.legs.length; i++) {
        if (legCovers(TRIP.legs[i], entry.date)) {
          entry.leg = TRIP.legs[i];
          break;
        }
      }
      if (entry.leg) {
        var leg = entry.leg;
        var hasConcrete = leg.flight || leg.flights || leg.drive || leg.accommodation ||
          (leg.thingsToSee && leg.thingsToSee.length > 0) || leg.pullquote || leg.event;
        entry.desc = t(leg.title);
        if (leg.flight || leg.flights) entry.status = "travel";
        else if (hasConcrete) entry.status = "booked";
        else entry.status = "free";
      }
      var busy = busyOverride(entry.date);
      if (busy) {
        entry.status = "busy";
        entry.desc = t(busy.title);
      }
    });

    return days;
  }

  function renderMonthGrid(group) {
    var y = TRIP_CONFIG.year;
    var m = group.month;
    var isJa = state.lang === "ja";
    var byNum = {};
    group.days.forEach(function (day) { byNum[day.num] = day; });

    var title = isJa ? y + "\u5E74" + (m + 1) + "\u6708" : MONTHS_FULL_EN[m] + " " + y;
    var dowHeaders = isJa ? DOW_HEADERS_JA : DOW_HEADERS_EN;
    var firstDow = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    var html = '<div class="cal-month">';
    html += '<h4 class="cal-month-title">' + escapeHtml(title) + '</h4>';
    html += '<div class="cal-grid"><div class="cal-header">';
    for (var h = 0; h < 7; h++) {
      html += '<div class="cal-header-cell">' + dowHeaders[h] + '</div>';
    }
    html += '</div><div class="cal-body">';

    for (var p = 0; p < firstDow; p++) {
      html += '<div class="cal-cell cal-empty"></div>';
    }

    for (var n = 1; n <= daysInMonth; n++) {
      var day = byNum[n];
      if (!day) {
        html += '<div class="cal-cell cal-empty"></div>';
        continue;
      }
      var status = day.status === "travel" ? "planned" : day.status;
      var desc = day.desc || t(STR.freeDay);
      html += '<div class="cal-cell cal-day ' + status + '">' +
        '<span class="cal-day-date">' + escapeHtml(day.label) + '</span>' +
        '<span class="cal-day-desc">' + escapeHtml(desc) + '</span>' +
        '</div>';
    }

    html += '</div></div></div>';
    return html;
  }

  function renderCalendar() {
    var cal = $("#calendar");
    if (!cal) return;
    var groups = [];
    buildDayMap().forEach(function (day) {
      var last = groups[groups.length - 1];
      if (!last || last.month !== day.month) {
        last = { month: day.month, days: [] };
        groups.push(last);
      }
      last.days.push(day);
    });
    cal.innerHTML = groups.map(renderMonthGrid).join("");
  }

  function populateDaySelect() {
    var sel = $("#plan-day");
    if (!sel) return;
    var isJa = state.lang === "ja";
    var dayNames = isJa ? DAY_NAMES_JA : DAY_NAMES_EN;
    var opts = '<option value="">' + t(STR.selectDay) + '</option>';
    buildDayMap().forEach(function (day) {
      var label = day.label + " - " + dayNames[day.dow];
      var disabled = day.status !== "free" ? " disabled" : "";
      var tag = day.status === "free" ? t(STR.tagFree) :
        day.status === "travel" ? t(STR.tagTravel) :
          day.status === "busy" ? t(STR.tagBusy) : t(STR.tagBooked);
      opts += '<option value="' + day.value + '"' + disabled + '>' + label + " " + tag + '</option>';
    });
    sel.innerHTML = opts;
  }

  function initCalendar() {
    var toggleBtn = $("#plan-toggle");
    var section = $("#calendar-section");
    if (!toggleBtn || !section) return;

    toggleBtn.addEventListener("click", function () {
      var hidden = section.classList.contains("hidden");
      section.classList.toggle("hidden", !hidden);
      toggleBtn.classList.toggle("active", hidden);
      if (hidden) {
        renderCalendar();
        populateDaySelect();
        if (section.scrollIntoView) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });

    var form = $("#activity-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var dayVal = $("#plan-day").value;
      var whoSel = $("#plan-who");
      var whoVal = whoSel.value ? whoSel.options[whoSel.selectedIndex].text : "";
      var actVal = $("#plan-activity").value.trim();
      if (!dayVal || !whoVal || !actVal) return;

      var subject = t(TRIP_CONFIG.title) + " - Activity Proposal";
      var body = "Hi " + TRIP.travelers.join(" and ") + ",\n\n" +
        "I'd like to propose an activity:\n\n" +
        "Day: " + dayVal + "\n" +
        "Who: " + whoVal + "\n" +
        "Activity: " + actVal + "\n\n" +
        "Let me know if this works!\n";
      var mailto = "mailto:" + TRIP_CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      window.location.href = mailto;
    });
  }

  function init() {
    var langBtns = $$(".lang-btn");
    langBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });
    renderAll();
    syncLangUI();
    initGParticles();
    if (typeof IntersectionObserver !== "undefined") initScrollReveal();
    initProgressBar();
    initCalendar();

    window.addEventListener("beforeprint", function () {
      $$(".tc-things").forEach(function (d) {
        if (!d.open) { d.setAttribute("data-print-open", "1"); d.open = true; }
      });
    });
    window.addEventListener("afterprint", function () {
      $$(".tc-things").forEach(function (d) {
        if (d.getAttribute("data-print-open")) {
          d.open = false;
          d.removeAttribute("data-print-open");
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
