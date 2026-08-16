import { useEffect, type RefObject } from "react";

/**
 * Modal a11y in one hook, mirroring the pattern in SizeGuideModal: while `active`, focus moves into
 * the container, Tab/Shift+Tab cycle within it (never escaping to the page behind), Esc calls
 * `onClose`, background scroll is locked, and focus returns to the opener on close.
 *
 * `onClose` MUST be stable (wrap in useCallback) — it's an effect dependency, so an inline arrow
 * would re-run the effect and re-grab focus on every render.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  containerRef: RefObject<T | null>,
  onClose: () => void
) {
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusablesIn = (el: HTMLElement) =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((n) => !n.hasAttribute("disabled"));

    const container = containerRef.current;
    (container ? (focusablesIn(container)[0] ?? container) : null)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !containerRef.current) return;
      const items = focusablesIn(containerRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [active, containerRef, onClose]);
}
