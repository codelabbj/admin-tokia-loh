import { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../api/dashboard.api";

const USE_MOCK = false; // ← Branché sur la vraie API v3

const normalizeStats = (raw) => ({
  total_orders: raw.total_orders ?? 0,
  total_revenue: raw.turnover ?? 0,
  products_sold: raw.products_sold ?? 0,
  average_basket: raw.average_basket ?? 0,

  total_clients: raw.client_count ?? 0,
  pending_orders: raw.in_progress_orders ?? 0,
  delivered_orders: raw.delivered_orders ?? 0,
  cancelled_orders: raw.canceled_orders ?? 0,

  sales_chart: (raw.weekly_revenue ?? []).map((d) => ({
    date: d.day,
    orders: d.total_orders,
    revenue: d.revenue,
  })),

  top_cities: (raw.top_cities ?? []).map((c) => ({
    city: c.city,
    orders: c.total_orders,
    total: c.total_amount,
  })),

  recent_orders: (raw.latest_order ?? []).map((o) => ({
    id: o.id,
    reference: o.order_reference,
    total: o.total,
    client: o.client_name,
    city: o.client_city,
    status: o.status,
    created_at: o.created_at,
  })),

  recent_orders_list: raw.latest_order_list ?? [],

  low_stock: (raw.low_stock_products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
    price: p.price,
    category: p.category__name,
  })),
});

export const useDashboard = (params = {}) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await dashboardAPI.getStats(params);
      setStats(normalizeStats(data));
    } catch (err) {
      setError(err.message ?? "Erreur chargement dashboard");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
};
