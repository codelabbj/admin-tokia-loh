import { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../api/dashboard.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import { apiCache } from "../utils/apiCache";
import { fetchAllPaginatedPages } from "../utils/fetchAllPages";

export const ORDERS_LIST_PAGE_SIZE = 20;
const ORDERS_SEARCH_FETCH_PAGE_SIZE = 100;

/**
 * Extrait la latitude depuis un lien Google Maps
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

const unwrapApiData = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  if ("data" in payload && payload.data != null) return payload.data;
  return payload;
};

const extractResults = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

/**
 * Normalise une commande depuis /shop/dashboard/orders/
 */
/** Ville de livraison côté commande (aligné filtrage VilleDetailPage). */
export function getOrderDeliveryCity(order) {
  const raw = order?.client?.city ?? order?.city_name ?? "";
  return String(raw ?? "").trim();
}

/**
 * Frais de livraison affichés : `delivery_price` de la ville enregistrée dont le
 * nom correspond à la ville de livraison de la commande. Sinon frais API (`fallbackFee`).
 */
export function resolveDeliveryFeeFromVilles(order, villes, fallbackFee) {
  const fallback = Number(fallbackFee ?? 0);
  if (!Array.isArray(villes) || villes.length === 0) return fallback;
  const label = getOrderDeliveryCity(order);
  if (!label) return fallback;
  const match = villes.find(
    (v) => String(v.name ?? "").toLowerCase() === label.toLowerCase(),
  );
  if (!match) return fallback;
  return Number(match.delivery_price ?? 0);
}

export function normalizeOrder(raw) {
  const refRaw = raw?.order_reference;
  const reference =
    refRaw && String(refRaw).trim()
      ? String(refRaw)
      : raw?.id
        ? String(raw.id).slice(0, 8)
        : "—";

  return {
    id: raw.id,
    date: raw.created_at ?? null,
    status: raw.status,
    total: raw.total ?? "0.00",
    delivery_fee: raw.delivery_fee ?? 0,
    note: raw.specific_information ?? "",
    cancellation_reason: raw.cancellation_reason ?? null,
    delivery_address: raw.delivery_address ?? null,
    reference,

    items: (raw.items ?? []).map((i) => {
      let variants = [];
      if (i.variant_hierarchy) {
        let current = i.variant_hierarchy;
        while (current) {
          variants.unshift({
            key: current.key || "Déclinaison",
            name: current.name,
          });
          current = current.parent;
        }
      } else if (i.variant) {
        variants.push({
          key: i.variant_key || "Déclinaison",
          name: i.variant,
        });
      }

      return {
        name:
          typeof i.product === "string"
            ? i.product
            : i.product?.name ?? i.name ?? "Produit",
        image: i.image ?? null,
        quantity: i.quantity,
        unitPrice: i.price,
        variants,
      };
    }),

    client: {
      id: raw.client ?? null,
      fullName: raw.client_details
        ? `${raw.client_details.first_name ?? ""} ${raw.client_details.last_name ?? ""}`.trim()
        : (raw.client_name ?? ""),

      firstName: raw.client_details?.first_name ?? "",
      lastName: raw.client_details?.last_name ?? "",

      city: raw.client_details?.city ?? raw.client_city ?? "",
      phone: raw.client_details?.phone ?? raw.client_phone ?? "",

      address: raw.delivery_address ?? "",

      latitude: extractLat(raw.delivery_address),
      longitude: extractLng(raw.delivery_address),
    },
  };
}

function applyStatsAndNormalizeList(statsData, list) {
  const summaryMap = {};
  (statsData.orders ?? []).forEach((o) => {
    summaryMap[o.id] = o;
  });
  return list.map((order) => {
    const summary = summaryMap[order.id] ?? {};
    return normalizeOrder({
      ...order,
      client_name: summary.client_name ?? "",
      client_city: summary.client_city ?? "",
      created_at: summary.created_at ?? order.created_at,
    });
  });
}

/**
 * useOrders
 *
 * @param {{ clientId?: string | null, loadAllPages?: boolean }} options
 *   - clientId : historique d'un client
 *   - loadAllPages : toutes les pages fusionnées (ex. filtre par ville)
 *   - défaut : liste paginée (page + page_size) pour la page Commandes
 */
export const useOrders = (options = {}) => {
  const { clientId = null, loadAllPages = false } = options;

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!clientId && !loadAllPages) setPage(1);
  }, [searchDebounced, clientId, loadAllPages]);

  const isSearchMode =
    !clientId && !loadAllPages && searchDebounced.length > 0;

  const totalPages = isSearchMode
    ? 1
    : Math.max(1, Math.ceil(totalCount / ORDERS_LIST_PAGE_SIZE));

  const fetchClientHistoryCb = useCallback(async (cId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await dashboardAPI.getClientOrderHistory(cId, {
        ordering: ORDERING_NEWEST_FIRST,
      });
      const list = extractResults(data);
      setOrders(list.map(normalizeOrder));
    } catch (err) {
      setError(err.message ?? "Erreur historique client");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPaginatedCb = useCallback(async ({ force = false } = {}) => {
    const cacheKey = `orders:page:${page}:search:${searchDebounced}`;
    if (!force && !isSearchMode) {
      const cached = apiCache.get(cacheKey);
      if (cached) {
        setOrders(cached.orders);
        setStats(cached.stats);
        setTotalCount(cached.totalCount);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const statsRes = await dashboardAPI.listOrdersStats();
      const statsData = unwrapApiData(statsRes.data) ?? {};
      const normalizedStats = {
        total: statsData.total_orders ?? 0,
        in_progress: statsData.in_progress_orders ?? 0,
        delivered: statsData.delivered_orders ?? 0,
        canceled: statsData.canceled_orders ?? 0,
      };
      setStats(normalizedStats);

      let list;
      let count;

      if (isSearchMode) {
        const { items, totalCount: apiTotal } = await fetchAllPaginatedPages(
          async (pageNum, pageSize) => {
            const res = await dashboardAPI.listOrders({
              page: pageNum,
              page_size: pageSize,
              search: searchDebounced,
              ordering: ORDERING_NEWEST_FIRST,
            });
            return unwrapApiData(res.data) ?? {};
          },
          {
            pageSize: ORDERS_SEARCH_FETCH_PAGE_SIZE,
            extractList: extractResults,
          },
        );
        list = items;
        count = apiTotal;
      } else {
        const ordersRes = await dashboardAPI.listOrders({
          page,
          page_size: ORDERS_LIST_PAGE_SIZE,
          ordering: ORDERING_NEWEST_FIRST,
        });
        const ordersData = unwrapApiData(ordersRes.data) ?? {};
        list = extractResults(ordersData);
        count =
          typeof ordersData.count === "number" ? ordersData.count : list.length;
      }

      const normalizedOrders = applyStatsAndNormalizeList(statsData, list);
      setTotalCount(count);
      setOrders(normalizedOrders);

      if (!isSearchMode) {
        apiCache.set(cacheKey, {
          orders: normalizedOrders,
          stats: normalizedStats,
          totalCount: count,
        });
      }
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, isSearchMode, reloadNonce]);

  const fetchAllMergedCb = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await dashboardAPI.listOrdersStats();
      const statsData = unwrapApiData(statsRes.data) ?? {};
      setStats({
        total: statsData.total_orders ?? 0,
        in_progress: statsData.in_progress_orders ?? 0,
        delivered: statsData.delivered_orders ?? 0,
        canceled: statsData.canceled_orders ?? 0,
      });

      let merged = [];
      let pageNum = 1;
      for (;;) {
        const { data } = await dashboardAPI.listOrders({
          page: pageNum,
          page_size: ORDERS_LIST_PAGE_SIZE,
          ordering: ORDERING_NEWEST_FIRST,
        });
        const pageData = unwrapApiData(data) ?? {};
        const list = extractResults(pageData);
        merged = merged.concat(list);
        if (!pageData.next || list.length === 0) break;
        pageNum += 1;
      }

      setTotalCount(merged.length);
      setOrders(applyStatsAndNormalizeList(statsData, merged));
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!clientId) return;
    fetchClientHistoryCb(clientId);
  }, [clientId, fetchClientHistoryCb]);

  useEffect(() => {
    if (clientId || !loadAllPages) return;
    fetchAllMergedCb();
  }, [clientId, loadAllPages, fetchAllMergedCb]);

  useEffect(() => {
    if (clientId || loadAllPages) return;
    fetchPaginatedCb();
  }, [clientId, loadAllPages, page, fetchPaginatedCb]);

  const refetch = useCallback(async () => {
    if (clientId) return fetchClientHistoryCb(clientId);
    if (loadAllPages) return fetchAllMergedCb();
    return fetchPaginatedCb();
  }, [
    clientId,
    loadAllPages,
    fetchClientHistoryCb,
    fetchAllMergedCb,
    fetchPaginatedCb,
  ]);

  const updateStatus = async (orderId, newStatus, cancellationReason) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, cancellation_reason: newStatus === 'canceled' ? (cancellationReason ?? null) : o.cancellation_reason } : o)),
    );
    try {
      await dashboardAPI.updateOrderStatus(orderId, newStatus, cancellationReason);
      apiCache.invalidatePrefix('orders:');
      await refetch();
    } catch (err) {
      setError(err.message ?? "Erreur mise à jour statut");
      apiCache.invalidatePrefix('orders:');
      await refetch();
    }
  };

  const paginatedMeta =
    !clientId && !loadAllPages
      ? {
          page,
          setPage,
          totalPages,
          totalCount,
          pageSize: ORDERS_LIST_PAGE_SIZE,
          search,
          setSearch,
          isSearchMode,
        }
      : {
          page: undefined,
          setPage: undefined,
          totalPages: undefined,
          totalCount: undefined,
          pageSize: ORDERS_LIST_PAGE_SIZE,
          search: undefined,
          setSearch: undefined,
          isSearchMode: false,
        };

  return {
    orders,
    stats,
    loading,
    error,
    updateStatus,
    refetch,
    ...paginatedMeta,
  };
};
