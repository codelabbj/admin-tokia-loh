import api from "./client";

/**
 * DashboardAPI — v3
 *
 * Les stats sont réparties sur plusieurs endpoints dédiés :
 *
 * GET /shop/dashboard-rapport/      ← stats globales (CA, commandes, top cities...)
 * GET /shop/dashboard-product/      ← stats produits
 * GET /shop/dashboard-categories/   ← stats catégories
 * GET /shop/dashboard-orders/       ← liste commandes backoffice
 * GET /shop/dashboard-clients       ← stats clients
 * GET /shop/dashboard-cities/       ← stats villes
 * GET /shop/dashboard-pubs/         ← stats publicités
 * GET /shop/dashboard-pubs-list/    ← liste publicités backoffice
 * GET /shop/dashboard-notifications/← notifications backoffice
 *
 * GET  /shop/dashboard?period=today|this_week|this_month
 * GET  /shop/dashboard?start_date=DD-MM-YYYY&end_date=DD-MM-YYYY
 *
 * GET  /shop/dashboard/orders/client/:id/history/
 * PUT  /shop/dashboard/orders/:id/status/   body: { status: "canceled" }
 * GET  /shop/dashboard/orders/:id/invoice/
 * GET  /shop/generate-report-pdf
 */
class DashboardAPI {
  /**
   * Stats globales du rapport.
   * Retourne : { turnover, total_orders, products_sold, average_basket,
   *              sales_by_category, weekly_revenue, monthly_sales_by_week, mains_top_cities }
   */
  getStats(params = {}) {
    // params : { period?, start_date?, end_date? }
    if (Object.keys(params).length > 0) {
      return api.get("/shop/dashboard", { params });
    }
    return api.get("/shop/dashboard-rapport/");
  }

  /** Stats produits. */
  getProductStats() {
    return api.get("/shop/dashboard-product/");
  }

  /** Stats catégories. */
  getCategoryStats() {
    return api.get("/shop/dashboard-categories/");
  }

  /**
   * Stats commandes + liste résumée.
   * /shop/dashboard-orders/
   * Retourne : { success, total_orders, in_progress_orders, delivered_orders,
   *              canceled_orders, orders: [{ id, client_name, client_city, status, created_at }] }
   */
  listOrdersStats() {
    return api.get("/shop/dashboard-orders/");
  }

  /**
   * Liste complète des commandes avec items et total.
   * /shop/dashboard/orders/
   * Retourne : { count, total_pages, results: [{ id, client, status, total, items, ... }] }
   * @param {{ status?, search?, ordering?, page? }} params
   */
  listOrders(params = {}) {
    return api.get("/shop/dashboard/orders/", { params });
  }

  /**
   * Met à jour le statut d'une commande.
   * ⚠️  v3 : méthode PUT (était PATCH en v2)
   * ⚠️  v3 : statut "canceled" (un seul l)
   * @param {string} id
   * @param {string} status — ex: 'canceled', 'delivered', 'in_progress'
   */
  updateOrderStatus(id, status) {
    return api.put(`/shop/dashboard/orders/${id}/status/`, { status });
  }

  /** Facture d'une commande. */
  getOrderInvoice(id) {
    return api.get(`/shop/dashboard/orders/${id}/invoice/`);
  }

  /** Historique des commandes d'un client. */
  getClientOrderHistory(clientId) {
    return api.get(`/shop/dashboard/orders/client/${clientId}/history/`);
  }

  /** Stats clients. */
  getClientStats() {
    return api.get("/shop/dashboard-clients");
  }

  /** Stats villes. */
  getCityStats() {
    return api.get("/shop/dashboard-cities/");
  }

  /** Stats & liste publicités. */
  getPubStats() {
    return api.get("/shop/dashboard-pubs/");
  }

  getPubList() {
    return api.get("/shop/dashboard-pubs-list/");
  }

  /** Notifications backoffice. */
  getNotifications() {
    return api.get("/shop/dashboard-notifications/");
  }

  /** Rapport PDF. */
  generateReportPdf() {
    return api.get("/shop/generate-report-pdf", { responseType: "blob" });
  }

  /**
   * Stats rapport.
   * Modes :
   *   { period: 'today' | 'this_week' | 'this_month' | 'all' }
   *   { startDate: 'DD-MM-YYYY', endDate: 'DD-MM-YYYY' }
   */
  getReport({ period, startDate, endDate } = {}) {
    const params = {};
    if (startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    } else if (period) {
      params.period = period;
    }
    return api.get("/shop/dashboard-rapport/", { params });
  }

  /** Top produits vendus */
  getTopProducts() {
    return api.get("/shop/dashboard-product/");
  }

  /** Stats commandes (total, in_progress, delivered, canceled) */
  listOrdersStats() {
    return api.get("/shop/dashboard-orders/");
  }

  /** Liste complète des commandes paginée */
  listOrders(params = {}) {
    return api.get("/shop/dashboard/orders/", { params });
  }

  /** Historique commandes d'un client */
  getClientOrderHistory(clientId) {
    return api.get(`/shop/dashboard/orders/client/${clientId}/history/`);
  }

  /** Mise à jour du statut d'une commande */
  updateOrderStatus(orderId, status) {
    return api.put(`/shop/dashboard/orders/${orderId}/status/`, { status });
  }
}

export const dashboardAPI = new DashboardAPI();
