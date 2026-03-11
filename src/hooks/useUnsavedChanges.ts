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

  // Block browser navigation (refresh, close tab)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const tryNavigate = useCallback(
    (path: string) => {
      if (isDirty && path !== location.pathname) {
        setPendingPath(path);
        setShowDialog(true);
      } else {
        navigate(path);
      }
    },
    [isDirty, location.pathname, navigate]
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
