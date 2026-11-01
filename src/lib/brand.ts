const FALLBACK_HASH = "WalhadCareLink";

/** Serialize an image to a CSS-safe inline data URI. */
function inline(name: string): string {
  return `url("${name}")`;
}

/**
 * Brand tokens.
 * Colors sampled directly from the supplied Walhad CareLink logo so the
 * interface stays faithful to the uploaded brand identity.
 */
export const brand = {
  name: "Walhad",
  nameAccent: "CareLink",
  suite: "Walhad CareLink",
  tagline: "Connected Families. Safer Together.",
  colors: {
    navy: "#002F65",
    navyInk: "#0B2440",
    blue: "#0066C3",
    blueDeep: "#005BB1",
    teal: "#08AE86",
    tealDeep: "#009B7C",
    mint: "#E6F7F2",
    sky: "#EAF3FD",
    grey: "#F4F7FA",
    border: "#E3EAF2",
    ink: "#0F2A45",
    muted: "#5C7590",
  },
  logo: {
    full: "/brand/logo.png",
    emblem: "/brand/emblem.png",
    emblem512: "/brand/emblem-512.png",
    icon192: "/brand/icon-192.png",
    icon512: "/brand/icon-512.png",
    apple: "/brand/apple-touch-icon.png",
    favicon32: "/brand/favicon-32.png",
    favicon64: "/brand/favicon-64.png",
    hash: FALLBACK_HASH,
    inline,
  },
} as const;

export type Brand = typeof brand;
