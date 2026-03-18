"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useSchemaBuilderStore } from "@/stores/schema-editor-store";

export function useSchemaUnsavedChangesProtection() {
  const router = useRouter();
  const checkUnsavedChanges = useSchemaBuilderStore(
    (state) => state.checkUnsavedChanges,
  );

  const originalPushRef = useRef<typeof router.push | null>(null);
  const originalReplaceRef = useRef<typeof router.replace | null>(null);
  const originalBackRef = useRef<typeof router.back | null>(null);
  const ignoreNextPopRef = useRef(false);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!useSchemaBuilderStore.getState().hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const createProtectedNavigation = useCallback(
    (originalMethod: Function) => {
      return (...args: any[]) => {
        const navigationCallback = () => originalMethod(...args);
        const canNavigate = checkUnsavedChanges(navigationCallback);

        if (canNavigate) {
          navigationCallback();
        }
      };
    },
    [checkUnsavedChanges],
  );

  useEffect(() => {
    if (!originalPushRef.current) {
      originalPushRef.current = router.push.bind(router);
    }

    if (!originalReplaceRef.current) {
      originalReplaceRef.current = router.replace.bind(router);
    }

    if (!originalBackRef.current) {
      originalBackRef.current = router.back.bind(router);
    }

    router.push = createProtectedNavigation(
      originalPushRef.current,
    ) as typeof router.push;
    router.replace = createProtectedNavigation(
      originalReplaceRef.current,
    ) as typeof router.replace;
    router.back = createProtectedNavigation(
      originalBackRef.current,
    ) as typeof router.back;

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

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        return;
      }

      if (!useSchemaBuilderStore.getState().hasUnsavedChanges) {
        return;
      }

      window.history.pushState(null, "", window.location.href);

      const canNavigate = useSchemaBuilderStore
        .getState()
        .checkUnsavedChanges(() => {
          ignoreNextPopRef.current = true;
          window.history.back();
        });

      if (canNavigate) {
        ignoreNextPopRef.current = true;
        window.history.back();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
}
