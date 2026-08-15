"use client";

import { useEffect, useState } from "react";
import { X, Ruler } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

// General apparel size chart (chest/waist in inches; cm derived). Measurements are body
// measurements, not garment — the standard way size guides are presented.
const CHART = [
  { size: "XS", chest: 34, waist: 28 },
  { size: "S", chest: 36, waist: 30 },
  { size: "M", chest: 38, waist: 32 },
  { size: "L", chest: 40, waist: 34 },
  { size: "XL", chest: 42, waist: 36 },
  { size: "XXL", chest: 44, waist: 38 },
];

const toCm = (inches: number) => Math.round(inches * 2.54);

export default function SizeGuideModal({ open, onClose }: Props) {
  const [unit, setUnit] = useState<"in" | "cm">("in");

  // Esc to close + lock background scroll while open (basic dialog a11y).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const conv = (v: number) => (unit === "in" ? v : toCm(v));

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-black text-gray-900 flex items-center gap-2">
            <Ruler size={18} className="text-brand" /> Size Guide
          </h3>
          <button onClick={onClose} aria-label="Close size guide" className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Find your best fit using body measurements.</p>
            <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
              {(["in", "cm"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-colors ${unit === u ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-bold">Size</th>
                  <th className="py-2 font-bold text-right">Chest ({unit})</th>
                  <th className="py-2 font-bold text-right">Waist ({unit})</th>
                </tr>
              </thead>
              <tbody>
                {CHART.map((row) => (
                  <tr key={row.size} className="border-b border-gray-50">
                    <td className="py-2.5 font-bold text-gray-900">{row.size}</td>
                    <td className="py-2.5 text-right text-gray-600">{conv(row.chest)}</td>
                    <td className="py-2.5 text-right text-gray-600">{conv(row.waist)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 bg-brand-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-700 mb-1">How to measure</p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
              <li><span className="font-semibold text-gray-700">Chest:</span> measure around the fullest part, keeping the tape level.</li>
              <li><span className="font-semibold text-gray-700">Waist:</span> measure around your natural waistline.</li>
              <li>If you&apos;re between sizes, we recommend sizing up for a relaxed fit.</li>
            </ul>
          </div>

          <p className="text-[11px] text-gray-400 mt-3">This is a general guide; fit may vary by style and fabric.</p>
        </div>
      </div>
    </div>
  );
}
