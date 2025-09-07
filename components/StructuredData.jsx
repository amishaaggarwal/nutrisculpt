export default function StructuredData({ type = "calculator", name, description, url }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": name,
    "description": description,
    "url": url,
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "NutriSculpt",
      "url": "https://nutrisculpt.vercel.app"
    },
    "publisher": {
      "@type": "Organization",
      "name": "NutriSculpt",
      "url": "https://nutrisculpt.vercel.app"
    }
  };

  if (type === "calculator") {
    structuredData["@type"] = "WebApplication";
    structuredData.applicationSubCategory = "Calculator";
  } else if (type === "website") {
    structuredData["@type"] = "WebSite";
    structuredData.potentialAction = {
      "@type": "SearchAction",
      "target": "https://nutrisculpt.vercel.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}