import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router";
import { dashboardAPI } from "../api/dashboard.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import {
  playNewOrderSound,
  unlockNotificationSound,
} from "../utils/playNewOrderSound";

const POLL_INTERVAL_MS = 6000;
const STORAGE_KNOWN = "tokia.knownOrderIds";
const STORAGE_UNSEEN = "tokia.unseenOrderIds";
const MAX_TRACKED = 300;

const NewOrdersContext = createContext(null);

function readIdList(key) {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeIdList(key, ids) {
  try {
    sessionStorage.setItem(key, JSON.stringify(ids.slice(0, MAX_TRACKED)));
  } catch {
    /* quota / mode privé */
  }
}

function extractOrderIds(payload) {
  const data = payload?.data ?? payload;
  const list = Array.isArray(data)
    ? data
    : (data?.results ?? data?.orders ?? data?.data ?? []);
  if (!Array.isArray(list)) return [];
  return list.map((o) => String(o?.id)).filter(Boolean);
}

export function NewOrdersProvider({ children }) {
  const location = useLocation();
  const onOrdersPage = location.pathname.startsWith("/orders");

  const knownIdsRef = useRef(new Set(readIdList(STORAGE_KNOWN)));
  const initialDoneRef = useRef(knownIdsRef.current.size > 0);
  const onOrdersPageRef = useRef(onOrdersPage);
  onOrdersPageRef.current = onOrdersPage;

  const [unseenIds, setUnseenIds] = useState(() => new Set(readIdList(STORAGE_UNSEEN)));

  const persistKnown = useCallback(() => {
    writeIdList(STORAGE_KNOWN, [...knownIdsRef.current]);
  }, []);

  const persistUnseen = useCallback((nextSet) => {
    writeIdList(STORAGE_UNSEEN, [...nextSet]);
  }, []);

  const markOrdersSeen = useCallback(() => {
    setUnseenIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set();
      persistUnseen(next);
      return next;
    });
  }, [persistUnseen]);

  const pollOrders = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const { data } = await dashboardAPI.listOrders({
        page: 1,
        page_size: 25,
        ordering: ORDERING_NEWEST_FIRST,
      });
      const ids = extractOrderIds(data);
      if (!ids.length) return;

      if (!initialDoneRef.current) {
        ids.forEach((id) => knownIdsRef.current.add(id));
        persistKnown();
        initialDoneRef.current = true;
        return;
      }

      const fresh = ids.filter((id) => !knownIdsRef.current.has(id));
      if (!fresh.length) return;

      fresh.forEach((id) => knownIdsRef.current.add(id));
      persistKnown();

      if (onOrdersPageRef.current) {
        playNewOrderSound();
        return;
      }

      setUnseenIds((prev) => {
        const next = new Set(prev);
        fresh.forEach((id) => next.add(id));
        persistUnseen(next);
        return next;
      });
      playNewOrderSound();
    } catch {
      /* silencieux */
    }
  }, [persistKnown, persistUnseen]);

  useEffect(() => {
    pollOrders();
    const id = window.setInterval(pollOrders, POLL_INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") pollOrders();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pollOrders]);

  useEffect(() => {
    if (onOrdersPage) markOrdersSeen();
  }, [onOrdersPage, markOrdersSeen]);

  useEffect(() => {
    const unlock = () => unlockNotificationSound();
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const value = useMemo(
    () => ({
      newOrdersCount: unseenIds.size,
      markOrdersSeen,
    }),
    [unseenIds, markOrdersSeen],
  );

  return (
    <NewOrdersContext.Provider value={value}>
      {children}
    </NewOrdersContext.Provider>
  );
}

export function useNewOrders() {
  const ctx = useContext(NewOrdersContext);
  if (!ctx) {
    throw new Error("useNewOrders doit être utilisé dans un NewOrdersProvider");
  }
  return ctx;
}
