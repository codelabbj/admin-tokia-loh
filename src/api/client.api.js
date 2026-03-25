import api from "./client";

/**
 * ClientsAPI — gestion des clients depuis le backoffice.
 *
 * GET  /accounts/clients/                    ?search&page
 * GET  /accounts/clients/:id/
 * GET  /accounts/clients/:id/verify-client/
 * POST /accounts/clients/:id/deactivate/     ← nouveau en v2
 */
class ClientsAPI {
  /**
   * Liste les clients avec recherche et pagination.
   * @param {{ search?: string, page?: number }} params
   */
  list(params = {}) {
    return api.get("/accounts/clients/", { params });
  }

  /**
   * Détail d'un client.
   * @param {string} id — UUID
   */
  detail(id) {
    return api.get(`/accounts/clients/${id}/`);
  }

  /**
   * Vérifie le statut d'un client.
   * @param {string} id — UUID
   */
  verify(id) {
    return api.get(`/accounts/clients/${id}/verify-client/`);
  }

  /**
   * Désactive un client.
   * ⚠️  v2 : nouvel endpoint
   * @param {string} id — UUID
   */
  deactivate(id) {
    return api.post(`/accounts/clients/${id}/deactivate/`);
  }
}

export const clientsAPI = new ClientsAPI();
