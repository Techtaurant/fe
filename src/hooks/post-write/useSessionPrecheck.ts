import { useCallback, useEffect, useRef } from "react";
import { httpClient } from "../../utils/httpClient";
import {
  AUTH_HEARTBEAT_MS,
  AUTH_PRECHECK_DEBOUNCE_MS,
} from "../../lib/post-write/constants";

interface UseSessionPrecheckParams {
  user: unknown;
  hasEditableContent: boolean;
  isAuthExpiredModalOpen: boolean;
  contentFingerprint: string;
  onAuthExpired: () => void;
}

export function useSessionPrecheck({
  user,
  hasEditableContent,
  isAuthExpiredModalOpen,
  contentFingerprint,
  onAuthExpired,
}: UseSessionPrecheckParams) {
  const authPrecheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authHeartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSessionRefreshInFlightRef = useRef(false);

  const tryBackgroundSessionRefresh = useCallback(async () => {
    if (!user || !hasEditableContent || isAuthExpiredModalOpen) return;
    if (isSessionRefreshInFlightRef.current) return;

    isSessionRefreshInFlightRef.current = true;
    try {
      const sessionProbe = await httpClient("/api/users/me", { method: "GET" });

      if (sessionProbe.ok) return;
      if (sessionProbe.status === 401) {
        onAuthExpired();
      }
    } finally {
      isSessionRefreshInFlightRef.current = false;
    }
  }, [hasEditableContent, isAuthExpiredModalOpen, onAuthExpired, user]);

  useEffect(() => {
    if (!user || !hasEditableContent || isAuthExpiredModalOpen) {
      if (authPrecheckTimerRef.current) {
        clearTimeout(authPrecheckTimerRef.current);
        authPrecheckTimerRef.current = null;
      }
      return;
    }

    if (authPrecheckTimerRef.current) {
      clearTimeout(authPrecheckTimerRef.current);
      authPrecheckTimerRef.current = null;
    }

    authPrecheckTimerRef.current = setTimeout(() => {
      void tryBackgroundSessionRefresh();
    }, AUTH_PRECHECK_DEBOUNCE_MS);

    return () => {
      if (authPrecheckTimerRef.current) {
        clearTimeout(authPrecheckTimerRef.current);
        authPrecheckTimerRef.current = null;
      }
    };
  }, [
    contentFingerprint,
    hasEditableContent,
    isAuthExpiredModalOpen,
    tryBackgroundSessionRefresh,
    user,
  ]);

  useEffect(() => {
    if (!user || !hasEditableContent || isAuthExpiredModalOpen) {
      if (authHeartbeatTimerRef.current) {
        clearInterval(authHeartbeatTimerRef.current);
        authHeartbeatTimerRef.current = null;
      }
      return;
    }

    authHeartbeatTimerRef.current = setInterval(() => {
      void tryBackgroundSessionRefresh();
    }, AUTH_HEARTBEAT_MS);

    return () => {
      if (authHeartbeatTimerRef.current) {
        clearInterval(authHeartbeatTimerRef.current);
        authHeartbeatTimerRef.current = null;
      }
    };
  }, [
    hasEditableContent,
    isAuthExpiredModalOpen,
    tryBackgroundSessionRefresh,
    user,
  ]);
}
