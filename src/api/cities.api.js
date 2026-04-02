import api from "./client";

/**
 * CitiesAPI — gestion des villes de livraison.
 * ⚠️  Nouveau en v2 — n'existait pas en v1.
 *
 * GET  /accounts/cities/
 * POST /accounts/cities/
 * GET  /accounts/cities/:id/
 *
 * Structure d'une ville :
 * {
 *   name           : string
 *   delivery_price : number  (frais de livraison en FCFA)
 * }
 */
class CitiesAPI {
  /**
   * Liste les villes.
   * @param {{ ordering?: string }} params — ex. '-created_at'
   */
  list(params = {}) {
    return api.get("/accounts/cities/", { params });
  }

  /**
   * Crée une ville.
   * @param {{ name: string, delivery_price: number }} data
   */
  create(data) {
    return api.post("/accounts/cities/", data);
  }

  /**
   * Détail d'une ville.
   * @param {string} id — UUID
   */
  detail(id) {
    return api.get(`/accounts/cities/${id}/`);
  }

  /**
   * Modifie une ville.
   * @param {string} id — UUID
   * @param {{ name?: string, delivery_price?: number }} data
   */
  update(id, data) {
    return api.patch(`/accounts/cities/${id}/`, data);
  }

  /**
   * Supprime une ville.
   * @param {string} id — UUID
   */
  delete(id) {
    return api.delete(`/accounts/cities/${id}/`);
  }
}

export const citiesAPI = new CitiesAPI();
