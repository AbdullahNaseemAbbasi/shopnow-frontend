import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "brandSolid" | "success" | "warning" | "danger" | "neutral" | "ink";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  brandSolid: "bg-brand text-white",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-amber-700",
  danger: "bg-danger-light text-danger",
  neutral: "bg-surface-subtle text-ink-soft",
  ink: "bg-ink text-white",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

// Small status/label pill. Tones map to the semantic palette so states never collide with
// the brand red (e.g. an "out of stock" danger badge is visibly distinct from a sale badge).
export default function Badge({ tone = "neutral", className, children, ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
