import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router";
import { notificationsAPI } from "../api/notifications.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import { useToast } from "../components/ui/ToastProvider";
import {
  extractNotificationTargets,
  getNotificationNavigatePath,
} from "../utils/notificationTargets";

/** Rafraîchissement API — quasi temps réel sans WebSocket */
const POLL_INTERVAL_MS = 6000;

const NotificationsContext = createContext(null);

const TYPE_MAP = {
  order_confirmed: "Commande",
  order_canceled: "Annulation",
  new_client: "Client",
  low_stock: "Stock",
  other: "Autre",
};

export const normalizeNotif = (raw) => ({
  id: raw.id,
  title: raw.title ?? "",
  message: raw.content ?? "",
  type: TYPE_MAP[raw.notification_type] ?? "Autre",
  date: raw.created_at ?? null,
  read: raw.is_read ?? false,
});

function toastMessageFor(notif) {
  const parts = [notif.title, notif.message].filter((s) => s && String(s).trim());
  const text = parts.join(" — ").trim();
  return text.length > 220 ? `${text.slice(0, 217)}…` : text || "Nouvelle notification";
}

export function NotificationsProvider({ children }) {
  const navigate = useNavigate();
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

  const registerSeenIds = useCallback((normalizedList) => {
    normalizedList.forEach((n) => seenNotifIdsRef.current.add(n.id));
  }, []);

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

      for (const n of newPage1) {
        if (!seenNotifIdsRef.current.has(n.id)) {
          seenNotifIdsRef.current.add(n.id);
          if (!n.read) {
            const path = getNotificationNavigatePath(n);
            toastRef.current.info(toastMessageFor(n), {
              duration: 6500,
              onClick: () => navigateRef.current(path),
            });
          }
        }
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
  }, []);

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
    deleteNotif,
    unreadCount,
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
