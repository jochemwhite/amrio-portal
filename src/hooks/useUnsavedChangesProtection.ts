"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";

export function useUnsavedChangesProtection() {
  const router = useRouter();
  const { hasUnsavedChanges, checkUnsavedChanges } = usePageBuilderStore();
  const originalPushRef = useRef<typeof router.push>();
  const originalReplaceRef = useRef<typeof router.replace>();
  const originalBackRef = useRef<typeof router.back>();

  // Handle browser beforeunload event (closing tab, refreshing, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages and show their own
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Create protected navigation functions
  const createProtectedNavigation = useCallback(
    (originalMethod: Function, methodName: string) => {
      return (...args: any[]) => {
        const navigationCallback = () => originalMethod.apply(router, args);
        
        const canNavigate = checkUnsavedChanges(navigationCallback);
        if (canNavigate) {
          // No unsaved changes, proceed with navigation
          originalMethod.apply(router, args);
        }
        // If canNavigate is false, the dialog will be shown and navigation will be handled there
      };
    },
    [checkUnsavedChanges, router]
  );

  // Override router methods with protection
  useEffect(() => {
    // Store original methods
    originalPushRef.current = router.push;
    originalReplaceRef.current = router.replace;
    originalBackRef.current = router.back;

    // Override with protected versions
    router.push = createProtectedNavigation(originalPushRef.current, "push");
    router.replace = createProtectedNavigation(originalReplaceRef.current, "replace");
    router.back = createProtectedNavigation(originalBackRef.current, "back");

    // Cleanup function to restore original methods
    return () => {
      if (originalPushRef.current) {
        router.push = originalPushRef.current;
      }
      if (originalReplaceRef.current) {
        router.replace = originalReplaceRef.current;
      }
      if (originalBackRef.current) {
        router.back = originalBackRef.current;
      }
    };
  }, [createProtectedNavigation, router]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        // Prevent the navigation by pushing the current state back
        window.history.pushState(null, "", window.location.href);
        
        // Show our custom dialog
        checkUnsavedChanges(() => {
          // If user chooses to navigate, go back to the intended destination
          window.history.back();
        });
      }
    };

    // Push initial state to handle back button
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges, checkUnsavedChanges]);
} 