# Raju & Aishu — Digital Wedding Invitation

A premium, responsive, **vanilla HTML / CSS / JavaScript** wedding invitation website for a
traditional South Indian Hindu wedding.

No frameworks, no build step, no CSS framework, no bundler. Open `index.html` and it works.

| | |
|---|---|
| **Stack** | HTML5, CSS3, ES5-compatible vanilla JS (IIFE modules) |
| **Dependencies** | None — every asset is local |
| **Target** | Mobile-first (WhatsApp sharing), 320 px → 1920 px |
| **Accessibility** | Keyboard operable, screen-reader labelled, `prefers-reduced-motion` aware |
| **Offline-ish** | Fonts, images and audio are self-hosted; nothing is fetched from a CDN |

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [Project structure](#2-project-structure)
3. [Page sections](#3-page-sections)
4. [Configuration — `assets/js/config.js`](#4-configuration--assetsjsconfigjs)
5. [Before you publish — the placeholder checklist](#5-before-you-publish--the-placeholder-checklist)
6. [Connecting the RSVP form to a backend](#6-connecting-the-rsvp-form-to-a-backend)
7. [SEO](#7-seo)
8. [Accessibility & motion](#8-accessibility--motion)
9. [Asset credits & licences](#9-asset-credits--licences)
10. [Browser support & notes](#10-browser-support--notes)

---

## 1. Quick start

The site is fully static. Any static file server works.

```bash
# Python (already installed on most systems)
python -m http.server 8765 --bind 127.0.0.1

# Node
npx serve .

# PHP
php -S localhost:8000
```

Then open <http://127.0.0.1:8765/index.html>.

> **Why a server and not `file://`?** `config.js` is loaded with a plain `<script>` tag (not a
> module), so the invitation does open correctly from the filesystem. A server is still recommended
> because browsers apply stricter same-origin rules to `fetch()` and the RSVP form in live mode.

### Deploying

Upload the whole folder as-is to any static host — GitHub Pages, Netlify, Vercel, Cloudflare
Pages, S3, or ordinary shared hosting. There is no build step and no server-side component.

---

## 2. Project structure

```
.
├── index.html                  # The whole page: markup, SVG sprite, SEO head, JSON-LD
├── site.webmanifest            # PWA manifest (installable on Android)
├── README.md
└── assets/
    ├── css/
    │   └── style.css           # Design tokens + all 25 stylesheet sections
    ├── js/
    │   ├── config.js           # ← THE ONLY FILE YOU EDIT FOR CONTENT
    │   └── main.js             # Behaviour (modules 00–15)
    ├── images/
    │   ├── *.jpg               # Hero, rituals, venue, dress-code images
    │   └── wedding-gallery/    # Spare photo pool (gallery-01 … gallery-16)
    ├── audio/
    │   ├── wedding-instrumental.mp3
    │   └── wedding-instrumental.ogg
    ├── fonts/                  # Self-hosted woff2 + fonts.json provenance
    └── icons/
        └── favicon.svg
```

### How content flows

```
assets/js/config.js   ──►  window.weddingConfig
                              │
                              ├──►  main.js  ──►  [data-bind="path.to.value"]  text nodes
                              │            ──►  JSON-LD <script>  (startDate, location)
                              │            ──►  countdown, calendar links, ritual gallery, timeline
                              │
                              └──►  never written back — config.js is read-only at runtime
```

Anything with a `data-bind="a.b.c"` attribute in `index.html` is filled from
`config.a.b.c` automatically. To rename a heading, edit `config.js` — not the HTML.

---

## 3. Page sections

| # | Section | Anchor | Notes |
|---|---|---|---|
| 1 | Entrance curtain | `#entrance` | Full-screen CSS/SVG silk drape + gold zari + jasmine garlands + kuthu vilakku. "Tap to Open the Invitation". Removed from the DOM after opening. |
| 2 | Hero | `#hero` | Names, family line, tagline, date & venue chips. |
| 3 | Scratch card | `#invitation` | Canvas gold-foil scratch-to-reveal card. |
| 4 | Invitation details | `#details` | Date / time / venue info cards. |
| 5 | Countdown | `#countdown` | Live countdown + "Add to Calendar" (`.ics`) + Google Calendar link. |
| 6 | Rituals timeline | `#rituals` | Ordered programme with times, icons and photos. |
| 7 | Ritual gallery + lightbox | `#ritualGallery` | 6 ritual cards (Tamil name + description) rendered from `ritualGallery[]`; clicking a card opens the keyboard-navigable lightbox. |
| 8 | Venue & directions | `#venue` | Photo, address, Google Maps + directions links. |
| 9 | Dress code | `#dresscode` | Two cards (women / men) with photographs. |
| 10 | Music | *(top bar)* | Visible toggle in the sticky header. |
| 11 | Travel & stay | `#travel` | Transport + accommodation cards. |
| 12 | Gifts & blessings | `#gifts` | |
| 13 | RSVP | `#rsvp` | Validated form with demo/live modes. |
| 14 | Closing | `#closing` | Closing message and blessings. |
| 15 | Footer | *(page footer)* | Ornament, "With love and gratitude", dynamic year. |

### The two headline interactions

**Entrance curtain (§1)** — built entirely from CSS gradients, transforms and inline SVG
(no photo, so it costs nothing to download). It locks page scroll while shown, accepts a click
anywhere on the stage or a keyboard `Enter`/`Space`, and is removed after the 1 800 ms open
animation. Under `prefers-reduced-motion: reduce` it opens in ~260 ms with no transforms.

**Scratch card (§3)** — the gold foil is painted procedurally into a `<canvas>` (zari lattice,
diamond motifs, noise texture and "SCRATCH TO REVEAL" lettering), so the bitmap *is* the erasable
layer — no separate image and no sprite sheet. It supports mouse, touch and stylus via Pointer
Events with a dedicated touch fallback, and auto-reveals once 25 % of the foil is cleared
(coverage is sampled from a downscaled mirror canvas, so the check is cheap). A live
percentage is announced through an `aria-live` region.

Two accessibility safeguards are built in:

* A **"Reveal Invitation"** button gives keyboard and screen-reader users a non-gesture route.
* `touch-action: none` on the canvas plus `preventDefault()` on the touch handlers stops the page
  from scrolling while a guest is scratching. `overscroll-behavior: none` on the document stops
  a horizontal swipe on the revealed card from triggering the browser's back-navigation.

---

## 4. Configuration — `assets/js/config.js`

This is the single source of truth. The script **never writes to it**.

### `couple`

| Key | Type | Purpose |
|---|---|---|
| `groom` | string | Groom's name — hero, curtain, footer, JSON-LD |
| `bride` | string | Bride's name — hero, curtain, footer, JSON-LD |
| `groomShort` | string | Short form used in tight spaces |
| `brideShort` | string | Short form used in tight spaces |
| `familyInvitation` | string | Line above the names in the hero (`"Together with our families"`) |
| `heroTagline` | string | The single line under the names |
| `scratchEyebrow` | string | Small eyebrow above the names on the scratch card |
| `closingMessage` | string | Closing line in §14 |
| `closingBlessing` | string | Closing blessing paragraph in §14 |

### `event`

| Key | Type | Purpose |
|---|---|---|
| `date` | `"YYYY-MM-DD"` or `""` | Wedding date. **Empty → the countdown hides itself** and "To be announced" is shown. |
| `time` | `"HH:MM"` (24 h) or `""` | Muhurtham start time, local to `timezone`. Also the start of the `.ics` / Google Calendar entry. |
| `timeLabel` | string or `""` | Optional text for the muhurtham card, e.g. `"8:00 – 8:30 am"`. Empty → the formatted `time` is shown. |
| `timezone` | IANA id | e.g. `"Asia/Kolkata"`. Used for DST-safe date maths. |
| `venueName` | string or `""` | Venue name. Empty → map/directions buttons stay hidden. |
| `venueAddress` | string or `""` | Street address, used to build the Maps links |
| `mapUrl` | string or `""` | Optional explicit Maps link. When empty, one is generated from the address. |
| `muhurthamNote` | string | Small label next to the time (default `"Muhurtham"`) |
| `dayLabel` | string or `""` | Optional extra line under the date |

### `invitation`

| Key | Purpose |
|---|---|
| `eyebrow` | Section eyebrow above the invitation message |
| `message` | The invitation paragraph. `{groom}` and `{bride}` are substituted automatically. |
| `groomFamily` / `brideFamily` | Optional family names. Empty by default — **no family names are invented.** |

### `entrance`

| Key | Default | Purpose |
|---|---|---|
| `enabled` | `true` | `false` skips the curtain entirely |
| `curtainImage` | `""` | Optional backdrop image behind the drapes. Empty → the CSS temple-light gradient is used. |
| `prompt` | `"Tap to Open the Invitation"` | Button text |
| `hint` | `"Sri Vigneshwara Sarvaloka Natha, Namaha"` | Optional line above the prompt |
| `openDuration` | `1800` | Opening animation length in ms |

### `music`

| Key | Default | Purpose |
|---|---|---|
| `enabled` | `true` | `false` hides the toggle |
| `autoplayAfterInteraction` | `true` | Start only after the guest's **first deliberate interaction** (never before) |
| `audioFile` | `assets/audio/wedding-instrumental.mp3` | Primary source |
| `audioFallbacks` | `["assets/audio/wedding-instrumental.ogg"]` | Tried in order until one loads |
| `volume` | `0.45` | Initial volume (faded in) |

### `theme`

The required palette. These are also mirrored as CSS custom properties in `style.css`:

| Key | Value |
|---|---|
| `blushPop` | `#FFB3E2` |
| `black` | `#000000` |
| `chocolatePlum` | `#543F3F` |
| `white` | `#FFFFFF` |
| `darkWalnut` | `#452100` |
| `antiqueGold` | `#C5A059` (restrained accent) |

### `rituals[]`

One object per entry in the programme timeline:

```js
{
  id: "maalai",                                  // stable key
  time: "11:00",                                 // display time
  name: "Maalai Maatral",
  description: "…",
  image: "assets/images/maalai-maatral.jpg",     // "" renders the ornament-only variant
  icon: "garland"                                // lamp | instrument | swing | garland
                                                //   | thaali | fire | feast
}
```

Remove the entries that are not part of your programme — the timeline re-renders from the array.

### `ritualGallery[]`

```js
{ name: "Kalash Puja",                    // English name (required)
  nameTa: "கலச பூஜை",               // Tamil name (optional)
  image: "assets/images/kuthu-vilakku.jpg", // local file
  alt: "Brass oil lamp lit for the kalash puja", // describes the photograph
  description: "…" }                     // the card text
```

Each entry becomes a card in §7. Clicking a card opens the lightbox with that photograph and a
caption of `name · nameTa`. Swap in your own photographs by dropping files into
`assets/images/` and editing this array. Keep the `alt` text meaningful — it is not decorative.
An empty array hides the whole section.

### `venue`, `dressCode`

| Key | Purpose |
|---|---|
| `venue.image` / `venue.imageAlt` | Venue photograph and its alt text |
| `venue.note` | Optional note under the address (parking, parking rules …). Hidden when empty. |
| `dressCode.women` / `dressCode.men` | The dress-code guidance text |
| `dressCode.womenImage` / `menImage` (+ `…ImageAlt`) | The two photographs |
| `dressCode.note` | Optional extra note. Hidden when empty. |

### `transportation`, `accommodation`

Both share the same shape:

```js
{
  enabled: true,          // false hides the whole travel section
  description: "…",
  details: [
    { label: "Pick-up point", value: "To be announced" },
    { label: "Pick-up time", value: "To be announced" }
  ]
}
```

A row with an empty `value` is skipped automatically.

### `gifts`

| Key | Purpose |
|---|---|
| `enabled` | `false` hides the section |
| `message` | The paragraph shown in §12 |

### `rsvp`

| Key | Default | Purpose |
|---|---|---|
| `enabled` | `true` | `false` hides the whole RSVP section |
| `submissionEndpoint` | `""` | **Empty = demo mode.** Set to your endpoint URL to go live. |
| `showGuestCount` | `true` | Show the "number of guests" select |
| `maxGuests` | `4` | Highest option in that select |
| `showMessage` | `true` | Show the free-text "message" field |
| `demoNotice` | see file | The banner shown in demo mode |
| `successMessage` | see file | Shown **only** after the server accepts the submission |

### `footer`

| Key | Purpose |
|---|---|
| `note` | The line above the copyright. The year is generated automatically. |

---

## 5. Before you publish — the placeholder checklist

Nothing in this demo invents a fact about the wedding. The following are deliberately blank or
marked as placeholders and **must** be filled in before the invitation is shared:

| # | Placeholder | Where | How to fix |
|---|---|---|---|
| 1 | `event.date` = `"2024-09-16"` | §4, §5, hero chip, JSON-LD | **Demo date — it is in the past.** Replace with the real `"YYYY-MM-DD"`; the countdown, `.ics` file and Google Calendar link all switch on automatically |
| 2 | `event.time` = `"08:00"`, `event.timeLabel` = `"8:00 – 8:30 am"` | §4, §5 | Replace with the real muhurtham start and the range shown on the card |
| 3 | `event.venueName` = `"RKV Mahal"` | §4, §8 | Replace with the confirmed venue name |
| 4 | `event.venueAddress` = `""` | §8 | `event.venueAddress: "…"` — also builds the Maps links |
| 5 | `invitation.groomFamily` / `brideFamily` = `""` | §4 | Fill in, or leave blank |
| 6 | Canonical + OG URL | `index.html` `<head>` | `https://example.com/raju-aishu-wedding` → your real URL (the JSON-LD `url` must match) |
| 7 | `og:image` / `twitter:image` | `index.html` `<head>` | Absolute URL of a 1200×630 image |
| 8 | `theme-color` | `index.html` `<head>` | `#2E2124` — match your brand |
| 9 | `rsvp.submissionEndpoint` = `""` | §13 | See [§6](#6-connecting-the-rsvp-form-to-a-backend). **While empty the form is in demo mode and says so on screen.** |
| 10 | "To be announced" rows | §11 | Replace with the real transport / hotel details |

Until the date is set, the page shows *"Our wedding date is being finalised…"* instead of a
countdown, and the calendar buttons are hidden — no misleading links are rendered.

---

## 6. Connecting the RSVP form to a backend

The form currently runs in **demo mode**: it validates, it shows the honest "your response has not
been sent" banner, and it logs the payload to the console — but **nothing is transmitted**.

To go live, set one value:

```js
rsvp: {
  submissionEndpoint: "https://formspree.io/f/xxxxxxxx",
  // …
}
```

### What gets sent

`POST` with `Content-Type: application/json`:

```json
{
  "name": "Ananya Kumar",
  "attendance": "yes",
  "guests": 2,
  "message": "Many blessings to you both.",
  "couple": { "groom": "Raju", "bride": "Aishu" },
  "eventDate": "2027-02-14",
  "submittedAt": "2027-02-01T10:22:31.000Z"
}
```

`attendance` is `"yes"` or `"no"`.

### Behaviour guarantees

* The **success** message is shown only after the endpoint answers `2xx`. Any error, network
  failure or non-2xx status shows *"We could not send your response right now…"* instead — the
  page never claims a response was received without an accepted submission.
* The submit button is disabled while the request is in flight and after a success, so a guest
  cannot send the same response twice.
* After a failure the button is re-enabled and the guest can try again.
* Demo mode never shows the success message.

### CORS requirement

The endpoint **must** allow a cross-origin `POST` with `Content-Type: application/json`
(it is a "simple request" with a preflight because of the JSON content type):

```
Access-Control-Allow-Origin: https://your-site.example
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: content-type, accept
```

### Ready-made backends

| Service | What to do |
|---|---|
| **Formspree** | Create a form, copy the endpoint (`https://formspree.io/f/xxxx`), paste it into `submissionEndpoint`. Works with the JSON payload above out of the box. |
| **Web3Forms** | Create an access key, POST to `https://api.web3forms.com/submit` with the key in the payload — or point `submissionEndpoint` at a small proxy you control. |
| **Google Apps Script** | Deploy a web app with `doPost(e)`; read `e.postData.contents` as JSON. Note that Apps Script redirects cross-origin, so read the response with a proxy if you also need the response body. |
| **Your own API** | Accept the JSON body above and return `200`/`204` with permissive CORS headers. |

To swap in a different payload shape, edit `rsvp.payload()` and `rsvp.submit()` in
`assets/js/main.js` — they are self-contained functions.

---

## 7. SEO

Everything below is already in `index.html` and valid out of the box:

* `<title>`, `<meta name="description">`, `<meta name="robots">`
* `<link rel="canonical">`
* Open Graph: `og:type`, `og:site_name`, `og:title`, `og:description`, `og:image`, `og:image:alt`, `og:locale`, `og:url`
* Twitter/X card: `summary_large_image` + title / description / image / image:alt
* `<meta name="theme-color">`, `charset`, `viewport` (with `viewport-fit=cover` for notched phones)
* Favicon (`assets/icons/favicon.svg`) + `site.webmanifest`
* **Schema.org `Event` JSON-LD** — `name`, `description`, `eventStatus`,
  `eventAttendanceMode`, `organizer`, `attendee`, `about`, `image`, `url`, and (once configured)
  `startDate` / `endDate` / `location`.

The JSON-LD block is patched at runtime from `config.js`, so filling in `event.date` and
`event.venueName` automatically updates the structured data. **Update the `url` and the
canonical URL together** when you deploy.

---

## 8. Accessibility & motion

* Every image has descriptive `alt` text; decorative art is `aria-hidden`.
* All form fields have real `<label for="…">` elements; errors are flagged with
  `aria-invalid` and a `.has-error` class, and focus moves to the first invalid field.
* The scratch card has a keyboard-operable **"Reveal Invitation"** alternative.
* The ritual gallery lightbox is a `role="dialog" aria-modal="true"` with focus trapping, `Escape`
  to close and focus restored to the card on close.
* The curtain's open button receives focus on load, so a keyboard guest can press `Enter`
  immediately.
* A skip link (`Skip to invitation content`) is the next focusable element once the curtain is
  dismissed.
* `prefers-reduced-motion: reduce` disables the petal animation, shortens the curtain animation
  and reveals all scroll-triggered content immediately.
* No horizontal overflow at any width from 320 px to 1920 px.
* No console errors and no failed network requests on load.

---

## 9. Asset credits & licences

All media is stored locally under `assets/`. Every image and the audio file comes from
**Wikimedia Commons** and is used under a licence that permits redistribution. Attribution is
given below in the form required by each licence.

> Photographs depict South Indian Hindu wedding and temple customs only. They are **stand-ins**:
> replace them with your own photographs of the family before sharing the invitation.

### Photographs (Wikimedia Commons)

| Local file | Original | Author | Licence |
|---|---|---|---|
| `hero-wedding.jpg` | *South Indian Wedding 5.jpg* | Nandhinikandhasamy | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `maalai-maatral.jpg` | *Indian malayali couples exchanging garlands.JPG* | Kannanshanmugam | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `oonjal-ceremony.jpg` | *Sri Devi Ellamman swinging in oonjal.JPG* | Arasakumar Thirunavukkarasu | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `thaali-kattudhal.jpg` | *A day they become a Husband and Wife.jpg* | Jothiy13 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `nadaswaram.jpg` | *A Nadaswaram Artist.JPG* | Thamizhpparathi Maari | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `kuthu-vilakku.jpg` | *Brass Nilavilakku Kerala Oil Lamp.jpg* | Devilal | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `mandapam.jpg` | *South Indian wedding in Golu.jpg* | Ksiva21 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `homam.jpg` | *(A) Hindu wedding, Saptapadi ritual before Agni Yajna.jpg* | Symphoney Symphoney | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `wedding-feast.jpg` | *South Indian wedding Feast.JPG* | Rajeshkumaraswamy | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-stage.jpg` | *Wedding Stage.jpg* | Kasyap | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `dresscode-women.jpg` | *Kanchipuram silk sareer.JPG* | రహ్మానుద్దీన్ (Rahmanuddin) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `dresscode-men.jpg` | *Tamil boy in vetti.jpg* | Foto di Signorina on Flickr | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `venue-temple.jpg` | *Entrance mandala of the Hindu Mahadeva Temple, Ettumanoor Kerala.jpg* | Ms Sarah Welch | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `guest-arrival.jpg` | *Indian malayali couples on wedding pandal(stage).JPG* | Kannanshanmugam | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `wedding-gallery/gallery-01.jpg` | *South Indian wedding 1.jpg* | Nandhinikandhasamy | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-02.jpg` | *South Indian Wedding 6.jpg* | Nandhinikandhasamy | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-03.jpg` | *South Indian Wedding 7.jpg* | Nandhinikandhasamy | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-04.jpg` | *South Indian Wedding 8.jpg* | Nandhinikandhasamy | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-05.jpg` | *Traditional South Indian Wedding Ceremony.jpg* | Bhavya bubbles | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-06.jpg` | *South Indian wedding 2.jpg* | Nandhinikandhasamy | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-07.jpg` | *Indian malayali couples on wedding pandal(stage).JPG* | Kannanshanmugam | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `wedding-gallery/gallery-08.jpg` | *Wedding ceremony in Tamil Nadu 03.jpg* | Kritzolina | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-09.jpg` | *Garland,jasmine,Tamil Nadu354.JPG* | தகவலுழவன் (Thagavizhalan) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `wedding-gallery/gallery-10.jpg` | *Nataraja Temple gopuram artwork in Chidambaram, Tamil Nadu.jpg* | Matthew T Rader | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-11.jpg` | *Rangoli or kolam or muggulu.jpg* | Gayathri8843 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-12.jpg` | *Indian Tamil wedding ceremony.jpg* | Dilan007 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-13.jpg` | *South Indian wedding ceremony.jpg* | Appaiah | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| `wedding-gallery/gallery-14.jpg` | *Telugu marriage.jpg* | — (source photoartinc.com) | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `wedding-gallery/gallery-15.jpg` | *Sri Kailasanathar Temple gopuram in Tharamangalam, Tamil Nadu, India.jpg* | Matthew T Rader | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `wedding-gallery/gallery-16.jpg` | *Wedding Traditional Entrance Decoration.jpg* | Rajeev madhavan | Public domain |

Each original can be found on Wikimedia Commons under the file name shown in the
*Original* column, e.g. <https://commons.wikimedia.org/wiki/File:South_Indian_Wedding_5.jpg>.

**If you share the invitation publicly, keep this attribution.** The `CC BY-SA` photographs require
the author credit and the licence link; `CC BY-SA` also requires that derivative releases use the
same licence. Replacing the photographs with your own removes the requirement for those images
(but keep the credits if you keep any of them).

The files in `assets/images/wedding-gallery/` are a **spare photo pool** — the ritual gallery in §7
currently uses `gallery-13`; point the other entries at any of the remaining files, or replace them
with your own.

### Photographs supplied with the project

| Local file | Used for | Licence |
|---|---|---|
| `saree.jpg` | Dress code — women (§9) | Supplied by the couple — confirm the licence before publishing |
| `Dhoti.jpg` | Dress code — men (§9) | Supplied by the couple — confirm the licence before publishing |

### Audio

| Local file | Original | Author | Licence |
|---|---|---|---|
| `assets/audio/wedding-instrumental.mp3` / `.ogg` | *Carnatic flute.ogg* | Bansuri.arvind | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |

Original: <https://commons.wikimedia.org/wiki/File:Carnatic_flute.ogg>
The `.ogg` original is transcoded to `.mp3` for broad browser support; the `.ogg` is kept as the
fallback source.

### Fonts

Self-hosted `woff2` files in `assets/fonts/` — no Google Fonts CDN request is made at runtime.
Full provenance for every file is in [`assets/fonts/fonts.json`](assets/fonts/fonts.json).

| Family | Designer | Source | Licence |
|---|---|---|---|
| Cormorant Garamond | Christian Thalmann | <https://fonts.google.com/specimen/Cormorant+Garamond> | [SIL Open Font License 1.1](https://openfontlicense.org/) |
| Cinzel | Matthew Carter | <https://fonts.google.com/specimen/Cinzel> | [SIL Open Font License 1.1](https://openfontlicense.org/) |
| Jost | Owen Earl | <https://fonts.google.com/specimen/Jost> | [SIL Open Font License 1.1](https://openfontlicense.org/) |

### Icons & ornaments

`assets/icons/favicon.svg` and every ornament, lamp, garland and motif in the page are original
inline SVG created for this project — no third-party icon set is used.

---

## 10. Browser support & notes

* **Browsers:** current Chrome, Edge, Firefox and Safari (desktop and mobile), plus Chrome on
  Android and Safari on iOS.
* **Canvas scratch card:** needs `canvas` 2D context support (universal). `Pointer Events` are
  used when available, with a dedicated `touchstart`/`touchmove` fallback for older iOS Safari.
* **Date handling** uses `Intl.DateTimeFormat` to derive the UTC offset of `event.timezone`, so
  the countdown is correct across daylight-saving changes.
* **No `localStorage` / cookies** are used — nothing about the guest is stored on their device.
* **Print styles** are included so the invitation can be printed cleanly if desired.
* The scratch-card constants live at the top of the `scratchCard` module in `assets/js/main.js`:
  `THRESHOLD` (0.25), `BRUSH` (42 px) and `CHECK_SCALE` (0.25).

### Customising the palette

Change the tokens at the top of `assets/css/style.css` (and, if you want them to stay in sync,
the `theme` block in `config.js`):

```css
:root {
  --color-blush-pop: #FFB3E2;
  --color-black: #000000;
  --color-chocolate-plum: #543F3F;
  --color-white: #FFFFFF;
  --color-dark-walnut: #452100;
  --color-antique-gold: #C5A059;   /* restrained accent */
}
```

---

*Built with vanilla HTML, CSS and JavaScript. No frameworks, no trackers, no external requests.*
