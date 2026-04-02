import api from "./client";

/**
 * Fiche entreprise (singleton).
 *
 * GET   /accounts/company/
 * PATCH /accounts/company/
 */
class CompanyAPI {
  get() {
    return api.get("/accounts/company/");
  }

  /**
   * @param {Record<string, unknown>} data — champs partiels ou complets
   */
  patch(data) {
    return api.patch("/accounts/company/", data);
  }
}

export const companyAPI = new CompanyAPI();
