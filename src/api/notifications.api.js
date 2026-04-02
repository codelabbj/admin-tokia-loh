import api from "./client";

/**
 * NotificationsAPI — v4
 *
 * GET    /shop/dashboard-notifications/          ?page=N&ordering=-created_at
 * POST   /shop/dashboard-notifications/:id/read/
 * POST   /shop/dashboard-notifications/read-all/
 * DELETE /shop/dashboard-notifications/:id/remove/
 */
class NotificationsAPI {
  list(params = {}) {
    return api.get("/shop/dashboard-notifications/", { params });
  }

  markRead(id) {
    return api.get(`/shop/dashboard-notifications/${id}/read/`);
  }

  markAllRead() {
    return api.get("/shop/dashboard-notifications/read-all/");
  }

  delete(id) {
    return api.delete(`/shop/dashboard-notifications/${id}/remove/`);
  }
}

export const notificationsAPI = new NotificationsAPI();
