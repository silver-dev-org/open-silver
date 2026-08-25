import { ImageResponse } from "next/og";

export const alt = "Open Silver — Open Source Software made by Silver.dev";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700, display: "flex" }}>
        <span style={{ color: "#c0c0c0" }}>Open</span>
        <span style={{ marginLeft: 24 }}>Silver</span>
      </div>
      <div style={{ fontSize: 36, marginTop: 24, color: "#a3a3a3" }}>
        Open Source Software made by Silver.dev
      </div>
      <div style={{ fontSize: 28, marginTop: 64, color: "#737373" }}>
        open.silver.dev
      </div>
    </div>,
    size,
  );
}
