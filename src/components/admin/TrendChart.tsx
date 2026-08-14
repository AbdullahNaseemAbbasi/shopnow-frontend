"use client";

import { useRef, useState } from "react";

export interface TrendPoint {
  label: string;   // short axis label, e.g. "14 Aug"
  date: string;    // ISO yyyy-MM-dd
  revenue: number;
  orders: number;
}

interface Props {
  points: TrendPoint[];
  metric: "revenue" | "orders";
  color: string;                       // stroke / fill hue for the active metric
  formatCurrency: (v: number) => string;  // used for revenue values only; counts render as plain numbers
}

// Fixed coordinate space; the SVG scales to its container via width:100%. Mouse coordinates are
// mapped back into this space through getBoundingClientRect, so hover stays accurate at any width.
const VIEW_W = 820;
const VIEW_H = 260;
const PAD = { top: 18, right: 18, bottom: 30, left: 54 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

// Round a max value up to a "nice" round ceiling so gridlines land on readable numbers.
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

// Compact axis number: 1250 -> "1.3k", 2_000_000 -> "2M".
function compact(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1) + "k";
  return String(Math.round(v));
}

export default function TrendChart({ points, metric, color, formatCurrency }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const values = points.map((p) => (metric === "revenue" ? p.revenue : p.orders));
  const maxV = niceCeil(Math.max(1, ...values));
  const n = points.length;

  const x = (i: number) => PAD.left + (n <= 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W);
  const y = (v: number) => PAD.top + PLOT_H - (v / maxV) * PLOT_H;
  const baseY = PAD.top + PLOT_H;

  const linePath = points.map((_, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(values[i]).toFixed(1)}`).join(" ");
  const areaPath = n > 0 ? `${linePath} L ${x(n - 1).toFixed(1)} ${baseY} L ${x(0).toFixed(1)} ${baseY} Z` : "";

  const gridY = [0, 0.25, 0.5, 0.75, 1];
  // Show ~7 x-axis labels max, evenly spaced, always including the last day.
  const labelEvery = Math.max(1, Math.ceil(n / 7));

  const gid = `trend-${metric}`;

  const handleMove = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const i = Math.round(((svgX - PAD.left) / PLOT_W) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto select-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines + y labels */}
        {gridY.map((g) => {
          const gy = PAD.top + PLOT_H - g * PLOT_H;
          return (
            <g key={g}>
              <line x1={PAD.left} y1={gy} x2={VIEW_W - PAD.right} y2={gy} stroke="#e2e8f0" strokeWidth={1} />
              <text x={PAD.left - 8} y={gy + 4} textAnchor="end" fontSize={11} fill="#94a3b8">
                {compact(maxV * g)}
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={p.date} x={x(i)} y={VIEW_H - 8} textAnchor="middle" fontSize={11} fill="#94a3b8">
              {p.label}
            </text>
          ) : null
        )}

        {n > 0 && (
          <>
            <path d={areaPath} fill={`url(#${gid})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}

        {/* hover guide + marker */}
        {hp && (
          <>
            <line x1={x(hover!)} y1={PAD.top} x2={x(hover!)} y2={baseY} stroke={color} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
            <circle cx={x(hover!)} cy={y(values[hover!])} r={5} fill="#fff" stroke={color} strokeWidth={2.5} />
          </>
        )}
      </svg>

      {/* tooltip — HTML overlay so text is never clipped by the SVG viewport */}
      {hp && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full z-10"
          style={{ left: `${(x(hover!) / VIEW_W) * 100}%`, top: `${(y(values[hover!]) / VIEW_H) * 100}%` }}
        >
          <div className="mb-2 rounded-xl bg-gray-900 text-white px-3 py-2 shadow-lg whitespace-nowrap">
            <p className="text-[11px] text-gray-300 font-medium">{hp.label}</p>
            <p className="text-sm font-black" style={{ color }}>
              {metric === "revenue" ? formatCurrency(hp.revenue) : `${hp.orders} order${hp.orders === 1 ? "" : "s"}`}
            </p>
            <p className="text-[11px] text-gray-400">
              {metric === "revenue" ? `${hp.orders} order${hp.orders === 1 ? "" : "s"}` : `${formatCurrency(hp.revenue)} revenue`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
