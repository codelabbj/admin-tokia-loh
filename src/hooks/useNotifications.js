import { useState, useEffect, useCallback } from "react";
import { notificationsAPI } from "../api/notifications.api";

/**
 * Mappe notification_type API → type visuel
 * Basé sur les vrais types observés dans la réponse v4
 */
const TYPE_MAP = {
  order_confirmed: "Commande",
  order_canceled: "Annulation",
  new_client: "Client",
  low_stock: "Stock",
  other: "Autre",
};

const normalizeNotif = (raw) => ({
  id: raw.id,
  title: raw.title ?? "",
  message: raw.content ?? "",
  type: TYPE_MAP[raw.notification_type] ?? "Autre",
  date: raw.created_at ?? null,
  // ⚠️  v4 : champ "is_read" (pas "read")
  read: raw.is_read ?? false,
});

/**
 * useNotifications — branché sur la vraie API v4
 *
 * - Lecture de is_read depuis l'API (pas localStorage)
 * - markRead    → POST /dashboard-notifications/:id/read/
 * - markAllRead → POST /dashboard-notifications/read-all/
 * - deleteNotif → DELETE /dashboard-notifications/:id/remove/
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPage = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const { data } = await notificationsAPI.list({ page });

      // Réponse API v4 :
      // { count, total_pages, current_page, next, previous,
      //   results: { success, message, data: [...] } }
      const rows = data?.results?.data ?? [];
      const normalized = rows.map(normalizeNotif);

      setNotifications((prev) =>
        append ? [...prev, ...normalized] : normalized,
      );
      setHasMore(!!data?.next);
      setTotalCount(data?.count ?? 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const loadMore = () => {
    if (!loadingMore && hasMore) fetchPage(currentPage + 1, true);
  };

  // ── Marquer une notif comme lue ───────────────────────────
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

  // ── Tout marquer comme lu ─────────────────────────────────
  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsAPI.markAllRead();
    } catch {
      fetchPage(1); // Rollback complet
    }
  };

  // ── Supprimer ─────────────────────────────────────────────
  const deleteNotif = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1)); // On décrémente le total

    try {
      await notificationsAPI.delete(id);
    } catch (err) {
      console.error("Erreur suppression:", err);
      fetchPage(1);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
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
};
