import { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../api/dashboard.api";

/**
 * Fusionne la réponse principale /shop/dashboard/ avec /shop/dashboard-rapport/
 * (mêmes filtres). Le dashboard prime pour les listes opérationnelles ; le rapport
 * complète products_sold, average_basket, sales_by_category, séries si plus riches.
 */
const mergeDashboardPayloads = (main, rapport) => {
  const m = main ?? {};
  const r = rapport ?? {};

  const pickLongerArray = (a, b) => {
    const la = a?.length ?? 0;
    const lb = b?.length ?? 0;
    if (la >= lb && la > 0) return a;
    if (lb > 0) return b;
    return a?.length ? a : b ?? [];
  };

  return {
    turnover: m.turnover ?? r.turnover,
    total_orders: m.total_orders ?? r.total_orders,
    products_sold: m.products_sold ?? r.products_sold,
    average_basket:
      m.average_basket != null && m.average_basket !== ""
        ? m.average_basket
        : r.average_basket,

    in_progress_orders: m.in_progress_orders ?? r.in_progress_orders,
    delivered_orders: m.delivered_orders ?? r.delivered_orders,
    canceled_orders: m.canceled_orders ?? r.canceled_orders,

    client_count: m.client_count ?? r.client_count,
    new_client_count_current_week:
      m.new_client_count_current_week ?? r.new_client_count_current_week,

    weekly_revenue: pickLongerArray(m.weekly_revenue, r.weekly_revenue),
    weekly_sales: m.weekly_sales ?? r.weekly_sales,
    monthly_sales_by_week: pickLongerArray(
      m.monthly_sales_by_week,
      r.monthly_sales_by_week,
    ),
    monthly_revenue_by_week: pickLongerArray(
      m.monthly_revenue_by_week,
      r.monthly_revenue_by_week,
    ),

    top_cities: m.top_cities?.length ? m.top_cities : r.top_cities ?? [],
    mains_top_cites: m.mains_top_cites?.length
      ? m.mains_top_cites
      : r.mains_top_cites ?? [],

    latest_order: m.latest_order ?? r.latest_order ?? [],
    latest_order_list: m.latest_order_list ?? r.latest_order_list ?? [],

    low_stock_products: m.low_stock_products ?? r.low_stock_products ?? [],
    low_of_stock_count: m.low_of_stock_count ?? r.low_of_stock_count,
    total_products: m.total_products ?? r.total_products,

    sales_by_category: r.sales_by_category ?? m.sales_by_category ?? [],
  };
};

/** Série journalière : weekly_revenue ou, à défaut, weekly_sales (total_amount → revenue). */
const normalizeSalesChart = (raw) => {
  const series = raw.weekly_revenue?.length
    ? raw.weekly_revenue
    : raw.weekly_sales ?? [];
  return series.map((d) => ({
    date: d.day,
    orders: d.total_orders,
    revenue: d.revenue ?? d.total_amount ?? 0,
  }));
};

/** Agrégats par semaine (mois courant) : revenue ou total_amount. */
const normalizeMonthlyByWeek = (raw) => {
  const series = raw.monthly_revenue_by_week?.length
    ? raw.monthly_revenue_by_week
    : raw.monthly_sales_by_week ?? [];
  return series.map((w) => ({
    week: w.week,
    orders: w.total_orders ?? 0,
    revenue: Number(w.revenue ?? w.total_amount ?? 0),
  }));
};

const normalizeStats = (raw) => {
  const totalOrders = raw.total_orders ?? 0;
  const turnover = raw.turnover ?? 0;

  const averageBasket =
    raw.average_basket != null && raw.average_basket !== ""
      ? Number(raw.average_basket)
      : totalOrders > 0 && turnover != null
        ? turnover / totalOrders
        : null;

  const productsSold =
    raw.products_sold != null ? Number(raw.products_sold) : null;

  const topCitiesSource =
    raw.top_cities?.length ? raw.top_cities : raw.mains_top_cites ?? [];

  return {
    total_orders: totalOrders,
    total_revenue: turnover,
    products_sold: productsSold,

    average_basket: averageBasket,

    total_clients: raw.client_count ?? 0,
    new_clients_week: raw.new_client_count_current_week ?? null,
    pending_orders: raw.in_progress_orders ?? 0,
    delivered_orders: raw.delivered_orders ?? 0,
    cancelled_orders: raw.canceled_orders ?? 0,

    sales_chart: normalizeSalesChart(raw),

    monthly_revenue_by_week: normalizeMonthlyByWeek(raw),

    top_cities: topCitiesSource.map((c) => ({
      city: c.city,
      orders: c.total_orders,
      // dashboard/ : total_amount — dashboard-rapport (ex. Postman) : parfois total_revenue
      total: c.total_amount ?? c.total_revenue,
    })),

    recent_orders: (raw.latest_order ?? []).map((o) => ({
      id: o.id,
      reference: o.order_reference || String(o.id).slice(0, 8),
      total: o.total,
      client: o.client_name,
      city: o.client_city,
      status: o.status,
      created_at: o.created_at,
    })),

    recent_orders_list: raw.latest_order_list ?? [],

    low_stock_count: raw.low_of_stock_count ?? null,
    total_products: raw.total_products ?? null,

    low_stock: (raw.low_stock_products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      price: p.price,
      category: p.category__name,
      image: p.image ?? p.image_url ?? null,
    })),

    sales_by_category: (raw.sales_by_category ?? []).map((row) => ({
      category_name: row.category_name,
      total_quantity: row.total_quantity,
      total_revenue: row.total_revenue,
    })),
  };
};

export const useDashboard = (params = {}) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //const intParams = JSON.stringify(params);
  
  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mainRes, rapportRes] = await Promise.allSettled([
        dashboardAPI.getStats(params),
        dashboardAPI.getRapportWithDashboardParams(params),
      ]);

      if (mainRes.status === "rejected") {
        throw mainRes.reason;
      }

      const rapportData =
        rapportRes.status === "fulfilled" ? rapportRes.value.data : {};

      const merged = mergeDashboardPayloads(mainRes.value.data, rapportData);
      setStats(normalizeStats(merged));
    } catch (err) {
      setError(err.message ?? "Erreur chargement dashboard");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
};
