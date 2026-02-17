const API_URL = "https://models.dev/api.json";
const CACHE_SECONDS = 900;

export const revalidate = 900;

export async function GET() {
  try {
    const response = await fetch(API_URL, {
      headers: { accept: "application/json" },
      next: { revalidate: CACHE_SECONDS },
    });

    if (!response.ok) {
      return Response.json(
        { error: `Upstream API responded with HTTP ${response.status}.` },
        { status: 502 },
      );
    }

    const payload = await response.json();
    return Response.json(payload, {
      headers: {
        "Cache-Control": `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=3600`,
      },
    });
  } catch {
    return Response.json(
      { error: "Unable to reach models.dev/api.json from the server." },
      { status: 502 },
    );
  }
}
