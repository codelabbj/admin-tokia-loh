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

  /**
   * Envoie une notification push en masse.
   * @param {{ title: string, content?: string, notification_type?: string, client_ids?: string[] }} data
   *   client_ids absent → tous les clients actifs (broadcast).
   */
  sendPush(data) {
    return api.post("/shop/dashboard-notifications/send/", data);
  }
}

export const notificationsAPI = new NotificationsAPI();
