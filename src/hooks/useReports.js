import { useState, useCallback } from "react";
import { dashboardAPI } from "../api/dashboard.api";

// ── Mapping période UI → valeur API ──────────────────────────
const PERIOD_MAP = {
  day: "today",
  week: "this_week",
  month: "this_month",
};

/**
 * Convertit une date HTML (YYYY-MM-DD) au format API (DD-MM-YYYY).
 */
const toApiDate = (isoDate) => {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
};

/**
 * Normalise un produit depuis /shop/dashboard-product/.
 * Structure supposée :
 *   { name, category, total_quantity, total_revenue, trend? }
 * On adaptera si le backend envoie autre chose.
 */
const normalizeProduct = (raw, index) => ({
  rank: index + 1,
  name: raw.name ?? raw.product_name ?? "—",
  category: raw.category ?? raw.category_name ?? "—",
  qty: raw.total_quantity ?? raw.quantity ?? 0,
  ca: raw.total_revenue ?? raw.revenue ?? 0,
  trend: raw.trend ?? "neutral",
});

/**
 * useReports
 *
 * Charge les données du rapport depuis l'API.
 *
 * Usage :
 *   const { report, products, loading, error, fetch } = useReports();
 *   fetch({ period: 'week' });
 *   fetch({ dateFrom: '2026-03-01', dateTo: '2026-03-15' });
 */
export const useReports = () => {
  const [report, setReport] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async ({ period, dateFrom, dateTo } = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Appels parallèles
      const [reportRes, productsRes] = await Promise.all([
        dashboardAPI.getReport({
          period: period ? PERIOD_MAP[period] : undefined,
          startDate: dateFrom ? toApiDate(dateFrom) : undefined,
          endDate: dateTo ? toApiDate(dateTo) : undefined,
        }),
        dashboardAPI.getTopProducts(),
      ]);

      const r = reportRes.data;
      setReport({
        turnover: r.turnover ?? 0,
        totalOrders: r.total_orders ?? 0,
        productsSold: r.products_sold ?? 0,
        averageBasket: r.average_basket ?? 0,

        // Ventes par catégorie → pour SalesByCategoryChart
        salesByCategory: (r.sales_by_category ?? []).map((c) => ({
          category: c.category_name,
          ca: c.total_revenue,
          orders: c.total_quantity,
        })),

        // Revenus hebdomadaires → pour SalesChart
        weeklyRevenue: (r.weekly_revenue ?? []).map((w) => ({
          day: w.day,
          revenue: w.revenue,
          orders: w.total_orders,
        })),

        // Revenus mensuels par semaine
        monthlySalesByWeek: (r.monthly_sales_by_week ?? []).map((w) => ({
          week: w.week,
          revenue: w.total_revenue,
          orders: w.total_orders,
        })),

        // Top villes
        topCities: (r.mains_top_cities ?? []).map((c) => ({
          city: c.city,
          orders: c.total_orders,
          revenue: c.total_revenue,
        })),
      });

      // Produits depuis /dashboard-product/
      const pd = productsRes.data;
      const rows = Array.isArray(pd) ? pd : (pd?.data ?? pd?.results ?? []);
      setProducts(rows.map(normalizeProduct));
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement du rapport");
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, products, loading, error, fetch };
};
