"use client";

import { useCallback, useEffect, useState } from "react";
import { type ActionSnackbarExtendedVariant } from "../components/ui/ActionSnackbar";

export interface ActionSnackbarState {
  type: ActionSnackbarExtendedVariant;
  name?: string;
  message?: string;
}

export function useActionSnackbar(autoDismissMs = 3500) {
  const [snackbar, setSnackbar] = useState<ActionSnackbarState | null>(null);

  useEffect(() => {
    if (!snackbar) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSnackbar(null);
    }, autoDismissMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoDismissMs, snackbar]);

  const showSnackbar = useCallback((payload: ActionSnackbarState) => {
    setSnackbar(payload);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  return {
    snackbar,
    showSnackbar,
    hideSnackbar,
  };
}
