import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Models.dev API Explorer & Model Compare | Stanislav Black",
    template: "%s | Models.dev API Explorer",
  },
  description:
    "Search and compare AI models side by side in a live database of AI models from models.dev/api.json: providers, model families, context limits, output limits, reasoning support, and pricing.",
  applicationName: "Models.dev API Explorer",
  keywords: [
    "models.dev",
    "AI model registry",
    "database of AI models",
    "AI models database",
    "compare ai models",
    "model comparison tool",
    "LLM pricing",
    "model context window",
    "AI providers",
    "Stanislav Black",
  ],
  authors: [{ name: "Stanislav Black", url: "https://stanislav.black/" }],
  creator: "Stanislav Black",
  publisher: "Stanislav Black",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Models.dev API Explorer",
    title: "Models.dev API Explorer",
    description:
      "Live database of AI models from models.dev/api.json where you can search and compare models side by side across limits, reasoning, and pricing.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Models.dev API Explorer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Models.dev API Explorer",
    description:
      "Search and compare AI models side by side in a live database of AI models from models.dev/api.json, including context, output, reasoning, and pricing.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
