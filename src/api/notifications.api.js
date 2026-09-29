import api from "./client";

/**
 * NotificationsAPI — v6
 *
 * GET    /shop/dashboard-notifications/          ?page=N&ordering=-created_at
 * GET    /shop/dashboard-notifications/:id/read/
 * GET    /shop/dashboard-notifications/read-all/
 * DELETE /shop/dashboard-notifications/:id/remove/
 *
 * POST   /accounts/push-notifications/send/      (admin → envoi push FCM)
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
   * Envoie une notification push FCM depuis l'admin.
   *
   * @param {{ title: string, body: string, send_to_all?: boolean, client_ids?: string[] }} payload
   *   - send_to_all: true  → tous les clients actifs avec token FCM
   *   - client_ids: [...]  → uniquement ces clients
   */
  sendPush(payload) {
    return api.post("/accounts/push-notifications/send/", payload);
  }
}

export const notificationsAPI = new NotificationsAPI();
