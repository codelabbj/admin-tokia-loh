import api from "./client";
import { prepareFileForUpload } from "../utils/prepareFileForUpload";

/**
 * FilesAPI — upload et gestion des fichiers media.
 *
 * POST   /shop/files/   (multipart/form-data, champ: "file")
 * GET    /shop/files/?page=1&page_size=50
 * GET    /shop/files/:id/
 * DELETE /shop/files/:id/
 */
class FilesAPI {
  /**
   * Upload un fichier File natif du navigateur.
   * Le contenu est relu en mémoire avant envoi (compatibilité MTP / téléphone USB).
   * @param {File} file — objet File (input type="file")
   */
  async upload(file) {
    const ready = await prepareFileForUpload(file);

    const ext = ready.name.includes(".")
      ? "." + ready.name.split(".").pop().toLowerCase()
      : "";
    const renamedFile = new File(
      [ready],
      `${crypto.randomUUID()}${ext}`,
      { type: ready.type, lastModified: ready.lastModified },
    );

    const formData = new FormData();
    formData.append("file", renamedFile);
    return api.post("/shop/files/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  /**
   * @param {{ page?: number, page_size?: number, ordering?: string }} params
   */
  list(params = {}) {
    return api.get("/shop/files/", { params });
  }

  detail(id) {
    return api.get(`/shop/files/${id}/`);
  }

  delete(id) {
    return api.delete(`/shop/files/${id}/`);
  }
}

export const filesAPI = new FilesAPI();
