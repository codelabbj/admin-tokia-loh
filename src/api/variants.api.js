import api from "./client";

class VariantsAPI {
  list(params = {}) {
    return api.get("/shop/v2/variants/", { params });
  }

  /**
   * Récupère toutes les variantes d’un produit (l’API liste souvent sans filtre product).
   * Parcourt la pagination jusqu’à épuisement.
   * @param {string} productId
   */
  async listAllForProduct(productId) {
    const pid = String(productId);
    const merged = [];
    let page = 1;
    for (;;) {
      const { data } = await this.list({ page_size: 100, page });
      const rows = Array.isArray(data) ? data : (data?.results ?? []);
      merged.push(...rows);
      const hasNext = Boolean(data?.next) && rows.length > 0;
      if (!hasNext) break;
      page += 1;
      if (page > 200) break;
    }
    return merged.filter((r) => {
      const p = r?.product;
      if (typeof p === "string") return String(p) === pid;
      return String(p?.id ?? "") === pid;
    });
  }

  create(data) {
    return api.post("/shop/v2/variants/", data);
  }

  update(id, data) {
    return api.patch(`/shop/v2/variants/${id}/`, data);
  }

  delete(id) {
    return api.delete(`/shop/v2/variants/${id}/`);
  }
}

export const variantsAPI = new VariantsAPI();
