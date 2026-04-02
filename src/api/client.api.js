import api from "./client";

/**
 * ClientsAPI — gestion des clients depuis le backoffice.
 *
 * GET  /accounts/clients/                    ?search&page
 * GET  /accounts/clients/:id/
 * GET  /accounts/clients/:id/verify-client/
 * POST /accounts/clients/:id/deactivate/   corps JSON { is_active: boolean }
 */
class ClientsAPI {
  /**
   * Liste les clients avec recherche et pagination.
   * @param {{ search?: string, page?: number, page_size?: number, ordering?: string }} params
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
   * Active ou désactive un client (même URL, corps `is_active`).
   * @param {string} id — UUID
   * @param {boolean} isActive
   */
  setClientActive(id, isActive) {
    return api.post(`/accounts/clients/${id}/deactivate/`, {
      is_active: isActive,
    });
  }

  /** @param {string} id — UUID */
  deactivate(id) {
    return this.setClientActive(id, false);
  }

  /** @param {string} id — UUID */
  reactivate(id) {
    return this.setClientActive(id, true);
  }
}

export const clientsAPI = new ClientsAPI();
