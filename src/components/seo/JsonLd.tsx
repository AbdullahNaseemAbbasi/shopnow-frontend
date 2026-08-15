// Renders a JSON-LD structured-data block. Server-safe (emits a plain <script> tag, no client JS).
// Search engines read these <script type="application/ld+json"> blocks for rich results —
// Organization/WebSite in the root layout, Product + Offer + AggregateRating + BreadcrumbList on
// the product page. Accepts a single schema object or an array of them.
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // The payload is app-controlled structured data (no user HTML), serialised via JSON.stringify.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
