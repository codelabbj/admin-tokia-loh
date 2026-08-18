import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router";
import { notificationsAPI } from "../api/notifications.api";
import { dashboardAPI } from "../api/dashboard.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import { useToast } from "../components/ui/ToastProvider";
import {
  extractNotificationTargets,
  getNotificationNavigatePath,
} from "../utils/notificationTargets";
import {
  playNewOrderSound,
  unlockNotificationSound,
} from "../utils/playNewOrderSound";

/** Rafraîchissement API — quasi temps réel sans WebSocket */
const POLL_INTERVAL_MS = 6000;
const STORAGE_KNOWN = "tokia.knownOrderIds";
const STORAGE_INCOMING = "tokia.incomingOrderIds";
const STORAGE_SEEN = "tokia.seenIncomingOrderIds";
const MAX_TRACKED_IDS = 300;

const NotificationsContext = createContext(null);

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
    sessionStorage.setItem(key, JSON.stringify([...ids].slice(0, MAX_TRACKED_IDS)));
  } catch {
    /* quota / mode privé */
  }
}

function extractOrderIds(payload) {
  const root = payload?.data ?? payload;
  const data =
    root && typeof root === "object" && "data" in root && root.data != null
      ? root.data
      : root;
  const list = Array.isArray(data)
    ? data
    : (data?.results ?? data?.orders ?? data?.data ?? []);
  if (!Array.isArray(list)) return [];
  return list.map((o) => String(o?.id)).filter(Boolean);
}

const TYPE_MAP = {
  order_confirmed: "Commande",
  order_canceled: "Annulation",
  new_client: "Client",
  low_stock: "Stock",
  other: "Autre",
};

export const isOrderNotification = (notif) =>
  notif?.type === "Commande" || notif?.notificationTypeKey === "order_confirmed";

export const normalizeNotif = (raw) => {
  const targets = extractNotificationTargets(raw);
  return {
    id: raw.id,
    title: raw.title ?? "",
    message: raw.content ?? "",
    type: TYPE_MAP[raw.notification_type] ?? "Autre",
    notificationTypeKey: raw.notification_type ?? "",
    date: raw.created_at ?? null,
    read: raw.is_read ?? false,
    ...targets,
  };
};

function toastMessageFor(notif) {
  const parts = [notif.title, notif.message].filter((s) => s && String(s).trim());
  const text = parts.join(" — ").trim();
  return text.length > 220 ? `${text.slice(0, 217)}…` : text || "Nouvelle notification";
}

