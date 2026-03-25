import { useState, useCallback } from "react";
import { dashboardAPI } from "../api/dashboard.api";

const PERIOD_MAP = {
  day: "today",
  week: "this_week",
  month: "this_month",
};

const toApiDate = (isoDate) => {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
};

/**
 * Normalise un produit depuis r.top_products.
 * Structure API : { product_name, total_quantity, total_revenue }
 */
const normalizeProduct = (raw, index) => ({
  rank: index + 1,
  name: raw.product_name ?? raw.name ?? "—", // product_name en priorité
  category: raw.category ?? raw.category_name ?? "—",
  qty: raw.total_quantity ?? raw.quantity ?? 0,
  ca: raw.total_revenue ?? raw.revenue ?? 0,
  trend: raw.trend ?? "neutral",
});

export const useReports = () => {
  const [report, setReport] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async ({ period, dateFrom, dateTo } = {}) => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Un seul appel — top_products est inclus dans le rapport
      const reportRes = await dashboardAPI.getReport({
        period: period ? PERIOD_MAP[period] : undefined,
        startDate: dateFrom ? toApiDate(dateFrom) : undefined,
        endDate: dateTo ? toApiDate(dateTo) : undefined,
      });

      const r = reportRes.data;

      setReport({
        turnover: r.turnover ?? 0,
        totalOrders: r.total_orders ?? 0,
        productsSold: r.products_sold ?? 0,
        averageBasket: r.average_basket ?? 0,

        salesByCategory: (r.sales_by_category ?? []).map((c) => ({
          category: c.category_name,
          ca: c.total_revenue,
          orders: c.total_quantity,
        })),

        weeklyRevenue: (r.weekly_revenue ?? []).map((w) => ({
          day: w.day,
          revenue: w.revenue,
          orders: w.total_orders,
        })),

        monthlySalesByWeek: (r.monthly_sales_by_week ?? []).map((w) => ({
          week: w.week,
          revenue: w.total_revenue,
          orders: w.total_orders,
        })),

        topCities: (r.mains_top_cities ?? []).map((c) => ({
          city: c.city,
          orders: c.total_orders,
          revenue: c.total_revenue,
        })),
      });

      // ✅ top_products vient directement de r, plus de getTopProducts()
      const rows = r.top_products ?? [];
      setProducts(rows.map(normalizeProduct));
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement du rapport");
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, products, loading, error, fetch };
};
