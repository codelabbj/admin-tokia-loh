import api from "./client";

/**
 * FilesAPI — upload et gestion des fichiers media.
 *
 * POST   /shop/files/   (multipart/form-data, champ: "file")
 * GET    /shop/files/
 * GET    /shop/files/:id/
 * DELETE /shop/files/:id/
 *
 * Réponse d'un upload : { id, url, ... }
 * → utiliser data.url pour passer l'image à category.icon ou product.image
 */
class FilesAPI {
  /**
   * Upload un fichier File natif du navigateur.
   * @param {File} file — objet File (input type="file")
   * @returns {Promise<{ id: string, url: string, ... }>}
   */
  upload(file) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/shop/files/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  list() {
    return api.get("/shop/files/");
  }

  detail(id) {
    return api.get(`/shop/files/${id}/`);
  }

  delete(id) {
    return api.delete(`/shop/files/${id}/`);
  }
}

export const filesAPI = new FilesAPI();
