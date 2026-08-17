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
 * Normalise une commande livrée depuis dashboard-delivered-orders.
 * Structure API :
 * {
 *   order_id, order_reference, client_name, created_at,
 *   total, total_cost, total_profit,
 *   items: [{ product_name, product_image, quantity, price, supplier_price, profit }]
 * }
 */
const normalizeDeliveredOrder = (raw) => ({
  id: raw.order_id,
  reference: raw.order_reference ?? "—",
  clientName: raw.client_name ?? "—",
  date: raw.created_at ?? null,
  total: Number(raw.total ?? 0),
  totalCost: raw.total_cost != null ? Number(raw.total_cost) : null,
  totalProfit: raw.total_profit != null ? Number(raw.total_profit) : null,
  items: (raw.items ?? []).map((item) => ({
    productName: item.product_name ?? "—",
    productImage: item.product_image ?? null,
    quantity: item.quantity ?? 0,
    price: Number(item.price ?? 0),
    supplierPrice: item.supplier_price != null ? Number(item.supplier_price) : null,
    profit: item.profit != null ? Number(item.profit) : null,
  })),
});

export const useReports = () => {
  const [report, setReport] = useState(null);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async ({ period, dateFrom, dateTo } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const periodParam = period ? PERIOD_MAP[period] : undefined;
      const startDate = dateFrom ? toApiDate(dateFrom) : undefined;
      const endDate = dateTo ? toApiDate(dateTo) : undefined;

      const deliveredParams = startDate && endDate
        ? { start_date: startDate, end_date: endDate }
        : periodParam ? { period: periodParam } : {};

      // Appels en parallèle : rapport global + commandes livrées
      const [reportRes, deliveredRes] = await Promise.all([
        dashboardAPI.getReport({ period: periodParam, startDate, endDate }),
        dashboardAPI.getDeliveredOrders(deliveredParams),
      ]);

      const r = reportRes.data;
      const d = deliveredRes.data;

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

      setDeliveredOrders((d.orders ?? []).map(normalizeDeliveredOrder));
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement du rapport");
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, deliveredOrders, loading, error, fetch };
};