export function NotificationsProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const seenNotifIdsRef = useRef(new Set());
  const initialFetchDoneRef = useRef(false);
  const knownOrderIdsRef = useRef(new Set(readIdList(STORAGE_KNOWN)));
  const seenIncomingIdsRef = useRef(new Set(readIdList(STORAGE_SEEN)));
  const incomingSeededRef = useRef(false);
  const [incomingOrderIds, setIncomingOrderIds] = useState(
    () => new Set(readIdList(STORAGE_INCOMING)),
  );
  const [ordersIncomingReady, setOrdersIncomingReady] = useState(false);

  const registerSeenIds = useCallback((normalizedList) => {
    normalizedList.forEach((n) => seenNotifIdsRef.current.add(n.id));
  }, []);

  const persistIncoming = useCallback((nextSet) => {
    writeIdList(STORAGE_INCOMING, nextSet);
  }, []);

  const addIncomingOrderIds = useCallback((ids) => {
    if (!ids?.length) return;
    setIncomingOrderIds((prev) => {
      const next = new Set(prev);
      ids.forEach((raw) => {
        const id = String(raw);
        if (!id || seenIncomingIdsRef.current.has(id)) return;
        next.add(id);
      });
      persistIncoming(next);
      return next;
    });
  }, [persistIncoming]);

  const markOrderSeen = useCallback((orderId) => {
    if (!orderId) return;
    const id = String(orderId);
    seenIncomingIdsRef.current.add(id);
    writeIdList(STORAGE_SEEN, seenIncomingIdsRef.current);
    setIncomingOrderIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      persistIncoming(next);
      return next;
    });
  }, [persistIncoming]);

  const fetchLatestOrderIds = useCallback(async () => {
    const { data } = await dashboardAPI.listOrders({
      page: 1,
      page_size: 25,
      ordering: ORDERING_NEWEST_FIRST,
    });
    return extractOrderIds(data);
  }, []);

  const syncIncomingFromLatestOrders = useCallback(async (hintCount = 0, { isInitial = false } = {}) => {
    const collect = async () => {
      const ids = await fetchLatestOrderIds();
      const known = knownOrderIdsRef.current;
      const fresh = ids.filter((id) => !known.has(id));
      return { ids, fresh };
    };

    let { ids, fresh } = await collect();
    if (!isInitial && !fresh.length && hintCount > 0) {
      await new Promise((r) => window.setTimeout(r, 900));
      ({ ids, fresh } = await collect());
    }

    const known = knownOrderIdsRef.current;
    const wasEmpty = known.size === 0;
    ids.forEach((id) => known.add(id));
    writeIdList(STORAGE_KNOWN, known);

    if (isInitial || wasEmpty) {
      if (hintCount > 0) addIncomingOrderIds(ids.slice(0, hintCount));
      return;
    }

    if (fresh.length) addIncomingOrderIds(fresh);
  }, [fetchLatestOrderIds, addIncomingOrderIds]);

  const fetchPage = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const { data } = await notificationsAPI.list({
          page,
          ordering: ORDERING_NEWEST_FIRST,
        });
        const rows = data?.results?.data ?? [];
        const normalized = rows.map(normalizeNotif);

        setNotifications((prev) =>
          append ? [...prev, ...normalized] : normalized,
        );
        setHasMore(!!data?.next);
        setTotalCount(data?.count ?? 0);
        setCurrentPage(page);

        if (append) {
          registerSeenIds(normalized);
        } else {
          registerSeenIds(normalized);
          initialFetchDoneRef.current = true;
        }
      } catch (err) {
        setError(err.message ?? "Erreur lors du chargement des notifications");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [registerSeenIds],
  );

  /** GET page 1 sans bloquer l’UI + toast sur nouvelles non lues */
  const pollLatest = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    if (!initialFetchDoneRef.current) return;
    try {
      const { data } = await notificationsAPI.list({
        page: 1,
        ordering: ORDERING_NEWEST_FIRST,
      });
      const rows = data?.results?.data ?? [];
      const newPage1 = rows.map(normalizeNotif);

      let newOrderNotifCount = 0;
      const orderIdsFromNotifs = [];
      for (const n of newPage1) {
        if (!seenNotifIdsRef.current.has(n.id)) {
          seenNotifIdsRef.current.add(n.id);
          if (!n.read && isOrderNotification(n)) {
            newOrderNotifCount += 1;
            if (n.targetOrderId) orderIdsFromNotifs.push(String(n.targetOrderId));
            playNewOrderSound();
            const path = getNotificationNavigatePath(n);
            toastRef.current.info(toastMessageFor(n), {
              duration: 6500,
              onClick: () => navigateRef.current(path),
            });
          }
        }
      }

      if (orderIdsFromNotifs.length) addIncomingOrderIds(orderIdsFromNotifs);
      if (newOrderNotifCount > 0) {
        await syncIncomingFromLatestOrders(newOrderNotifCount);
      }

      setNotifications((prev) => {
        const idsP1 = new Set(newPage1.map((x) => x.id));
        const rest = prev.filter((x) => !idsP1.has(x.id));
        return [...newPage1, ...rest];
      });
      setHasMore(!!data?.next);
      setTotalCount(data?.count ?? 0);
    } catch {
      /* silencieux : garde l’état courant */
    }
  }, [addIncomingOrderIds, syncIncomingFromLatestOrders]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    const id = window.setInterval(pollLatest, POLL_INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") pollLatest();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pollLatest]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchPage(currentPage + 1, true);
  }, [loadingMore, hasMore, currentPage, fetchPage]);

  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await notificationsAPI.markRead(id);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsAPI.markAllRead();
    } catch {
      fetchPage(1);
    }
  };

  const markBellAllRead = async () => {
    const ids = notifications
      .filter((n) => !n.read && !isOrderNotification(n))
      .map((n) => n.id);
    if (!ids.length) return;
    setNotifications((prev) =>
      prev.map((n) =>
        isOrderNotification(n) ? n : { ...n, read: true },
      ),
    );
    await Promise.all(
      ids.map((id) => notificationsAPI.markRead(id).catch(() => {})),
    );
  };

  const deleteNotif = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationsAPI.delete(id);
    } catch {
      fetchPage(1);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadOrderCount = notifications.filter(
    (n) => !n.read && isOrderNotification(n),
  ).length;
  const bellNotifications = notifications.filter((n) => !isOrderNotification(n));
  const bellUnreadCount = bellNotifications.filter((n) => !n.read).length;

  const markOrderNotificationsRead = useCallback(async () => {
    const ids = notifications
      .filter((n) => !n.read && isOrderNotification(n))
      .map((n) => n.id);
    if (!ids.length) return;
    setNotifications((prev) =>
      prev.map((n) =>
        isOrderNotification(n) ? { ...n, read: true } : n,
      ),
    );
    await Promise.all(
      ids.map((id) => notificationsAPI.markRead(id).catch(() => {})),
    );
  }, [notifications]);

  useEffect(() => {
    if (loading || incomingSeededRef.current) return;
    incomingSeededRef.current = true;
    const unreadOrderNotifs = notifications.filter(
      (n) => !n.read && isOrderNotification(n),
    );
    const idsFromNotifs = unreadOrderNotifs
      .map((n) => n.targetOrderId)
      .filter(Boolean)
      .map(String);

    (async () => {
      try {
        if (idsFromNotifs.length) addIncomingOrderIds(idsFromNotifs);
        await syncIncomingFromLatestOrders(unreadOrderNotifs.length, { isInitial: true });
      } finally {
        setOrdersIncomingReady(true);
      }
    })();
  }, [loading, notifications, addIncomingOrderIds, syncIncomingFromLatestOrders]);

  useEffect(() => {
    if (!ordersIncomingReady) return;
    if (location.pathname.startsWith("/orders")) {
      markOrderNotificationsRead();
    }
  }, [location.pathname, markOrderNotificationsRead, ordersIncomingReady]);

  useEffect(() => {
    const unlock = () => unlockNotificationSound();
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const value = {
    notifications,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadMore,
    markRead,
    markAllRead,
    markBellAllRead,
    deleteNotif,
    unreadCount,
    unreadOrderCount,
    bellNotifications,
    bellUnreadCount,
    markOrderNotificationsRead,
    incomingOrderIds,
    incomingCount: incomingOrderIds.size,
    isIncomingOrder: (orderId) => incomingOrderIds.has(String(orderId ?? "")),
    markOrderSeen,
    refetch: () => fetchPage(1),
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications doit être utilisé dans un NotificationsProvider",
    );
  }
  return ctx;
}
