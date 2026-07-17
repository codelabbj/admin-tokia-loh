import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { clientsAPI } from "../api/client.api";
import { fetchAllPaginatedPages } from "../utils/fetchAllPages";
import { extractClientsRows } from "./useClients";

/** Rafraîchissement présence clients (page Clients + fiche client). */
export const ONLINE_CLIENTS_POLL_MS = 10_000;

const ONLINE_FETCH_PAGE_SIZE = 100;

export function extractOnlineMeta(payload) {
  const resultsField = payload?.results;
  if (resultsField && typeof resultsField === "object" && !Array.isArray(resultsField)) {
    return {
      onlineCount:
        typeof resultsField.online_count === "number"
          ? resultsField.online_count
          : extractClientsRows(payload).length,
      thresholdMinutes: resultsField.threshold_minutes ?? 5,
    };
  }
  const rows = extractClientsRows(payload);
  return {
    onlineCount: typeof payload?.count === "number" ? payload.count : rows.length,
    thresholdMinutes: 5,
  };
}

/**
 * Clients en ligne — rafraîchissement périodique pour le backoffice.
 */
export const useOnlineClients = ({
  enabled = true,
  pollMs = ONLINE_CLIENTS_POLL_MS,
} = {}) => {
  const [onlineClients, setOnlineClients] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [thresholdMinutes, setThresholdMinutes] = useState(5);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const hasLoadedOnce = useRef(false);

  const fetchOnline = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      let meta = { onlineCount: 0, thresholdMinutes: 5 };

      const { items, totalCount } = await fetchAllPaginatedPages(
        async (pageNum, pageSize) => {
          const { data } = await clientsAPI.online({
            page: pageNum,
            page_size: pageSize,
          });
          if (pageNum === 1) meta = extractOnlineMeta(data);
          return data;
        },
        {
          pageSize: ONLINE_FETCH_PAGE_SIZE,
          extractList: extractClientsRows,
        },
      );

      setOnlineClients(items);
      setOnlineCount(meta.onlineCount || totalCount || items.length);
      setThresholdMinutes(meta.thresholdMinutes);
      hasLoadedOnce.current = true;
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des clients en ligne");
      if (!hasLoadedOnce.current) {
        setOnlineClients([]);
        setOnlineCount(0);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchOnline({ silent: hasLoadedOnce.current });
  }, [enabled, reloadNonce, fetchOnline]);

  useEffect(() => {
    if (!enabled || pollMs <= 0) return;
    const id = setInterval(() => {
      setReloadNonce((n) => n + 1);
    }, pollMs);
    return () => clearInterval(id);
  }, [enabled, pollMs]);

  const refetch = useCallback(() => {
    fetchOnline({ silent: false });
  }, [fetchOnline]);

  const onlineIds = useMemo(
    () => new Set(onlineClients.map((c) => String(c.id))),
    [onlineClients],
  );

  return {
    onlineClients,
    onlineCount,
    onlineIds,
    thresholdMinutes,
    loading,
    error,
    refetch,
    pollMs,
  };
};
