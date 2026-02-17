import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Models.dev API Explorer | Stanislav Black",
    template: "%s | Models.dev API Explorer",
  },
  description:
    "Search and compare AI models from models.dev/api.json: providers, model families, context limits, output limits, reasoning support, and pricing.",
  applicationName: "Models.dev API Explorer",
  keywords: [
    "models.dev",
    "AI model registry",
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
      "Live searchable dashboard for models.dev/api.json with providers, capabilities, token limits, and pricing.",
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
      "Live searchable dashboard for models.dev/api.json with providers, capabilities, token limits, and pricing.",
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
