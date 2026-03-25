import { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../api/dashboard.api";

const USE_MOCK = false; // ← Branché sur la vraie API v3


const normalizeStats = (raw) => ({
  // ── StatCards ─────────────────────────────────────────────
  total_orders: raw.total_orders ?? 0,
  total_revenue: raw.turnover ?? 0,
  products_sold: raw.products_sold ?? 0,
  average_basket: raw.average_basket ?? 0,

  // Champs non fournis par cette route — valeurs par défaut
  total_clients: raw.total_clients ?? null,
  pending_orders: raw.pending_orders ?? null,
  delivered_orders: raw.delivered_orders ?? null,
  cancelled_orders: raw.cancelled_orders ?? null,

  sales_chart: (raw.weekly_revenue ?? []).map((d) => ({
    date: d.day,
    orders: d.total_orders,
    revenue: d.revenue,
  })),

  top_cities: (raw.mains_top_cities ?? []).map((c) => ({
    city: c.city,
    orders: c.total_orders,
    total: c.total_revenue,
  })),

  // ── Sales by category (pour ReportsPage) ─────────────────
  sales_by_category: raw.sales_by_category ?? [],

  // ── Commandes récentes — non disponibles sur cet endpoint
  recent_orders: raw.recent_orders ?? [],

  // ── Stock faible — non disponible sur cet endpoint
  low_stock: raw.low_stock ?? [],
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
