/**
 * ============================================================================
 *  RAJU & AISHU — WEDDING INVITATION — CENTRAL CONFIGURATION
 * ============================================================================
 *
 *  Edit ONLY this file to personalise the invitation.
 *  Every piece of visible content on the page is rendered from this object.
 *  The script never writes back to this file — it is read-only at runtime.
 *
 *  HOW TO USE
 *  ----------
 *  1. Fill in `event.date`, `event.time` and `event.venueName` /
 *     `event.venueAddress` when they are confirmed.
 *  2. Adjust `rituals` (order, names, times, images) to match your programme.
 *  3. Adjust `ritualGallery` to swap in your own photographs.
 *  4. Set `rsvp.submissionEndpoint` to connect the RSVP form to a real
 *     backend (Formspree, Google Apps Script, Web3Forms, your own API...).
 *
 *  Any field left empty is handled gracefully: optional sections hide
 *  themselves and placeholders are shown instead of broken content.
 *
 * ============================================================================
 */

const weddingConfig = {
  /* --------------------------------------------------------------------------
   *  THE COUPLE
   * ------------------------------------------------------------------------ */
  couple: {
    groom: "Raju",
    bride: "Aishu",
    groomShort: "Raju",
    brideShort: "Aishu",

    /** Shown above the names in the hero. */
    familyInvitation: "Together with our families",

    /** The single line under the couple's names in the hero. */
    heroTagline: "Two hearts, one beautiful journey, blessed by tradition and united in love.",

    /** Small line above the couple's names on the scratch card. */
    scratchEyebrow: "The Wedding Invitation",

    /** Closing line used in the final section. */
    closingMessage: "With the blessings of our elders, we begin our forever.",

    /** Closing blessing paragraph. */
    closingBlessing:
      "We look forward to celebrating this auspicious occasion with you."
  },

  /* --------------------------------------------------------------------------
   *  THE EVENT
   * ------------------------------------------------------------------------
   *  date      : "YYYY-MM-DD" (local calendar date at the venue)
   *  time      : "HH:MM" in 24-hour form, local to `timezone`
   *  timezone  : IANA timezone id, e.g. "Asia/Kolkata"
   *  mapUrl    : optional explicit Google Maps link. When empty, one is
   *              generated from `venueAddress` + `venueName`.
   * ------------------------------------------------------------------------ */
  event: {
    date: "2024-09-16",    // e.g. "2027-02-14"
    time: "08:00",         // e.g. "09:30"
    timezone: "Asia/Kolkata",
    venueName: "RKV Mahal", // e.g. "Sri Kothandaramar Kalyana Mandapam"
    venueAddress: "",      // e.g. "12 Gandhi Road, Mylapore, Chennai 600004"
    mapUrl: "",            // optional; generated automatically when empty
    muhurthamNote: "Muhurtham",
    /** Optional display text for the muhurtham card; overrides the time above. */
    timeLabel: "8:00 – 8:30 am",
    dayLabel: ""
  },

  /* --------------------------------------------------------------------------
   *  INVITATION WORDING  (Section 4)
   * ------------------------------------------------------------------------ */
  invitation: {
    eyebrow: "With the Blessings of Our Elders",
    /** `{groom}` and `{bride}` are replaced automatically. */
    message:
      "With the blessings of our elders and the grace of God, we joyfully invite you to celebrate the wedding of {groom} and {bride}. Your gracious presence and blessings will make our special day even more memorable.",
    /** Optional. Left empty so no family names are invented. */
    groomFamily: "",
    brideFamily: ""
  },

  /* --------------------------------------------------------------------------
   *  ENTRANCE CURTAIN  (Section 1)
   * ------------------------------------------------------------------------
   *  The curtain is drawn with CSS (no heavy image required). If
   *  `curtainImage` is set to a real file it is used as the backdrop behind
   *  the drapes — otherwise a CSS temple-light gradient is used.
   * ------------------------------------------------------------------------ */
  entrance: {
    enabled: true,
    curtainImage: "", // e.g. "assets/images/entrance-curtain.jpg"
    prompt: "Tap to Open the Invitation",
    /** Optional line above the prompt. */
    hint: "Sri Vigneshwara Sarvaloka Natha, Namaha",
    /** Duration of the opening animation in milliseconds. */
    openDuration: 1800
  },

  /* --------------------------------------------------------------------------
   *  MUSIC  (Section 10)
   * ------------------------------------------------------------------------ */
  music: {
    enabled: true,
    /** Start playback only after the visitor's first deliberate interaction. */
    autoplayAfterInteraction: true,
    audioFile: "assets/audio/wedding-instrumental.mp3",
    /** Fallback formats — the first one that loads wins. */
    audioFallbacks: ["assets/audio/wedding-instrumental.ogg"],
    volume: 0.45,
    /** Button label text is provided in the markup for accessibility. */
    label: "Wedding Music"
  },

  /* --------------------------------------------------------------------------
   *  THEME  (Section 5 — exact palette required)
   * ------------------------------------------------------------------------ */
  theme: {
    blushPop: "#FFB3E2",
    black: "#000000",
    chocolatePlum: "#543F3F",
    white: "#FFFFFF",
    darkWalnut: "#452100",
    antiqueGold: "#C5A059"
  },

  /* --------------------------------------------------------------------------
   *  RITUALS / PROGRAMME TIMELINE  (Section 6)
   * ------------------------------------------------------------------------
   *  Edit freely. Not every ritual applies to every South Indian Hindu
   *  wedding — remove the entries that are not part of your programme.
   *  `image` may be "" to render the ornament-only variant.
   * ------------------------------------------------------------------------ */
  rituals: [
    {
      id: "arrival",
      time: "08:30",
      name: "Guest Arrival",
      description:
        "Guests are warmly welcomed at the mandapam and presented with jasmine and rose garlands.",
      image: "assets/images/guest-arrival.jpg",
      icon: "lamp"
    },
    {
      id: "nadaswaram",
      time: "09:15",
      name: "Nadaswaram & Thavil",
      description:
        "The traditional Nadaswaram and Thavil ensemble welcomes the bride and groom with a vibrant procession.",
      image: "assets/images/nadaswaram.jpg",
      icon: "instrument"
    },
    {
      id: "oonjal",
      time: "10:00",
      name: "Oonjal Ceremony",
      description:
        "The couple is seated on a flower-decorated swing as family and friends shower them with blessings and flowers.",
      image: "assets/images/oonjal-ceremony.jpg",
      icon: "swing"
    },
    {
      id: "maalai",
      time: "11:00",
      name: "Maalai Maatral",
      description:
        "The bride and groom exchange floral garlands in the timeless rite of Maalai Maatral.",
      image: "assets/images/maalai-maatral.jpg",
      icon: "garland"
    },
    {
      id: "muhurtham",
      time: "12:15",
      name: "Muhurtham & Thaali Kattudhal",
      description:
        "At the auspicious Muhurtham the couple take their sacred vows and the groom ties the Mangalya Dharanam.",
      image: "assets/images/thaali-kattudhal.jpg",
      icon: "thaali"
    },
    {
      id: "homam",
      time: "13:00",
      name: "Homam & Family Blessings",
      description:
        "The sacred fire ritual is performed and the elders of both families bless the couple with their blessings.",
      image: "assets/images/homam.jpg",
      icon: "fire"
    },
    {
      id: "feast",
      time: "14:00",
      name: "Traditional Wedding Feast",
      description:
        "A sumptuous traditional South Indian feast is served to every guest who has graced us with their presence.",
      image: "assets/images/wedding-feast.jpg",
      icon: "feast"
    }
  ],

  /* --------------------------------------------------------------------------
   *  RITUAL GALLERY  (Section 7)
   * ------------------------------------------------------------------------
   *  Each entry becomes a card. Clicking a card opens the lightbox.
   *  `nameTa` is the Tamil name (optional), `image` is a local file,
   *  `alt` describes the photograph, `description` is the card text.
   * ------------------------------------------------------------------------ */
  ritualGallery: [
    { name: "Kalash Puja", nameTa: "கலச பூஜை", image: "assets/images/kuthu-vilakku.jpg", alt: "Brass oil lamp lit for the kalash puja", description: "The ceremony opens with the kalash — a sacred pot of water, mango leaves and coconut — invoked to bless the couple and the day ahead." },
    { name: "Nichayathartham", nameTa: "நிச்சயதார்த்தம்", image: "assets/images/wedding-stage.jpg", alt: "Decorated wedding stage prepared for the betrothal", description: "The formal betrothal that begins our journey, sealed with the exchange of rings before the families." },
    { name: "Mehendi", nameTa: "மேஹந்தி", image: "assets/images/wedding-gallery/gallery-12.jpg", alt: "Indian Tamil wedding ceremony", description: "An evening of henna, painted with blessings for love, prosperity and good luck." },
    { name: "Haldi", nameTa: "ஹல்தி", image: "assets/images/wedding-gallery/gallery-02.jpg", alt: "South Indian wedding celebration", description: "Turmeric is applied to the bride and groom, blessing them with warmth, glow and a long life together." },
    { name: "Sangeet", nameTa: "சங்கீதம்", image: "assets/images/nadaswaram.jpg", alt: "Nadaswaram artist performing for the sangeet", description: "An evening of family music and dance to celebrate the couple before the main day arrives." },
    { name: "Jaimala", nameTa: "தாலி பரிமாற்றம்", image: "assets/images/maalai-maatral.jpg", alt: "Bride and groom exchanging flower garlands", description: "The exchange of garlands — the first time the bride and groom meet face to face, and the beginning of the ceremony." },
    { name: "Kanyadaan & Thaali", nameTa: "கன்னதான் & தாலி", image: "assets/images/thaali-kattudhal.jpg", alt: "Groom tying the thaali around the bride's neck", description: "The bride is given away by her family, and the groom ties the thaali around her neck as a promise of lifelong bond." },
    { name: "Homam & Pooja", nameTa: "ஹோமம் & பூஜை", image: "assets/images/homam.jpg", alt: "Sacred fire lit for the homam", description: "Offerings are made into the sacred fire while the priests chant for the couple's wellbeing." },
    { name: "Saptapadi", nameTa: "சப்தபதி", image: "assets/images/wedding-gallery/gallery-13.jpg", alt: "Couple taking the saptapadi steps around the sacred fire", description: "Seven rounds around the sacred fire, each one a promise — of food, strength, wealth, love, health, progeny and friendship." },
    { name: "Muhurtham", nameTa: "முகூர்த்தம்", image: "assets/images/mandapam.jpg", alt: "Flower-decorated mandapam at the time of the muhurtham", description: "The most auspicious moment of the day, held at the muhurtham chosen for us by the priests." },
    { name: "Vidaai", nameTa: "விடை", image: "assets/images/wedding-gallery/gallery-16.jpg", alt: "Decorated entrance to the wedding pandal", description: "The farewell that closes the day, as the newlyweds leave the family home for their new life together." },
    { name: "Wedding Feast", nameTa: "விருந்து", image: "assets/images/wedding-feast.jpg", alt: "Traditional South Indian wedding feast served on a banana leaf", description: "A traditional South Indian meal served on a banana leaf, with plenty for everyone." }
  ],

  /* --------------------------------------------------------------------------
   *  VENUE  (Section 8)
   * ------------------------------------------------------------------------ */
  venue: {
    image: "assets/images/venue-temple.jpg",
    imageAlt: "Ornate entrance mandapa of a South Indian temple",
    /** Extra note shown under the address, e.g. parking details. */
    note: ""
  },

  /* --------------------------------------------------------------------------
   *  DRESS CODE  (Section 9)
   * ------------------------------------------------------------------------ */
  dressCode: {
    women: "Traditional silk sarees — Kanchipuram, Banarasi or Mysore — with elegant temple jewellery.",
    men: "Traditional veshti and shirt, or a silk veshti with kurta.",
    womenImage: "assets/images/saree.jpg",
    womenImageAlt: "Traditional silk saree in South Indian style",
    menImage: "assets/images/Dhoti.jpg",
    menImageAlt: "Traditional South Indian veshti/dhoti",
    note: ""
  },

  /* --------------------------------------------------------------------------
   *  TRANSPORTATION  (Section 11)
   * ------------------------------------------------------------------------
   *  Set `enabled` to false to hide the travel section entirely.
   *  Leave a detail value empty and that row is skipped automatically.
   * ------------------------------------------------------------------------ */
  transportation: {
    enabled: true,
    description:
      "Pick-up arrangements for guests will be confirmed closer to the wedding. The details below will be updated as soon as the travel plan is finalised.",
    details: [
      { label: "Pick-up point", value: "To be announced" },
      { label: "Pick-up time", value: "To be announced" },
      { label: "Contact", value: "To be announced" }
    ]
  },

  /* --------------------------------------------------------------------------
   *  ACCOMMODATION  (Section 11)
   * ------------------------------------------------------------------------ */
  accommodation: {
    enabled: true,
    description:
      "Rooms have been reserved for family and friends travelling for the wedding. Booking details will be shared here once the block is confirmed.",
    details: [
      { label: "Hotel", value: "To be announced" },
      { label: "Distance from venue", value: "To be announced" },
      { label: "Booking contact", value: "To be announced" }
    ]
  },

  /* --------------------------------------------------------------------------
   *  GIFTS & BLESSINGS  (Section 12)
   * ------------------------------------------------------------------------ */
  gifts: {
    enabled: true,
    message:
      "Your presence, love, and blessings are the greatest gifts we could ask for. We look forward to celebrating this auspicious occasion with you."
  },

  /* --------------------------------------------------------------------------
   *  RSVP  (Section 13)
   * ------------------------------------------------------------------------
   *  Leave `submissionEndpoint` empty for DEMO MODE. In demo mode the form
   *  validates correctly but no data is transmitted anywhere and the page
   *  says so explicitly. Point it at a real endpoint to go live.
   * ------------------------------------------------------------------------ */
  rsvp: {
    enabled: true,
    submissionEndpoint: "",
    /** Optional extra fields, e.g. "Food preference". */
    showGuestCount: true,
    maxGuests: 4,
    showMessage: true,
    /** Shown in demo mode so visitors are not misled. */
    demoNotice:
      "Demo mode — this invitation is not yet connected to a server, so your response has not been sent. Please save your response and share it with the family.",
    successMessage:
      "Thank you! Your response has been received and we are delighted to have you with us."
  },

  /* --------------------------------------------------------------------------
   *  FOOTER  (Section 15)
   * ------------------------------------------------------------------------ */
  footer: {
    note: "With love and gratitude"
  }
};

/* Make the configuration available to the rest of the scripts.
   Guarded so the file can also be imported in strict/module contexts. */
if (typeof window !== "undefined") {
  window.weddingConfig = weddingConfig;
}
