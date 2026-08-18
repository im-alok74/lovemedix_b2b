import { ChevronDown } from "lucide-react"

import type { Faq } from "@/lib/faqs"

/**
 * FAQ accordion.
 *
 * Built on native <details>, so it needs no JavaScript and — importantly for AEO — the
 * answer text is present in the initial HTML rather than injected on expand. A crawler
 * or an AI assistant that does not execute JS still sees every answer.
 */
export function FaqSection({
  faqs,
  title = "Frequently asked questions",
  description,
  moreHref,
  moreLabel = "See all questions",
}: {
  faqs: Faq[]
  title?: string
  description?: string
  /**
   * Where the questions that did not make the cut live.
   *
   * The homepage shows four rather than all eight. Every answer ships in the initial HTML
   * even while collapsed — that is what makes this readable by an answer engine — so
   * eight answers meant ~370 words of hidden text on the page a first-time visitor loads
   * over 3G. The other four still exist in full on /faq.
   */
  moreHref?: string
  moreLabel?: string
}) {
  if (faqs.length === 0) return null

  return (
    <section aria-labelledby="faq-heading" className="py-10 sm:py-14">
      <div className="page-container">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-base text-muted-foreground">{description}</p>
          ) : null}

          <div className="mt-6 divide-y divide-border border-y border-border">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <h3 className="text-base font-bold text-foreground sm:text-lg">{faq.question}</h3>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 text-base leading-7 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>

          {moreHref ? (
            <a
              href={moreHref}
              className="mt-5 inline-block text-base font-bold text-primary underline-offset-4 hover:underline"
            >
              {moreLabel}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}
