/* ==========================================================================
   RAJU & AISHU — ROYAL SOUTH INDIAN HINDU WEDDING INVITATION
   main.js — vanilla JavaScript, no framework.

   Modules
   ------
   00. Utilities
   01. Configuration access
   02. Date & time helpers
   03. View model + DOM bindings
   04. Entrance curtain
   05. Music controller
   06. Scratch-to-reveal card
   07. Countdown
   08. Ritual timeline
   09. Gallery + lightbox
   10. Venue & directions
   11. Dress code / travel / accommodation / gifts
   12. RSVP
   13. Closing, footer & structured data
   14. Scroll reveal, topbar & petals
   15. Boot
   ========================================================================== */

(function () {
  "use strict";

  /* ========================================================================
     00. UTILITIES
     ======================================================================== */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

  const REDUCED_MOTION = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  const prefersReducedMotion = () => !!REDUCED_MOTION.matches;

  /** Small, dependency-free event helper. */
  function on(el, type, handler, opts) {
    if (el) el.addEventListener(type, handler, opts);
  }

  /** Escape text before it is injected into markup. */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Replace {token} placeholders in a template string. */
  function fill(template, tokens) {
    return String(template || "").replace(/\{(\w+)\}/g, function (m, key) {
      return tokens && tokens[key] != null ? tokens[key] : "";
    });
  }

  let toastTimer = null;
  function showToast(message, ms) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove("is-visible");
    }, ms || 4200);
  }

  /** Clamp a number into a range. */
  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  /** Pad a number to two digits. */
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  /* ========================================================================
     01. CONFIGURATION ACCESS
     ======================================================================== */
  const CONFIG = (function () {
    const raw = window.weddingConfig;
    if (raw && typeof raw === "object") return raw;
    console.warn("[wedding] config.js not found — falling back to safe defaults.");
    return {
      couple: { groom: "Raju", bride: "Aishu" },
      event: { timezone: "Asia/Kolkata" },
      entrance: { enabled: true, prompt: "Tap to Open the Invitation" },
      music: { enabled: false },
      rituals: [],
      gallery: [],
      rsvp: { enabled: true, submissionEndpoint: "" }
    };
  })();

  /** Safely read a nested value: read(cfg, "couple.groom", fallback). */
  function read(obj, path, fallback) {
    const parts = String(path).split(".");
    let cur = obj;
    for (let i = 0; i < parts.length; i += 1) {
      if (cur == null || typeof cur !== "object") return fallback;
      cur = cur[parts[i]];
    }
    return cur == null ? fallback : cur;
  }

  /* ========================================================================
     02. DATE & TIME HELPERS
     ======================================================================== */

  /** Offset (ms) of a timezone at a given instant. */
  function zoneOffset(date, timeZone) {
    try {
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      const map = {};
      dtf.formatToParts(date).forEach(function (p) {
        map[p.type] = p.value;
      });
      const asUTC = Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour) % 24,
        Number(map.minute),
        Number(map.second)
      );
      return asUTC - date.getTime();
    } catch (err) {
      return 0;
    }
  }

  /** Convert a wall-clock time in `timeZone` to a UTC timestamp. */
  function zonedToUtc(year, month, day, hour, minute, timeZone) {
    const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
    const off1 = zoneOffset(new Date(guess), timeZone);
    let ts = guess - off1;
    const off2 = zoneOffset(new Date(ts), timeZone);
    if (off2 !== off1) ts = guess - off2;
    return ts;
  }

  /**
   * Resolve the wedding moment from the configuration.
   * Returns { ts:Number, tz:String, local:{y,m,d,h,mi}, known:Boolean }.
   */
  function resolveEvent() {
    const ev = read(CONFIG, "event", {}) || {};
    const tz = ev.timezone || "Asia/Kolkata";
    const rawDate = String(ev.date || "").trim();
    const rawTime = String(ev.time || "").trim();

    if (!rawDate) {
      return { ts: null, tz: tz, local: null, known: false };
    }

    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(rawDate);
    if (iso) {
      const hour = /^\s*(\d{1,2})[:.](\d{2})/i.exec(rawTime);
      let h = hour ? Number(hour[1]) : 0;
      let mi = hour ? Number(hour[2]) : 0;
      const meridiem = /\s*(am|pm)\s*$/i.exec(rawTime);
      if (meridiem) {
        const pm = meridiem[1].toLowerCase() === "pm";
        if (pm && h < 12) h += 12;
        if (!pm && h === 12) h = 0;
      }
      const y = Number(iso[1]);
      const mo = Number(iso[2]);
      const d = Number(iso[3]);
      const ts = zonedToUtc(y, mo, d, h, mi, tz);
      return {
        ts: ts,
        tz: tz,
        local: { y: y, m: mo, d: d, h: h, mi: mi },
        known: true
      };
    }

    // Fall back to a full ISO-8601 string if the couple supplied one.
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      return { ts: parsed.getTime(), tz: tz, local: null, known: true };
    }

    console.warn("[wedding] event.date could not be parsed:", rawDate);
    return { ts: null, tz: tz, local: null, known: false };
  }

  const EVENT = resolveEvent();

  function formatDate(ts, tz) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(new Date(ts));
    } catch (err) {
      return new Date(ts).toDateString();
    }
  }

  function formatDay(ts, tz) {
    try {
      return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long" }).format(new Date(ts));
    } catch (err) {
      return "";
    }
  }

  function formatTime(ts, tz) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).format(new Date(ts));
    } catch (err) {
      return "";
    }
  }

  function formatTimezone(tz) {
    try {
      const offset = zoneOffset(new Date(), tz) / 60000;
      const sign = offset >= 0 ? "+" : "-";
      const abs = Math.abs(offset);
      const hh = pad(Math.floor(abs / 60));
      const mm = pad(abs % 60);
      return "GMT" + sign + hh + ":" + mm;
    } catch (err) {
      return tz;
    }
  }

  /* ========================================================================
     03. VIEW MODEL + DOM BINDINGS
     ======================================================================== */
  const view = buildViewModel();

  function buildViewModel() {
    const v = JSON.parse(JSON.stringify(CONFIG));

    v.event = v.event || {};
    v.event.displayDate = EVENT.known ? formatDate(EVENT.ts, EVENT.tz) : "Wedding date to be announced";
    v.event.displayTime = EVENT.known ? formatTime(EVENT.ts, EVENT.tz) : "To be announced";
    v.event.displayDay = EVENT.known ? formatDay(EVENT.ts, EVENT.tz) : "";
    v.event.displayVenue = v.event.venueName ? v.event.venueName : "Venue to be announced";
    v.event.displayAddress = v.event.venueAddress || "";

    v.couple = v.couple || {};
    v.couple.groom = v.couple.groom || "Raju";
    v.couple.bride = v.couple.bride || "Aishu";

    v.invitation = v.invitation || {};
    v.invitation.message = fill(v.invitation.message, {
      groom: v.couple.groom,
      bride: v.couple.bride
    });

    return v;
  }

  /** Apply every [data-bind] element using the resolved view model. */
  function applyBindings() {
    $$("[data-bind]").forEach(function (el) {
      const path = el.getAttribute("data-bind");
      const value = read(view, path, "");
      if (value === "" || value == null) {
        el.textContent = "";
        return;
      }
      el.textContent = String(value);
    });
  }

  /* ========================================================================
     04. ENTRANCE CURTAIN
     ======================================================================== */
  const curtain = {
    el: null,
    opened: false,
    opening: false,
    duration: 1800,

    init: function () {
      this.el = $("#entrance");
      const enabled = read(CONFIG, "entrance.enabled", true);

      if (!this.el || !enabled) {
        this.finish(true);
        return;
      }

      this.duration = Number(read(CONFIG, "entrance.openDuration", 1800)) || 1800;
      document.body.classList.add("is-locked");

      const stage = $("#curtainStage");
      const opener = $("#openInvitation");

      // The whole stage is a valid tap target — but the button stays the
      // accessible control for keyboard and screen-reader users.
      on(stage, "click", function (e) {
        if (e.target.closest("#openInvitation")) return;
        curtain.open();
      });
      on(opener, "click", function () {
        curtain.open();
      });

      on(document, "keydown", function (e) {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
          if (!curtain.opened && document.activeElement === opener) {
            e.preventDefault();
            curtain.open();
          }
        }
      });

      // Move focus to the opener so keyboard users land on the right control.
      window.setTimeout(function () {
        if (opener) opener.focus({ preventScroll: true });
      }, 120);
    },

    open: function () {
      if (this.opened || this.opening) return; // prevent repeat openings
      this.opening = true;

      const el = this.el;
      el.classList.add("is-opening");

      const wait = prefersReducedMotion() ? 260 : this.duration;

      window.setTimeout(function () {
        curtain.finish(false);
      }, wait);
    },

    finish: function (immediate) {
      if (this.opened) return;
      this.opened = true;
      this.opening = false;

      const el = this.el;
      if (el) {
        el.classList.add("is-hidden");
        window.setTimeout(function () {
          el.setAttribute("hidden", "");
          el.setAttribute("aria-hidden", "true");
        }, prefersReducedMotion() ? 60 : 720);
      }

      document.body.classList.remove("is-locked");
      document.body.classList.add("is-open");

      // Reveal the hero and start any optional music.
      window.setTimeout(function () {
        if (typeof musicController !== "undefined" && musicController) {
          musicController.onFirstInteraction();
        }
      }, prefersReducedMotion() ? 40 : 420);

      if (typeof updateStructuredData === "function") updateStructuredData();
    }
  };

  /* ========================================================================
     05. MUSIC CONTROLLER
     ======================================================================== */
  const musicController = {
    audio: null,
    button: null,
    playing: false,
    unlocked: false,
    fadeTimer: null,

    init: function () {
      this.audio = $("#bgMusic");
      this.button = $("#musicToggle");
      if (!this.audio || !this.button) return;

      const enabled = read(CONFIG, "music.enabled", false);
      if (!enabled) {
        this.button.hidden = true;
        return;
      }

      this.setSources();
      this.audio.volume = 0;

      on(this.button, "click", function () {
        musicController.toggle();
      });

      on(this.audio, "error", function () {
        if (musicController.playing) {
          musicController.playing = false;
          musicController.setButtonState(false);
        }
        showToast("The wedding music file could not be loaded on this device.");
      });
    },

    setSources: function () {
      const list = [read(CONFIG, "music.audioFile", "")];
      const fallbacks = read(CONFIG, "music.audioFallbacks", []) || [];
      fallbacks.forEach(function (f) {
        if (f) list.push(f);
      });

      const sources = list
        .filter(Boolean)
        .map(function (src) {
          return '<source src="' + esc(src) + '" type="' + audioMime(src) + '">';
        })
        .join("");

      this.audio.innerHTML = sources;
    },

    onFirstInteraction: function () {
      this.unlocked = true;
      const auto = read(CONFIG, "music.autoplayAfterInteraction", true);
      if (auto && !this.playing) this.play();
    },

    play: function () {
      const self = this;
      const volume = clamp(Number(read(CONFIG, "music.volume", 0.45)), 0, 1);

      const p = this.audio.play();
      if (p && typeof p.catch === "function") {
        p.then(function () {
          self.playing = true;
          self.setButtonState(true);
          self.fadeTo(volume, 1400);
        }).catch(function (err) {
          self.playing = false;
          self.setButtonState(false);
          console.warn("[wedding] music playback was blocked:", err && err.name);
          showToast("Music could not be started automatically — tap the music button to play.");
        });
      }
    },

    pause: function () {
      this.fadeTo(0, 420, function () {
        musicController.audio.pause();
      });
      this.playing = false;
      this.setButtonState(false);
    },

    toggle: function () {
      if (this.playing) {
        this.pause();
      } else {
        this.unlocked = true;
        this.play();
      }
    },

    fadeTo: function (target, duration, done) {
      const self = this;
      const audio = this.audio;
      window.clearInterval(this.fadeTimer);
      const start = audio.volume;
      const steps = Math.max(1, Math.round(duration / 40));
      let step = 0;

      this.fadeTimer = window.setInterval(function () {
        step += 1;
        const progress = step / steps;
        audio.volume = start + (target - start) * progress;
        if (step >= steps) {
          window.clearInterval(self.fadeTimer);
          if (typeof done === "function") done();
        }
      }, 40);
    },

    setButtonState: function (isPlaying) {
      this.button.classList.toggle("is-playing", isPlaying);
      this.button.setAttribute("aria-pressed", isPlaying ? "true" : "false");
      this.button.setAttribute(
        "aria-label",
        isPlaying ? "Pause wedding music" : "Play wedding music"
      );
    }
  };

  function audioMime(src) {
    const ext = String(src).split(".").pop().toLowerCase();
    if (ext === "mp3") return "audio/mpeg";
    if (ext === "ogg" || ext === "oga") return "audio/ogg";
    if (ext === "wav") return "audio/wav";
    if (ext === "m4a") return "audio/mp4";
    return "audio/mpeg";
  }

  /* ========================================================================
     06. SCRATCH-TO-REVEAL CARD
     ======================================================================== */
  const scratchCard = {
    canvas: null,
    ctx: null,
    surface: null,
    panel: null,
    drawing: false,
    lastX: 0,
    lastY: 0,
    checkCanvas: null,
    checkCtx: null,
    coverage: 0,
    revealed: false,
    strokeCount: 0,
    resizeTimer: null,
    input: null,

    THRESHOLD: 0.25, // auto-reveal once this much of the foil is removed
    BRUSH: 42, // brush radius in CSS pixels
    CHECK_SCALE: 0.25, // downscale used by the coverage-sampling canvas

    init: function () {
      this.canvas = $("#scratchCanvas");
      this.surface = $("#scratchSurface");
      this.panel = $("#scratchMessage");
      if (!this.canvas || !this.surface) return;

      this.ctx = this.canvas.getContext("2d", { willReadFrequently: false });
      this.checkCanvas = document.createElement("canvas");
      this.checkCtx = this.checkCanvas.getContext("2d", { willReadFrequently: true });

      this.resize();

      on(window, "resize", function () {
        window.clearTimeout(scratchCard.resizeTimer);
        scratchCard.resizeTimer = window.setTimeout(function () {
          if (!scratchCard.revealed) scratchCard.resize();
        }, 180);
      });

      // Repaint once the display fonts are ready so the foil lettering is crisp.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          if (!scratchCard.revealed) scratchCard.paintFoil();
        });
      }

      this.bindPointer();

      const revealBtn = $("#revealInvitation");
      on(revealBtn, "click", function () {
        scratchCard.reveal(true);
      });

      const messageText = $("#scratchMessageText");
      if (messageText && read(view, "invitation.message")) {
        messageText.textContent = read(view, "invitation.message");
      }
    },

    /* ---- sizing & painting ------------------------------------------- */
    resize: function () {
      const rect = this.surface.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      this.canvas.style.width = rect.width + "px";
      this.canvas.style.height = rect.height + "px";
      this.dpr = dpr;

      this.checkCanvas.width = Math.max(1, Math.round(rect.width * this.CHECK_SCALE));
      this.checkCanvas.height = Math.max(1, Math.round(rect.height * this.CHECK_SCALE));

      this.paintFoil();
    },

    /** Paint the gold-foil scratch layer straight into the canvas. */
    paintFoil: function () {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      if (!w || !h) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Base antique-gold silk gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#8e6f33");
      grad.addColorStop(0.12, "#e7d3a6");
      grad.addColorStop(0.26, "#c5a059");
      grad.addColorStop(0.4, "#f5ead0");
      grad.addColorStop(0.52, "#b8944e");
      grad.addColorStop(0.66, "#e7d3a6");
      grad.addColorStop(0.82, "#c5a059");
      grad.addColorStop(1, "#8e6f33");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Woven zari lattice
      ctx.strokeStyle = "rgba(94, 68, 26, 0.24)";
      ctx.lineWidth = Math.max(1, w / 420);
      const step = Math.max(24, w / 13);
      ctx.beginPath();
      for (let x = 0; x <= w + step; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x - h, h);
      }
      for (let x = 0; x <= w + step; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
      }
      ctx.stroke();

      // Diamond motifs
      ctx.strokeStyle = "rgba(120, 88, 34, 0.3)";
      ctx.lineWidth = Math.max(1, w / 520);
      const cell = Math.max(38, w / 7);
      for (let cx = cell / 2; cx < w + cell; cx += cell) {
        for (let cy = cell / 2; cy < h + cell; cy += cell) {
          ctx.beginPath();
          ctx.moveTo(cx, cy - cell * 0.3);
          ctx.lineTo(cx + cell * 0.3, cy);
          ctx.lineTo(cx, cy + cell * 0.3);
          ctx.lineTo(cx - cell * 0.3, cy);
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Fine speckle for a foil texture
      const noise = this.makeNoiseTile();
      if (noise) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = noise;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      // Soft sheen
      const sheen = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, Math.max(w, h) * 0.8);
      sheen.addColorStop(0, "rgba(255,255,255,0.32)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);

      // Foil lettering
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = "SCRATCH TO REVEAL";
      const size = Math.max(11, Math.round(h * 0.115));
      ctx.font = '500 ' + size + 'px "Cinzel", Georgia, serif';
      ctx.fillStyle = "rgba(74, 52, 16, 0.72)";
      ctx.letterSpacing = size * 0.26 + "px";
      ctx.fillText(label, w / 2, h / 2 - size * 0.25);
      ctx.letterSpacing = "0px";

      // Ornamental rule under the lettering
      ctx.strokeStyle = "rgba(74, 52, 16, 0.45)";
      ctx.lineWidth = Math.max(1, w / 700);
      const ruleW = Math.min(w * 0.32, size * 7);
      ctx.beginPath();
      ctx.moveTo(w / 2 - ruleW, h / 2 + size * 0.62);
      ctx.lineTo(w / 2 + ruleW, h / 2 + size * 0.62);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2 + size * 0.28);
      ctx.lineTo(w / 2 + size * 0.32, h / 2 + size * 0.62);
      ctx.lineTo(w / 2, h / 2 + size * 0.96);
      ctx.lineTo(w / 2 - size * 0.32, h / 2 + size * 0.62);
      ctx.closePath();
      ctx.fillStyle = "rgba(74, 52, 16, 0.55)";
      ctx.fill();
    },

    /** A small repeating noise tile used to give the foil a paper texture. */
    makeNoiseTile: function () {
      const size = 48;
      const tile = document.createElement("canvas");
      tile.width = size;
      tile.height = size;
      const tctx = tile.getContext("2d");
      const img = tctx.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() > 0.5 ? 255 : 0;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = Math.random() * 26;
      }
      tctx.putImageData(img, 0, 0);
      return this.ctx.createPattern(tile, "repeat");
    },

    /* ---- pointer handling -------------------------------------------- */
    bindPointer: function () {
      const canvas = this.canvas;

      const pos = function (e) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (e.clientX - rect.left) * (canvas.width / rect.width),
          y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
      };

      const self = this;

      // Chrome makes <canvas> natively draggable. A drag-and-drop triggered
      // while scratching would navigate the invitation away, so block it.
      on(canvas, "dragstart", function (e) {
        e.preventDefault();
      });
      on(this.surface, "dragstart", function (e) {
        e.preventDefault();
      });
      on(canvas, "dragover", function (e) {
        e.preventDefault();
      });
      on(canvas, "drop", function (e) {
        e.preventDefault();
      });

      on(canvas, "pointerdown", function (e) {
        if (self.revealed) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        self.input = "pointer";
        self.drawing = true;
        self.strokeCount = 0;
        const p = pos(e);
        self.lastX = p.x;
        self.lastY = p.y;
        self.eraseDot(p.x, p.y);
        if (canvas.setPointerCapture && e.pointerId != null) {
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch (err) {
            /* pointer capture is optional */
          }
        }
      });

      on(canvas, "pointermove", function (e) {
        if (self.input !== "pointer" || !self.drawing || self.revealed) return;
        e.preventDefault();
        const p = pos(e);
        self.eraseLine(self.lastX, self.lastY, p.x, p.y);
        self.lastX = p.x;
        self.lastY = p.y;
      });

      const endPointer = function () {
        if (self.input !== "pointer") return;
        self.drawing = false;
        self.input = null;
        self.measure();
      };
      on(canvas, "pointerup", endPointer);
      on(canvas, "pointercancel", endPointer);
      on(canvas, "pointerleave", endPointer);

      /* --- Touch fallback -------------------------------------------------
         Pointer Events are supported everywhere modern, but a dedicated
         touch path guarantees the scratch gesture works on older iOS
         browsers and in environments where pointer events are suppressed. */
      const touchPos = function (touch) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (touch.clientX - rect.left) * (canvas.width / rect.width),
          y: (touch.clientY - rect.top) * (canvas.height / rect.height)
        };
      };

      on(canvas, "touchstart", function (e) {
        if (self.revealed || self.input === "pointer") return;
        e.preventDefault();
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        self.input = "touch";
        self.drawing = true;
        self.strokeCount = 0;
        const p = touchPos(touch);
        self.lastX = p.x;
        self.lastY = p.y;
        self.eraseDot(p.x, p.y);
      }, { passive: false });

      on(canvas, "touchmove", function (e) {
        if (self.input !== "touch" || !self.drawing || self.revealed) return;
        e.preventDefault();
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        const p = touchPos(touch);
        self.eraseLine(self.lastX, self.lastY, p.x, p.y);
        self.lastX = p.x;
        self.lastY = p.y;
      }, { passive: false });

      const endTouch = function (e) {
        if (self.input !== "touch") return;
        if (e && e.cancelable) e.preventDefault();
        self.drawing = false;
        self.input = null;
        self.measure();
      };
      on(canvas, "touchend", endTouch);
      on(canvas, "touchcancel", endTouch);

      // Stop the page from scrolling while the visitor scratches the card.
      on(this.surface, "touchmove", function (e) {
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
    },

    /** Erase a single dot from the foil. */
    eraseDot: function (x, y) {
      const ctx = this.ctx;
      const r = this.BRUSH * (this.dpr || 1);
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      this.eraseCheckDot(x, y, r);
    },

    /** Erase a line segment from the foil (soft-edged). */
    eraseLine: function (x0, y0, x1, y1) {
      const ctx = this.ctx;
      const r = this.BRUSH * (this.dpr || 1);
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = r * 1.6;
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.restore();
      this.eraseCheckLine(x0, y0, x1, y1);
    },

    /* ---- coverage tracking (downscaled mirror canvas) ----------------- */
    eraseCheckDot: function (x, y, r) {
      const c = this.checkCtx;
      const sx = this.checkCanvas.width / this.canvas.width;
      c.save();
      c.globalCompositeOperation = "source-over";
      c.fillStyle = "rgba(0,0,0,1)";
      c.beginPath();
      c.arc(x * sx, y * sx, r * sx, 0, Math.PI * 2);
      c.fill();
      c.restore();
    },

    eraseCheckLine: function (x0, y0, x1, y1) {
      const c = this.checkCtx;
      const sx = this.checkCanvas.width / this.canvas.width;
      c.save();
      c.lineCap = "round";
      c.lineJoin = "round";
      c.lineWidth = this.BRUSH * (this.dpr || 1) * 1.6 * sx;
      c.strokeStyle = "rgba(0,0,0,1)";
      c.beginPath();
      c.moveTo(x0 * sx, y0 * sx);
      c.lineTo(x1 * sx, y1 * sx);
      c.stroke();
      c.restore();
    },

    /** Sample the mirror canvas to work out how much foil is gone. */
    measure: function () {
      if (this.revealed) return;
      const w = this.checkCanvas.width;
      const h = this.checkCanvas.height;
      if (!w || !h) return;

      let data;
      try {
        data = this.checkCtx.getImageData(0, 0, w, h).data;
      } catch (err) {
        return;
      }

      let scratched = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 12) scratched += 1;
      }

      this.coverage = scratched / (w * h);
      const pct = Math.round(this.coverage * 100);
      const status = $("#scratchProgress");
      if (status) {
        status.textContent = pct > 2 ? pct + "% of the invitation revealed" : "";
      }

      if (this.coverage >= this.THRESHOLD) {
        this.reveal(false);
      }
    },

    /* ---- reveal ------------------------------------------------------- */
    reveal: function (manual) {
      if (this.revealed) return;
      this.revealed = true;
      this.drawing = false;
      this.input = null;

      if (this.surface) this.surface.classList.add("is-revealed");
      if (this.canvas) {
        this.canvas.classList.add("is-done");
        this.canvas.setAttribute("aria-hidden", "true");
      }
      if (this.panel) {
        this.panel.setAttribute("tabindex", "-1");
      }

      const status = $("#scratchProgress");
      if (status) {
        status.textContent = manual
          ? "The invitation is now revealed."
          : "The invitation has been revealed.";
      }

      const hint = $("#scratchHint");
      if (hint) hint.setAttribute("aria-hidden", "true");

      // Move focus to the message so screen-reader users continue from there.
      if (this.panel && manual) {
        window.setTimeout(function () {
          scratchCard.panel.focus({ preventScroll: true });
        }, 420);
      }
    }
  };

  /* ========================================================================
     07. COUNTDOWN
     ======================================================================== */
  const countdown = {
    timer: null,
    target: null,

    init: function () {
      const grid = $("#countdownGrid");
      const note = $("#countdownNote");
      const done = $("#countdownDone");
      const actions = $("#countdownActions");
      if (!grid) return;

      this.target = EVENT.known ? EVENT.ts : null;

      if (!this.target) {
        grid.hidden = true;
        if (done) done.hidden = true;
        if (actions) actions.hidden = true;
        if (note) {
          note.textContent =
            "Our wedding date is being finalised. Please check back shortly for the muhurtham and venue details.";
        }
        return;
      }

      grid.hidden = false;
      if (note) note.hidden = true;
      if (actions) actions.hidden = false;

      this.render();

      // Guard against a date that has already passed.
      if (this.target - Date.now() <= 0) {
        this.finish();
        return;
      }

      this.timer = window.setInterval(function () {
        countdown.render();
        if (countdown.target - Date.now() <= 0) countdown.finish();
      }, 1000);
    },

    render: function () {
      const diff = this.target - Date.now();
      if (diff <= 0) {
        this.setNumbers(0, 0, 0, 0);
        return;
      }

      const total = Math.floor(diff / 1000);
      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;

      const prev = {
        d: $("#cdDays").textContent,
        h: $("#cdHours").textContent,
        m: $("#cdMinutes").textContent,
        s: $("#cdSeconds").textContent
      };

      this.setNumbers(days, hours, minutes, seconds);

      const now = { d: String(days), h: pad(hours), m: pad(minutes), s: pad(seconds) };
      this.pulse($("#cdDays"), now.d, prev.d);
      this.pulse($("#cdHours"), now.h, prev.h);
      this.pulse($("#cdMinutes"), now.m, prev.m);
      this.pulse($("#cdSeconds"), now.s, prev.s);
    },

    pulse: function (el, next, prev) {
      if (!el || next === prev) return;
      el.classList.add("is-ticking");
      window.setTimeout(function () {
        el.classList.remove("is-ticking");
      }, 220);
    },

    setNumbers: function (d, h, m, s) {
      const set = function (id, value) {
        const el = $(id);
        if (el) el.textContent = value;
      };
      set("#cdDays", String(d));
      set("#cdHours", pad(h));
      set("#cdMinutes", pad(m));
      set("#cdSeconds", pad(s));
    },

    finish: function () {
      window.clearInterval(this.timer);
      this.timer = null;
      this.setNumbers(0, 0, 0, 0);

      const grid = $("#countdownGrid");
      const done = $("#countdownDone");
      const note = $("#countdownNote");
      if (grid) grid.hidden = true;
      if (note) note.hidden = true;
      if (done) done.hidden = false;
    }
  };

  /* ========================================================================
     08. RITUAL TIMELINE
     ======================================================================== */
  const RITUAL_ICONS = {
    lamp: "#i-lamp",
    instrument: "#i-instrument",
    swing: "#i-swing",
    garland: "#i-garland",
    thaali: "#i-thaali",
    fire: "#i-fire",
    feast: "#i-feast"
  };

  function renderTimeline() {
    const wrap = $("#timeline");
    if (!wrap) return;

    const rituals = read(CONFIG, "rituals", []) || [];
    if (!rituals.length) {
      wrap.hidden = true;
      return;
    }

    wrap.innerHTML = rituals
      .map(function (r, i) {
        const icon = RITUAL_ICONS[r.icon] || "#i-lamp";
        const image = r.image
          ? '<figure class="timeline__figure"><img src="' + esc(r.image) + '" alt="' + esc(r.alt || r.name) +
            '" loading="lazy" decoding="async" width="800" height="600"></figure>'
          : "";
        const time = r.time
          ? '<span class="timeline__time">' + esc(r.time) + "</span>"
          : "";
        return (
          '<article class="timeline__item reveal reveal--delay-' + (i % 4) + '">' +
          '<span class="timeline__marker" aria-hidden="true"><svg width="20" height="20"><use href="' + icon + '"></use></svg></span>' +
          '<div class="timeline__body">' +
          '<div class="timeline__text">' + time +
          '<h3 class="timeline__name">' + esc(r.name) + "</h3>" +
          '<p class="timeline__desc">' + esc(r.description || "") + "</p>" +
          "</div>" + image +
          "</div></article>"
        );
      })
      .join("");
  }

  /* ========================================================================
     09. GALLERY + LIGHTBOX
     ======================================================================== */
  const gallery = {
    items: [],
    index: 0,
    lastFocus: null,

    init: function () {
      const grid = $("#galleryGrid");
      if (!grid) return;

      this.items = read(CONFIG, "gallery", []) || [];
      if (!this.items.length) {
        const section = $("#gallery");
        if (section) section.hidden = true;
        return;
      }

      grid.innerHTML = this.items
        .map(function (g, i) {
          return (
            '<button type="button" class="gallery__item" data-index="' + i + '" aria-label="View photo: ' +
            esc(g.caption || g.alt || "Wedding photo") + '">' +
            '<img src="' + esc(g.src) + '" alt="' + esc(g.alt || "Wedding photograph") +
            '" loading="lazy" decoding="async" width="1200" height="1500">' +
            '<span class="gallery__overlay"><span class="gallery__caption">' + esc(g.caption || "") + "</span></span>" +
            "</button>"
          );
        })
        .join("");

      on(grid, "click", function (e) {
        const btn = e.target.closest(".gallery__item");
        if (!btn) return;
        gallery.open(Number(btn.getAttribute("data-index")));
      });

      this.bindLightbox();
    },

    bindLightbox: function () {
      const box = $("#lightbox");
      if (!box) return;

      on($("#lightboxClose"), "click", function () {
        gallery.close();
      });
      on($("#lightboxPrev"), "click", function () {
        gallery.step(-1);
      });
      on($("#lightboxNext"), "click", function () {
        gallery.step(1);
      });

      on(box, "click", function (e) {
        if (e.target === box || e.target.classList.contains("lightbox__figure")) {
          gallery.close();
        }
      });

      on(document, "keydown", function (e) {
        if (!box.classList.contains("is-open")) return;
        if (e.key === "Escape") gallery.close();
        else if (e.key === "ArrowLeft") gallery.step(-1);
        else if (e.key === "ArrowRight") gallery.step(1);
        else if (e.key === "Tab") gallery.trapFocus(e);
      });
    },

    open: function (index) {
      const box = $("#lightbox");
      const img = $("#lightboxImg");
      const cap = $("#lightboxCaption");
      if (!box || !img) return;

      this.index = (index + this.items.length) % this.items.length;
      const item = this.items[this.index];

      img.src = item.src;
      img.alt = item.alt || "Wedding photograph";
      if (cap) cap.textContent = item.caption || item.alt || "";

      box.hidden = false;
      // Force a reflow so the opacity transition runs.
      void box.offsetWidth;
      box.classList.add("is-open");

      this.lastFocus = document.activeElement;
      const close = $("#lightboxClose");
      if (close) close.focus({ preventScroll: true });

      document.body.classList.add("is-locked");
    },

    step: function (delta) {
      if (!this.items.length) return;
      this.open(this.index + delta);
    },

    close: function () {
      const box = $("#lightbox");
      if (!box || !box.classList.contains("is-open")) return;
      box.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      window.setTimeout(function () {
        box.hidden = true;
      }, 320);
      if (this.lastFocus && typeof this.lastFocus.focus === "function") {
        this.lastFocus.focus({ preventScroll: true });
      }
    },

    trapFocus: function (e) {
      const box = $("#lightbox");
      const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', box);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  /* ========================================================================
     10. VENUE & DIRECTIONS
     ======================================================================== */
  function initVenue() {
    const name = read(CONFIG, "event.venueName", "");
    const address = read(CONFIG, "event.venueAddress", "");
    const explicitMap = read(CONFIG, "event.mapUrl", "");

    const nameEl = $("#venueName");
    const addrEl = $("#venueAddress");
    const mapBtn = $("#venueMapBtn");
    const dirBtn = $("#venueDirectionsBtn");
    const noteEl = $("#venueNote");

    if (nameEl) {
      nameEl.textContent = name || "Venue to be announced";
      if (!name) nameEl.classList.add("info-card__value--pending");
    }

    if (addrEl) {
      addrEl.textContent = address
        ? address
        : "The wedding venue is being finalised. Kindly check back for the confirmed address and directions.";
    }

    const note = read(CONFIG, "venue.note", "");
    if (noteEl && note) {
      noteEl.textContent = note;
      noteEl.hidden = false;
    }

    // The venue image can be replaced from the configuration.
    const img = $("#venueImage");
    const imgSrc = read(CONFIG, "venue.image", "");
    if (img && imgSrc) img.src = imgSrc;
    const imgAlt = read(CONFIG, "venue.imageAlt", "");
    if (img && imgAlt) img.alt = imgAlt;

    if (!name && !address) {
      // Nothing confirmed — do not produce a misleading map link.
      if (mapBtn) mapBtn.hidden = true;
      if (dirBtn) dirBtn.hidden = true;
      return;
    }

    const query = [name, address].filter(Boolean).join(", ");
    const mapUrl = explicitMap || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
    const dirUrl =
      explicitMap ||
      "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(query);

    if (mapBtn) {
      mapBtn.href = mapUrl;
      mapBtn.hidden = false;
    }
    if (dirBtn) {
      dirBtn.href = dirUrl;
      dirBtn.hidden = false;
    }
  }

  /* ========================================================================
     11. DRESS CODE / TRAVEL / ACCOMMODATION / GIFTS
     ======================================================================== */
  function initDressCode() {
    const women = $("#dressWomen");
    const men = $("#dressMen");
    if (women) women.textContent = read(CONFIG, "dressCode.women", "");
    if (men) men.textContent = read(CONFIG, "dressCode.men", "");

    const wImg = $("#dressWomenImg");
    const mImg = $("#dressMenImg");
    const wSrc = read(CONFIG, "dressCode.womenImage", "");
    const mSrc = read(CONFIG, "dressCode.menImage", "");
    if (wImg && wSrc) wImg.src = wSrc;
    if (mImg && mSrc) mImg.src = mSrc;
    const wAlt = read(CONFIG, "dressCode.womenImageAlt", "");
    const mAlt = read(CONFIG, "dressCode.menImageAlt", "");
    if (wImg && wAlt) wImg.alt = wAlt;
    if (mImg && mAlt) mImg.alt = mAlt;

    const note = read(CONFIG, "dressCode.note", "");
    const noteEl = $("#dressNote");
    const noteWrap = $("#dressNoteWrap");
    if (note && noteEl && noteWrap) {
      noteEl.textContent = note;
      noteWrap.hidden = false;
    }
  }

  function fillDetailList(listEl, rows) {
    if (!listEl) return;
    const usable = (rows || []).filter(function (r) {
      return r && r.label && r.value;
    });
    if (!usable.length) {
      listEl.innerHTML = "";
      return;
    }
    listEl.innerHTML = usable
      .map(function (r) {
        return (
          '<div class="travel__row"><dt>' + esc(r.label) + "</dt><dd>" + esc(r.value) + "</dd></div>"
        );
      })
      .join("");
  }

  function initTravel() {
    const section = $("#travel");
    if (!section) return;

    const tEnabled = !!read(CONFIG, "transportation.enabled", false);
    const aEnabled = !!read(CONFIG, "accommodation.enabled", false);

    if (!tEnabled && !aEnabled) {
      section.hidden = true;
      return;
    }

    section.hidden = false;

    const tCard = $("#transportCard");
    const tDesc = $("#transportDesc");
    if (tCard) {
      tCard.hidden = !tEnabled;
      const desc = read(CONFIG, "transportation.description", "");
      if (tDesc) tDesc.textContent = desc;
      fillDetailList($("#transportList"), read(CONFIG, "transportation.details", []));
    }

    const aCard = $("#accommodationCard");
    const aDesc = $("#accommodationDesc");
    if (aCard) {
      aCard.hidden = !aEnabled;
      const desc = read(CONFIG, "accommodation.description", "");
      if (aDesc) aDesc.textContent = desc;
      fillDetailList($("#accommodationList"), read(CONFIG, "accommodation.details", []));
    }
  }

  function initGifts() {
    const section = $("#gifts");
    const msg = $("#giftsMessage");
    if (!section || !msg) return;
    if (!read(CONFIG, "gifts.enabled", true)) {
      section.hidden = true;
      return;
    }
    msg.textContent = read(CONFIG, "gifts.message", "");
  }

  /* ========================================================================
     12. RSVP
     ======================================================================== */
  const rsvp = {
    form: null,
    submitting: false,

    init: function () {
      const section = $("#rsvp");
      this.form = $("#rsvpForm");
      if (!section || !this.form) return;

      if (!read(CONFIG, "rsvp.enabled", true)) {
        section.hidden = true;
        return;
      }

      const endpoint = String(read(CONFIG, "rsvp.submissionEndpoint", "") || "").trim();
      const demoNotice = $("#rsvpDemoNotice");
      const demoText = $("#rsvpDemoText");

      if (!endpoint) {
        // DEMO MODE — clearly signposted so no visitor is misled.
        if (demoNotice && demoText) {
          demoText.textContent = read(CONFIG, "rsvp.demoNotice", "");
          demoNotice.hidden = false;
        }
      }

      // Number-of-guests select is configurable.
      const guestField = $("#fieldGuests");
      if (!read(CONFIG, "rsvp.showGuestCount", true)) {
        if (guestField) guestField.hidden = true;
      } else {
        const max = Number(read(CONFIG, "rsvp.maxGuests", 4)) || 4;
        const select = $("#rsvpGuests");
        if (select) {
          select.innerHTML = "";
          for (let i = 1; i <= max; i += 1) {
            const opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = i === 1 ? "Just me" : i + " guests";
            select.appendChild(opt);
          }
        }
      }

      const msgField = $("#fieldMessage");
      if (!read(CONFIG, "rsvp.showMessage", true) && msgField) {
        msgField.hidden = true;
      }

      on(this.form, "submit", function (e) {
        e.preventDefault();
        rsvp.submit();
      });

      on(this.form, "input", function (e) {
        const field = e.target.closest(".form-field");
        if (field && field.classList.contains("has-error")) {
          field.classList.remove("has-error");
        }
      });

      on(this.form, "change", function (e) {
        const field = e.target.closest(".form-field");
        if (field && field.classList.contains("has-error")) {
          field.classList.remove("has-error");
        }
      });
    },

    validate: function () {
      let ok = true;
      const name = $("#rsvpName");
      const attendance = this.form.querySelector('input[name="attendance"]:checked');

      const nameField = $("#fieldName");
      const attField = $("#fieldAttendance");

      if (!name || name.value.trim().length < 2) {
        if (nameField) nameField.classList.add("has-error");
        if (name) name.setAttribute("aria-invalid", "true");
        ok = false;
      } else if (name) {
        name.removeAttribute("aria-invalid");
      }

      if (!attendance) {
        if (attField) attField.classList.add("has-error");
        ok = false;
      } else if (attField) {
        attField.classList.remove("has-error");
      }

      return ok;
    },

    payload: function () {
      const name = $("#rsvpName").value.trim();
      const attendance = this.form.querySelector('input[name="attendance"]:checked').value;
      const guestsEl = $("#rsvpGuests");
      const msgEl = $("#rsvpMessage");
      return {
        name: name,
        attendance: attendance,
        guests: guestsEl && !read(CONFIG, "rsvp.showGuestCount", true) ? 1 : Number((guestsEl && guestsEl.value) || 1),
        message: msgEl && !read(CONFIG, "rsvp.showMessage", true) ? "" : (msgEl ? msgEl.value.trim() : ""),
        couple: {
          groom: read(CONFIG, "couple.groom", ""),
          bride: read(CONFIG, "couple.bride", "")
        },
        eventDate: read(CONFIG, "event.date", ""),
        submittedAt: new Date().toISOString()
      };
    },

    setStatus: function (kind, message) {
      const status = $("#rsvpStatus");
      if (!status) return;
      status.className = "rsvp__status";
      status.classList.add("is-visible");
      status.classList.add("rsvp__status--" + kind);
      status.textContent = message;
    },

    submit: function () {
      if (this.submitting) return; // prevent duplicate submissions

      const submitBtn = $("#rsvpSubmit");
      const endpoint = String(read(CONFIG, "rsvp.submissionEndpoint", "") || "").trim();

      if (!this.validate()) {
        this.setStatus("error", "Please correct the highlighted fields and try again.");
        const firstError = this.form.querySelector(".has-error .form-input, .has-error .form-select");
        if (firstError) firstError.focus();
        return;
      }

      const data = this.payload();

      if (!endpoint) {
        // DEMO MODE — validate, but never claim the response was received.
        this.setStatus("demo", read(CONFIG, "rsvp.demoNotice", ""));
        if (submitBtn) {
          submitBtn.disabled = true;
          window.setTimeout(function () {
            submitBtn.disabled = false;
          }, 2500);
        }
        console.log("[wedding] RSVP (demo mode, not transmitted):", data);
        return;
      }

      this.submitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      const self = this;
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res;
        })
        .then(function () {
          self.submitting = false;
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "RSVP Sent";
          }
          self.setStatus("success", read(CONFIG, "rsvp.successMessage", "Thank you! Your response has been received."));
          self.form.reset();
        })
        .catch(function (err) {
          console.error("[wedding] RSVP submission failed:", err);
          self.submitting = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send RSVP";
          }
          self.setStatus(
            "error",
            "We could not send your response right now. Please try again, or contact the family directly."
          );
        });
    }
  };

  /* ========================================================================
     13. CLOSING, FOOTER & STRUCTURED DATA
     ======================================================================== */
  function initClosingAndFooter() {
    const yearEl = $("#footerYear");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    const meta = $("#footerMeta");
    if (meta) {
      const bits = [];
      if (EVENT.known) {
        bits.push(formatDate(EVENT.ts, EVENT.tz));
        bits.push(formatTime(EVENT.ts, EVENT.tz));
      }
      const venue = read(CONFIG, "event.venueName", "");
      if (venue) bits.push(venue);
      meta.textContent = bits.length ? bits.join("  ·  ") : "Wedding date to be announced";
    }
  }

  /** Update the Schema.org Event block with the confirmed details. */
  function updateStructuredData() {
    const nodes = $$('script[type="application/ld+json"]');
    if (!nodes.length) return;

    nodes.forEach(function (node) {
      let data;
      try {
        data = JSON.parse(node.textContent);
      } catch (err) {
        return;
      }
      if (!data || data["@type"] !== "Event") return;

      if (EVENT.known) {
        data.startDate = new Date(EVENT.ts).toISOString();
        data.endDate = new Date(EVENT.ts + 6 * 3600 * 1000).toISOString();
        data.eventStatus = "https://schema.org/EventScheduled";
      } else {
        delete data.startDate;
        delete data.endDate;
        data.eventStatus = "https://schema.org/EventScheduled";
      }

      const venueName = read(CONFIG, "event.venueName", "");
      const venueAddress = read(CONFIG, "event.venueAddress", "");
      if (venueName || venueAddress) {
        data.location = {
          "@type": "Place",
          name: venueName || "Wedding venue",
          address: {
            "@type": "PostalAddress",
            streetAddress: venueAddress
          }
        };
      } else {
        delete data.location;
      }

      node.textContent = JSON.stringify(data, null, 2);
    });
  }

  /* ========================================================================
     14. SCROLL REVEAL, TOPBAR & PETALS
     ======================================================================== */
  function initScrollReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  }

  function initTopbar() {
    const bar = $("#topbar");
    if (!bar) return;
    const update = function () {
      bar.classList.toggle("is-solid", window.scrollY > 40);
    };
    update();
    on(window, "scroll", update, { passive: true });
  }

  function initPetals() {
    const host = $("#petals");
    if (!host || prefersReducedMotion()) return;

    const count = window.innerWidth < 640 ? 10 : 18;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
      const p = document.createElement("span");
      p.className = "petal";
      p.style.left = (Math.random() * 100).toFixed(2) + "%";
      p.style.animationDuration = (11 + Math.random() * 13).toFixed(1) + "s";
      p.style.animationDelay = (-Math.random() * 18).toFixed(1) + "s";
      p.style.transform = "scale(" + (0.55 + Math.random() * 0.9).toFixed(2) + ")";
      p.style.opacity = String(0.35 + Math.random() * 0.45);
      frag.appendChild(p);
    }
    host.appendChild(frag);
  }

  /* ========================================================================
     15. BOOT
     ======================================================================== */
  function initCalendar() {
    const addBtn = $("#addToCalendar");
    const gcal = $("#googleCalendarLink");
    if (!EVENT.known) {
      if (addBtn) addBtn.hidden = true;
      if (gcal) gcal.hidden = true;
      return;
    }

    const local = EVENT.local || {
      y: new Date(EVENT.ts).getFullYear(),
      m: new Date(EVENT.ts).getMonth() + 1,
      d: new Date(EVENT.ts).getDate(),
      h: new Date(EVENT.ts).getHours(),
      mi: new Date(EVENT.ts).getMinutes()
    };

    const stampLocal =
      local.y + pad(local.m) + pad(local.d) + "T" + pad(local.h) + pad(local.mi) + "00";

    // Six hours later, expressed as the same wall-clock time in the event timezone.
    const endWall = new Date(
      Date.UTC(local.y, local.m - 1, local.d, local.h, local.mi) + 6 * 3600 * 1000
    );
    const endStamp =
      endWall.getUTCFullYear() +
      pad(endWall.getUTCMonth() + 1) +
      pad(endWall.getUTCDate()) +
      "T" +
      pad(endWall.getUTCHours()) +
      pad(endWall.getUTCMinutes()) +
      "00";

    const title = "Raju & Aishu — Wedding Ceremony";
    const venue = read(CONFIG, "event.venueName", "");
    const address = read(CONFIG, "event.venueAddress", "");
    const description = read(CONFIG, "invitation.message", "");

    if (gcal) {
      gcal.href =
        "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent(title) +
        "&dates=" + stampLocal.replace(/[-:]/g, "") + "/" + endStamp.replace(/[-:]/g, "") +
        "&location=" + encodeURIComponent([venue, address].filter(Boolean).join(", ")) +
        "&details=" + encodeURIComponent(description);
      gcal.hidden = false;
    }

    if (addBtn) {
      addBtn.hidden = false;
      on(addBtn, "click", function () {
        const ics = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Raju and Aishu Wedding//Invitation//EN",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          "BEGIN:VEVENT",
          "UID:raju-aishu-wedding-" + EVENT.ts + "@wedding-invitation",
          "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
          "DTSTART;TZID=" + EVENT.tz + ":" + stampLocal,
          "DTEND;TZID=" + EVENT.tz + ":" + endStamp,
          "SUMMARY:" + title,
          "DESCRIPTION:" + description.replace(/[\n,;]/g, " "),
          "LOCATION:" + [venue, address].filter(Boolean).join(", "),
          "BEGIN:VALARM",
          "TRIGGER:-P1D",
          "ACTION:DISPLAY",
          "DESCRIPTION:" + title,
          "END:VALARM",
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "raju-aishu-wedding.ics";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 1500);
        showToast("Calendar file downloaded.");
      });
    }
  }

  function initDetails() {
    const msg = $("#invitationMessage");
    if (msg) msg.textContent = read(view, "invitation.message", "");

    const infoDate = $("#infoDate");
    const infoDay = $("#infoDay");
    const infoTime = $("#infoTime");
    const infoTz = $("#infoTimezone");
    const infoVenue = $("#infoVenue");
    const infoAddress = $("#infoAddress");

    if (EVENT.known) {
      if (infoDate) infoDate.textContent = formatDate(EVENT.ts, EVENT.tz);
      if (infoDay) infoDay.textContent = formatDay(EVENT.ts, EVENT.tz);
      if (infoTime) infoTime.textContent = read(CONFIG, "event.timeLabel", "") || formatTime(EVENT.ts, EVENT.tz);
      if (infoTz) infoTz.textContent = formatTimezone(EVENT.tz);
    } else {
      [infoDate, infoTime, infoVenue].forEach(function (el) {
        if (el) el.classList.add("info-card__value--pending");
      });
    }

    const venueName = read(CONFIG, "event.venueName", "");
    const venueAddress = read(CONFIG, "event.venueAddress", "");
    if (infoVenue) infoVenue.textContent = venueName || "To be announced";
    if (infoAddress) infoAddress.textContent = venueAddress || "";

    // Family names are only rendered when they have actually been supplied.
    const brideFamily = read(CONFIG, "invitation.brideFamily", "");
    const groomFamily = read(CONFIG, "invitation.groomFamily", "");
    const families = $("#detailsFamilies");
    if (families) {
      if (brideFamily || groomFamily) {
        families.hidden = false;
        const bf = $("#brideFamilyName");
        const gf = $("#groomFamilyName");
        if (bf) bf.textContent = brideFamily;
        if (gf) gf.textContent = groomFamily;
      } else {
        families.hidden = true;
      }
    }
  }

  function boot() {
    applyBindings();
    initDetails();
    initVenue();
    initDressCode();
    initTravel();
    initGifts();
    renderTimeline();
    gallery.init();
    countdown.init();
    initCalendar();
    rsvp.init();
    musicController.init();
    scratchCard.init();
    initScrollReveal();
    initTopbar();
    initPetals();
    initClosingAndFooter();
    curtain.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
