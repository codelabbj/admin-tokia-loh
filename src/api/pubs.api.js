import api from "./client";

/**
 * PubsAPI — CRUD des publicités.
 *
 * GET    /shop/pubs/         ?search&page
 * POST   /shop/pubs/
 * GET    /shop/pubs/:id/
 * PATCH  /shop/pubs/:id/     ← v2 : PATCH (était PUT en v1)
 * DELETE /shop/pubs/:id/
 *
 * Structure :
 * {
 *   title   : string
 *   content : string
 *   image   : string (URL)
 * }
 */
class PubsAPI {
  /**
   * Liste les publicités.
   * @param {{ search?: string, page?: number, ordering?: string }} params
   */
  list(params = {}) {
    return api.get("/shop/pubs/", { params });
  }

  /**
   * Crée une publicité.
   * @param {{ title: string, content: string, image: string }} data
   */
  create(data) {
    return api.post("/shop/pubs/", data);
  }

  /**
   * Détail d'une publicité.
   * @param {string} id — UUID
   */
  detail(id) {
    return api.get(`/shop/pubs/${id}/`);
  }

  /**
   * Modifie une publicité (partiel).
   * ⚠️  v2 : PATCH (partiel) — était PUT (complet) en v1
   * @param {string} id — UUID
   * @param {{ title?: string, content?: string, image?: string }} data
   */
  update(id, data) {
    return api.patch(`/shop/pubs/${id}/`, data);
  }

  /**
   * Supprime une publicité.
   * @param {string} id — UUID
   */
  delete(id) {
    return api.delete(`/shop/pubs/${id}/`);
  }
}

export const pubsAPI = new PubsAPI();
