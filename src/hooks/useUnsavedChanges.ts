import { useEffect, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Hook to warn users about unsaved changes when navigating away.
 * Compatible with component-based BrowserRouter (no data router required).
 * @param isDirty - whether the form has unsaved changes
 */
export function useUnsavedChanges(isDirty: boolean) {
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  const openUnsavedDialog = useCallback((path: string) => {
    setPendingPath(path);
    setShowDialog(true);
  }, []);

  // Block browser navigation (refresh, close tab)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Intercept internal link clicks (sidebar, menu, links inside the app)
  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.origin);
      if (nextUrl.origin !== window.location.origin) return;

      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      if (nextPath === currentPath) return;

      event.preventDefault();
      openUnsavedDialog(nextPath);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [currentPath, isDirty, openUnsavedDialog]);

  const tryNavigate = useCallback(
    (path: string) => {
      if (isDirty && path !== currentPath) {
        openUnsavedDialog(path);
      } else {
        navigate(path);
      }
    },
    [currentPath, isDirty, navigate, openUnsavedDialog]
  );

  const confirmLeave = useCallback(() => {
    setShowDialog(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  }, [pendingPath, navigate]);

  const cancelLeave = useCallback(() => {
    setShowDialog(false);
    setPendingPath(null);
  }, []);

  return { showDialog, confirmLeave, cancelLeave, tryNavigate };
}

