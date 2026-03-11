import { useEffect, useCallback, useRef } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Hook to warn users about unsaved changes when navigating away.
 * @param isDirty - whether the form has unsaved changes
 */
export function useUnsavedChanges(isDirty: boolean) {
  const blockerRef = useRef(isDirty);
  blockerRef.current = isDirty;

  // Block react-router navigation
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) => {
        return blockerRef.current && currentLocation.pathname !== nextLocation.pathname;
      },
      []
    )
  );

  // Block browser navigation (refresh, close tab)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (blockerRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return blocker;
}
