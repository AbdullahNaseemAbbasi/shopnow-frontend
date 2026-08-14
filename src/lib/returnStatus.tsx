import type { ReturnReason, ReturnStatus, ReturnType } from "@/types";

// Labels + pill styling for the returns/exchanges module, aligned with the design-system palette.
export const RETURN_STATUS_META: Record<ReturnStatus, { label: string; badge: string }> = {
  SUBMITTED: { label: "Submitted", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED:  { label: "Approved",  badge: "bg-brand-50 text-brand-700 border-brand-200" },
  REJECTED:  { label: "Rejected",  badge: "bg-gray-100 text-gray-600 border-gray-200" },
  RECEIVED:  { label: "Received",  badge: "bg-slate-100 text-slate-700 border-slate-200" },
  COMPLETED: { label: "Completed", badge: "bg-green-50 text-green-700 border-green-200" },
};

export const RETURN_REASON_LABEL: Record<ReturnReason, string> = {
  DAMAGED: "Damaged",
  WRONG_ITEM: "Wrong item",
  WRONG_SIZE: "Wrong size",
  QUALITY_ISSUE: "Quality issue",
  OTHER: "Other",
};

export const RETURN_TYPE_LABEL: Record<ReturnType, string> = {
  RETURN: "Return",
  EXCHANGE: "Exchange",
};

// Admin next-states, mirroring the backend RETURN_TRANSITIONS state machine.
export const RETURN_ALLOWED_NEXT: Record<ReturnStatus, ReturnStatus[]> = {
  SUBMITTED: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED"],
  RECEIVED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

// A return is still "active" (blocks a new one, shown as in-progress) until terminal.
export const RETURN_TERMINAL: ReturnStatus[] = ["REJECTED", "COMPLETED"];
