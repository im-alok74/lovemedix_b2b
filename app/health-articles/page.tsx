import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getHealthArticles } from "@/lib/health-articles"
import Link from "next/link"

export default async function HealthArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>
}) {
  const params = await searchParams
  const topic = (params.topic || "").trim()
  const articles = await getHealthArticles(topic)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Health Articles</h1>
            <p className="mt-2 text-muted-foreground">
              Practical health and medicine guidance for everyday care.
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <form className="flex flex-col gap-3 sm:flex-row">
                <Input
                  name="topic"
                  placeholder="Try: diabetes, fever, antibiotics, heart health"
                  defaultValue={topic}
                />
                <div className="flex gap-2">
                  <Button type="submit">Search</Button>
                  <Button variant="outline" asChild>
                    <Link href="/health-articles">Reset</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article, idx) => (
              <Card key={`${article.title}-${idx}`} className="h-full">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{article.category}</Badge>
                    <span className="text-xs text-muted-foreground">{article.readTime}</span>
                  </div>
                  <CardTitle className="text-lg leading-snug">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{article.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Educational content only. Not a substitute for professional medical advice.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
