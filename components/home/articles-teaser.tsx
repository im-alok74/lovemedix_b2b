import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"

import { getHealthArticles } from "@/lib/health-articles"

/**
 * Three health articles, linking through to the full hub.
 *
 * Editorial content is an SEO asset on a pharmacy: it ranks for informational queries
 * ("is paracetamol safe in pregnancy") that product pages never will, and it is what an
 * answer engine cites. The hub itself still needs Article schema — see AGENT_HANDOFF.md.
 *
 * Titles only. The three-line summaries were 111 words — the heaviest prose block on the
 * homepage outside the FAQ — spent selling articles that live on another page. A headline
 * is enough to earn the click, and the summaries are still there when the reader arrives.
 */
export async function ArticlesTeaser() {
  let articles: Awaited<ReturnType<typeof getHealthArticles>> = []

  try {
    articles = await getHealthArticles()
  } catch (error) {
    console.error("[articles-teaser] load failed:", error)
    return null
  }

  if (articles.length === 0) return null

  return (
    <section aria-labelledby="articles-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="articles-heading" className="home-h2">
            Health reads
          </h2>
          <Link href="/health-articles" className="home-link shrink-0">
            All articles
          </Link>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <li key={article.title}>
              <Link href="/health-articles" className="surface surface-hover flex h-full flex-col p-4">
                <span className="text-sm font-bold uppercase tracking-wide text-primary">
                  {article.category}
                </span>
                <h3 className="home-h3 mt-1.5">{article.title}</h3>
                <span className="home-meta mt-auto flex items-center gap-3 pt-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" aria-hidden />
                    {article.readTime}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-primary">
                    Read
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
