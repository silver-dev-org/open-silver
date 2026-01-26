import { ImageResponse } from "next/og";
import { list } from "@vercel/blob";
import type { RoastMetadata } from "@/roast-me/types";

export const runtime = "edge";
export const alt = "Roast Me Result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 0;

async function getMetadata(id: string): Promise<RoastMetadata | null> {
  try {
    const { blobs } = await list({ prefix: `roast-me/${id}/metadata.json` });
    if (blobs.length === 0) return null;

    const response = await fetch(blobs[0].url);
    if (!response.ok) return null;

    return response.json();
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const metadata = await getMetadata(id);

  if (!metadata) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            color: "#fff",
            fontSize: 48,
          }}
        >
          Roast not found
        </div>
      ),
      size,
    );
  }

  const fontData = await fetch(
    new URL("../../../../public/fonts/pricedown.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  const isPass = metadata.analysis.score === "pass";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {/* Background image */}
        <img
          src={metadata.snapshotUrl}
          alt=""
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: isPass ? "none" : "grayscale(1)",
          }}
        />

        {/* Vignette overlay */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0) 65%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Dark overlay for pass state */}
        {isPass && (
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          />
        )}

        {/* Corner indicators */}
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 24,
            width: 24,
            height: 24,
            borderLeft: "3px solid white",
            borderTop: "3px solid white",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 24,
            top: 24,
            width: 24,
            height: 24,
            borderRight: "3px solid white",
            borderTop: "3px solid white",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            bottom: 24,
            width: 24,
            height: 24,
            borderLeft: "3px solid white",
            borderBottom: "3px solid white",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 24,
            bottom: 24,
            width: 24,
            height: 24,
            borderRight: "3px solid white",
            borderBottom: "3px solid white",
          }}
        />

        {/* GTA overlay text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            fontFamily: "Pricedown",
            textAlign: "center",
          }}
        >
          {isPass ? (
            <>
              <div
                style={{
                  color: "#fbbf24",
                  fontSize: 96,
                  textShadow:
                    "4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
                  lineHeight: 1.1,
                }}
              >
                MISSION PASSED
              </div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 58,
                  textShadow:
                    "4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
                  marginTop: 8,
                }}
              >
                RESPECT+
              </div>
            </>
          ) : (
            <div
              style={{
                color: "#dc2626",
                fontSize: 120,
                textShadow:
                  "4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 40px rgba(255, 0, 0, 0.8)",
                lineHeight: 1.1,
              }}
            >
              ROASTED
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Pricedown",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
