import api from "./client";

/**
 * ProductsAPI — CRUD des produits.
 *
 * GET    /shop/products/         ?search&category&min_price&max_price&ordering&page&page_size
 * POST   /shop/products/
 * GET    /shop/products/:id/
 * PATCH  /shop/products/:id/     ← v2 : PATCH (était PUT en v1)
 * DELETE /shop/products/:id/
 *
 * ⚠️  v2 : Structure "others_details" change :
 *   v1 : ["128GB", "Noir"]
 *   v2 : [{ "key": "Stockage", "value": "128GB" }, { "key": "Couleur", "value": "Noir" }]
 *
 * ⚠️  v2 : "secondary_images" remplace "videos" pour les médias secondaires
 *
 * Structure complète d'un produit :
 * {
 *   name             : string
 *   price            : number
 *   stock            : number  — omis si unlimited_stock === true (admin)
 *   unlimited_stock  : boolean  — disponible sans limite de quantité
 *   description      : string
 *   image            : string (URL image principale)
 *   secondary_images : string[] (URLs images secondaires)
 *   others_details   : { key: string, value: string }[]
 *   category         : string (UUID)
 * }
 */
class ProductsAPI {
  /**
   * Liste les produits avec filtres et pagination.
   * @param {{
   *   search?    : string,
   *   category?  : string,   // UUID
   *   min_price? : number,
   *   max_price? : number,
   *   ordering?  : string,   // ex: '-price', 'name'
   *   page?      : number,
   *   page_size? : number,
   * }} params
   */
  list(params = {}) {
    return api.get("/shop/products/", { params });
  }

  /**
   * Crée un produit.
   * @param {object} data
   */
  create(data) {
    return api.post("/shop/products/", data);
  }

  /**
   * Détail d'un produit.
   * @param {string} id — UUID
   */
  detail(id) {
    return api.get(`/shop/products/${id}/`);
  }

  /**
   * Modifie un produit (partiel).
   * ⚠️  v2 : PATCH (partiel) — était PUT (complet) en v1
   * @param {string} id — UUID
   * @param {object} data
   */
  update(id, data) {
    return api.patch(`/shop/products/${id}/`, data);
  }

  /**
   * Supprime un produit.
   * @param {string} id — UUID
   */
  delete(id) {
    return api.delete(`/shop/products/${id}/`);
  }
}

export const productsAPI = new ProductsAPI();
