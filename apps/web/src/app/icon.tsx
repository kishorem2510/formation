import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const NODES = [
  { cx: 16, cy: 9 },
  { cx: 9, cy: 16 },
  { cx: 23, cy: 16 },
  { cx: 6, cy: 23 },
  { cx: 16, cy: 23 },
  { cx: 26, cy: 23 },
];

const LINES = [
  [16, 9, 9, 16],
  [16, 9, 23, 16],
  [9, 16, 6, 23],
  [9, 16, 16, 23],
  [23, 16, 16, 23],
  [23, 16, 26, 23],
];

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0b0f14",
          borderRadius: 8,
          display: "flex",
        }}
      >
        <svg viewBox="0 0 32 32" width="32" height="32">
          {LINES.map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#f5f7fa"
              strokeOpacity={0.35}
              strokeWidth={1.25}
            />
          ))}
          {NODES.map((n, i) => (
            <circle key={i} cx={n.cx} cy={n.cy} r={2.5} fill="#22c55e" />
          ))}
        </svg>
      </div>
    ),
    { ...size },
  );
}
