import api from "./client";

/**
 * CategoriesAPI — CRUD des catégories.
 *
 * GET    /shop/categories/           ?search&page&page_size
 * POST   /shop/categories/
 * GET    /shop/categories/:id/
 * PATCH  /shop/categories/:id/       ← v2 : PATCH (était PUT en v1)
 * DELETE /shop/categories/:id/
 * GET    /shop/categories/:id/products/  ← nouveau en v2
 *
 * Structure :
 * {
 *   name : string
 *   icon : string (URL)
 * }
 */
class CategoriesAPI {
  /**
   * Liste les catégories.
   * @param {{ search?: string, page?: number, page_size?: number, ordering?: string }} params
   */
  list(params = {}) {
    return api.get("/shop/categories/", { params });
  }

  /**
   * Crée une catégorie.
   * @param {{ name: string, icon?: string }} data
   */
  create(data) {
    return api.post("/shop/categories/", data);
  }

  /**
   * Détail d'une catégorie.
   * @param {string} id — UUID
   */
  detail(id) {
    return api.get(`/shop/categories/${id}/`);
  }

  /**
   * Modifie une catégorie.
   * ⚠️  v2 : PATCH (partiel) — était PUT (complet) en v1
   * @param {string} id — UUID
   * @param {{ name?: string, icon?: string }} data
   */
  update(id, data) {
    return api.patch(`/shop/categories/${id}/`, data);
  }

  /**
   * Supprime une catégorie.
   * @param {string} id — UUID
   */
  delete(id) {
    return api.delete(`/shop/categories/${id}/`);
  }

  /**
   * Produits d'une catégorie.
   * ⚠️  Nouveau en v2 — évite de filtrer côté client
   * @param {string} id — UUID
   */
  products(id) {
    return api.get(`/shop/categories/${id}/products/`);
  }
}

export const categoriesAPI = new CategoriesAPI();
