import { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../api/dashboard.api";

const USE_MOCK = false;

/**
 * Normalise une commande depuis /shop/dashboard/orders/
 *
 * Structure API v3 :
 * {
 *   id                   : UUID
 *   client               : UUID  (pas d'objet client complet)
 *   status               : "in_progress" | "delivered" | "canceled"
 *   delivery_address     : string | null  (lien Google Maps)
 *   specific_information : string | null  (note du client)
 *   total                : string  ("420500.00")
 *   items: [{
 *     product  : string (nom)
 *     image    : string (URL)
 *     quantity : number
 *     price    : number
 *   }]
 * }
 */
const normalizeOrder = (raw) => ({
  id: raw.id,
  date: raw.created_at ?? null,
  status: raw.status,
  total: raw.total ?? "0.00",
  delivery_fee: raw.delivery_fee ?? 0,
  note: raw.specific_information ?? "",
  delivery_address: raw.delivery_address ?? null,
  reference: raw.order_reference ?? "",

  // Items — format unifié pour OrderDetailPage
  items: (raw.items ?? []).map((i) => ({
    name: i.product,
    image: i.image ?? null,
    quantity: i.quantity,
    unitPrice: i.price,
  })),

  // Client — seul l'UUID est disponible dans cette route
  // Les infos complètes viennent de /dashboard-orders/ (client_name, city)
  client: {
    id: raw.client ?? null,
    fullName: raw.client_details
      ? `${raw.client_details.first_name} ${raw.client_details.last_name}`
      : (raw.client_name ?? ""),

    city: raw.client_details?.city ?? raw.client_city ?? "",
    phone: raw.client_details?.phone ?? raw.client_phone ?? "",

    address: raw.delivery_address ?? "",

    latitude: extractLat(raw.delivery_address),
    longitude: extractLng(raw.delivery_address),
  },
});

/**
 * Extrait la latitude depuis un lien Google Maps
 * ex: https://www.google.com/maps/search/?api=1&query=6.4367794,2.3395008
 */
const extractLat = (url) => {
  if (!url) return null;
  const match = url.match(/query=([-\d.]+),([-\d.]+)/);
  return match ? parseFloat(match[1]) : null;
};

const extractLng = (url) => {
  if (!url) return null;
  const match = url.match(/query=([-\d.]+),([-\d.]+)/);
  return match ? parseFloat(match[2]) : null;
};

/**
 * useOrders
 *
 * Utilise deux endpoints complémentaires :
 *   /shop/dashboard-orders/   → stats (total, in_progress, delivered, canceled)
 *   /shop/dashboard/orders/   → liste complète avec items et total
 *
 * Usage liste :
 *   const { orders, stats, loading, updateStatus } = useOrders();
 *
 * Usage historique client :
 *   const { orders, loading } = useOrders({ clientId: 'uuid' });
 */
export const useOrders = (options = {}) => {
  const { clientId = null } = options;

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fusion des deux endpoints ─────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Appels parallèles pour les performances
      const [statsRes, ordersRes] = await Promise.all([
        dashboardAPI.listOrdersStats(), // /shop/dashboard-orders/
        dashboardAPI.listOrders(), // /shop/dashboard/orders/
      ]);

      // Stats depuis /dashboard-orders/
      const statsData = statsRes.data;
      setStats({
        total: statsData.total_orders ?? 0,
        in_progress: statsData.in_progress_orders ?? 0,
        delivered: statsData.delivered_orders ?? 0,
        canceled: statsData.canceled_orders ?? 0,
      });

      // Liste complète depuis /dashboard/orders/
      const ordersData = ordersRes.data;
      const list = Array.isArray(ordersData)
        ? ordersData
        : (ordersData.results ?? []);

      // Enrichit chaque commande avec client_name et city depuis /dashboard-orders/
      const summaryMap = {};
      (statsData.orders ?? []).forEach((o) => {
        summaryMap[o.id] = o;
      });

      setOrders(
        list.map((order) => {
          const summary = summaryMap[order.id] ?? {};
          return normalizeOrder({
            ...order,
            client_name: summary.client_name ?? "",
            client_city: summary.client_city ?? "",
            created_at: summary.created_at ?? order.created_at,
          });
        }),
      );
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Historique d'un client ────────────────────────────────
  const fetchClientHistory = useCallback(async (cId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await dashboardAPI.getClientOrderHistory(cId);
      const list = Array.isArray(data)
        ? data
        : (data.orders ?? data.results ?? []);
      setOrders(list.map(normalizeOrder));
    } catch (err) {
      setError(err.message ?? "Erreur historique client");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientId) fetchClientHistory(clientId);
    else fetchAll();
  }, [clientId, fetchAll, fetchClientHistory]);

  // ── Mise à jour statut (optimiste + rollback) ─────────────
  const updateStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    try {
      // ⚠️  v3 : PUT, statut "canceled" (un seul l)
      await dashboardAPI.updateOrderStatus(orderId, newStatus);
      fetchAll(); // Recharge pour stats à jour
    } catch (err) {
      setError(err.message ?? "Erreur mise à jour statut");
      fetchAll(); // Rollback
    }
  };

  return {
    orders,
    stats,
    loading,
    error,
    updateStatus,
    refetch: clientId ? () => fetchClientHistory(clientId) : fetchAll,
  };
};
