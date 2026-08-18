/**
 * Ambient artwork paths for the landing page.
 *
 * One indirection, on purpose. The page ships with hand-written SVG gradients that are
 * a few hundred bytes each and always look intentional. Swapping in richer generated
 * artwork later is a change to these three strings and nothing else — no component knows
 * or cares which it is getting.
 *
 * That ordering is deliberate: the design must be complete and shippable without any
 * generated asset, so image generation can never become a blocker or a broken dependency.
 *
 * Whatever replaces these must be self-hosted under public/. The CSP is `img-src 'self'`
 * plus the Cloudinary product host, so a remote generation endpoint cannot be hotlinked.
 */
export const HOME_ART = {
  /** Dark pharmacy band behind the hero. Motifs sit left and right of the copy column. */
  hero: "/home/hero-band.svg",
  support: "/home/band-support.svg",
} as const
