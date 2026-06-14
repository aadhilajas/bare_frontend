import { useEffect } from "react";

const BRAND = "Bare CRM";

/**
 * Sets the browser tab title while the calling component is mounted.
 * Format: "<title> · Bare CRM"
 * Restores the default title when the component unmounts.
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${BRAND}`;
    return () => {
      document.title = BRAND;
    };
  }, [title]);
}
