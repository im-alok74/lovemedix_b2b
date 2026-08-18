/**
 * Renders a JSON-LD structured-data block.
 *
 * `JSON.stringify` output is escaped so a `</script>` sequence inside any field (a
 * medicine description, a review body) cannot break out of the script tag.
 */
export function JsonLd({ data, id }: { data: object | object[]; id?: string }) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
