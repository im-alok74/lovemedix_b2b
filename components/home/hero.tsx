import Image from "next/image"

import { HeaderSearch } from "@/components/header-search"
import { PincodeCheck } from "@/components/home/pincode-check"
import { HOME_ART } from "@/lib/home-art"

/**
 * Homepage hero — a dark pharmacy band with the search field as its centrepiece.
 *
 * The previous version was a two-column split: copy and search on the left, three real
 * pack shots on the right. Those shots were chosen by discount, which meant the first
 * thing anyone saw on a medicine site was a surgical blade, a syringe and a tube of
 * ointment. Sorting by savings is the right rule for a *deals* rail and the wrong one for
 * a shop window, and there is no honest sort that makes a 92-product launch catalogue look
 * like a curated storefront.
 *
 * So the band no longer tries. Search is centred and full width, which is what people came
 * to do, and the pharmacy motifs behind it are drawn rather than merchandised — nothing on
 * screen is claiming to be a recommendation. Product photography still leads every rail
 * below, where it is ranked by something real.
 *
 * Dark on light also gives the page a top edge. The old hero was a pale tint of the body
 * background, so the fold read as one continuous wash.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0F3B36]">
      {/*
        `unoptimized` is required, not a shortcut. Next's image optimiser refuses SVG and answers
        /_next/image with HTTP 400 unless `dangerouslyAllowSVG` is set — which would apply to every
        remote host in next.config.mjs, so it is the wrong trade for one decorative backdrop. Without
        this the band rendered as a broken-image icon. An SVG has nothing to gain from raster
        optimisation anyway; `priority` still preloads it.
      */}
      <Image
        src={HOME_ART.hero}
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />

      <div className="page-container relative py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          {/* The only h1 on the page, and it answers "what is this site". */}
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Medicines from a pharmacy near you
          </h1>

          <p className="mt-3 text-base text-white/80 sm:text-lg">
            Real prices from licensed local pharmacies. Delivered in{" "}
            <span className="font-semibold text-white">2–24 hours</span>.
          </p>

          {/* `hero` keeps the suggestion panel on a light surface while the field itself
              sits on the dark band — a popover in band colours over body-coloured page
              content reads as a rendering fault. */}
          <div className="mx-auto mt-6 max-w-xl">
            <HeaderSearch size="lg" tone="hero" placeholder="Search for a medicine" />
          </div>

          <div className="mx-auto mt-3 flex max-w-xl justify-center">
            <PincodeCheck tone="hero" />
          </div>
        </div>
      </div>
    </section>
  )
}
