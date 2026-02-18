import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          color: "#f8f3ec",
          background:
            "radial-gradient(circle at 10% 20%, #4a2923 0%, transparent 44%), radial-gradient(circle at 82% 5%, #1e3f4b 0%, transparent 44%), linear-gradient(160deg, #0b0a09, #1a1412)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            border: "1px solid rgba(255, 240, 226, 0.4)",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 22,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#ffd7c2",
          }}
        >
          Live AI Model Registry
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1 }}>MODELS.DEV API EXPLORER</div>
          <div style={{ fontSize: 32, color: "#d1c7bc" }}>
            Search and compare AI models side by side by providers, limits, reasoning, and pricing.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 28, color: "#ff8d57" }}>by stanislav.black</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
