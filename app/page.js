import ModelsBoard from "../components/ModelsBoard";

export default function HomePage() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: "Models.dev API Explorer",
        inLanguage: "en-US",
        description:
          "Search and compare AI models side by side in a live database of AI models from models.dev/api.json with providers, model limits, reasoning support, and pricing.",
        publisher: {
          "@type": "Person",
          name: "Stanislav Black",
          url: "https://stanislav.black/",
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#app`,
        name: "Models.dev API Explorer",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: `${siteUrl}/`,
        description:
          "A live web dashboard and database of AI models to filter and compare models side by side using data from models.dev/api.json.",
        featureList: [
          "Live model registry search",
          "Provider and family filtering",
          "Side-by-side model comparison",
          "Context, output, reasoning, and pricing comparison",
        ],
      },
      {
        "@type": "Dataset",
        "@id": `${siteUrl}/#dataset`,
        name: "Models.dev API Registry Mirror",
        description:
          "Live representation of models.dev/api.json with normalized provider, model, modality, and cost metadata for discovery and comparison.",
        url: `${siteUrl}/`,
        isBasedOn: "https://models.dev/api.json",
        creator: {
          "@type": "Organization",
          name: "Anomaly",
          url: "https://github.com/anomalyco/models.dev",
        },
        keywords: [
          "models.dev",
          "AI model registry",
          "database of AI models",
          "model comparison",
          "LLM models",
          "token pricing",
          "context window",
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ModelsBoard />
    </>
  );
}
