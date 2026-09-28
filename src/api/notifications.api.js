import api from "./client";

/**
 * NotificationsAPI — v5
 *
 * GET    /shop/dashboard-notifications/          ?page=N&ordering=-created_at
 * POST   /shop/dashboard-notifications/:id/read/
 * POST   /shop/dashboard-notifications/read-all/
 * DELETE /shop/dashboard-notifications/:id/remove/
 *
 * GET    /accounts/push-notifications/status/    (config FCM + clients joignables)
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
   * Envoie une notification push en masse (topics FCM).
   * @param {{ title: string, content?: string, notification_type?: string, client_ids?: string[] }} data
   *   client_ids absent → tous les clients actifs (broadcast).
   */
  sendPush(data) {
    return api.post("/shop/dashboard-notifications/send/", data);
  }

  /**
   * État de la config FCM côté serveur et nombre de clients joignables.
   * → { success, data: { configured: boolean, reachable_clients: number } }
   */
  pushStatus() {
    return api.get("/accounts/push-notifications/status/");
  }

  /**
   * Envoie une notification push aux appareils enregistrés (tokens FCM).
   *
   * @param {{ title: string, body: string, send_to_all?: boolean, client_ids?: string[] }} payload
   */
  sendPushToDevices(payload) {
    return api.post("/accounts/push-notifications/send/", payload);
  }
}

export const notificationsAPI = new NotificationsAPI();
