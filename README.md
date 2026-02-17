# Models.dev API Explorer

Noir-styled Next.js dashboard for exploring [`models.dev/api.json`](https://models.dev/api.json).

## Features

- Live model registry view (providers, model IDs, limits, reasoning, pricing)
- Search + provider filtering
- Pixel mini-game loader while API data is loading
- SEO-ready metadata (Open Graph, JSON-LD, sitemap, robots)
- WebMCP EPP support (`navigator.modelContext`) with basic tools

## Tech

- Next.js (App Router)
- React

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## Environment

- `NEXT_PUBLIC_SITE_URL` (recommended for production SEO/canonical URLs)
  - Example: `https://your-domain.com`

## Important Routes

- `/` — main dashboard
- `/api/models` — server proxy to `models.dev/api.json`
- `/opengraph-image` — dynamic OG image
- `/robots.txt`
- `/sitemap.xml`

## Credits

- Data source: [anomalyco/models.dev](https://github.com/anomalyco/models.dev)
- Design direction: [stanislav.black](https://stanislav.black/)
