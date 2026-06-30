/**
 * Message affiché quand le fichier est inaccessible (souvent téléphone branché en USB / MTP).
 */
export const FILE_UNREADABLE_MESSAGE =
  "Impossible de lire ce fichier depuis le stockage du téléphone branché en USB. " +
  "Copiez l'image sur l'ordinateur (Bureau, Téléchargements…), puis sélectionnez-la à nouveau. " +
  "Vous pouvez aussi l'envoyer par messagerie/e-mail et la télécharger sur le PC.";

const IMAGE_EXT_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  heic: "image/heic",
  heif: "image/heif",
};

function guessMimeFromName(name) {
  const ext = String(name ?? "")
    .split(".")
    .pop()
    ?.toLowerCase();
  return (ext && IMAGE_EXT_MIME[ext]) || "application/octet-stream";
}

/**
 * Lit le contenu en mémoire avant envoi au serveur.
 * Corrige les fichiers « vides » sélectionnés via MTP (Android/iPhone branché en USB sur Windows).
 *
 * @param {File | Blob} file
 * @returns {Promise<File>}
 */
export async function prepareFileForUpload(file) {
  if (!(file instanceof File) && !(file instanceof Blob)) {
    throw new Error("Fichier invalide.");
  }

  const name = file instanceof File ? file.name : "upload";
  const type =
    file.type && file.type !== "application/octet-stream"
      ? file.type
      : guessMimeFromName(name);

  let buffer = null;
  const attempts = file.size === 0 ? 3 : 1;

  for (let i = 0; i < attempts; i++) {
    try {
      buffer = await file.arrayBuffer();
      if (buffer.byteLength > 0) break;
    } catch {
      buffer = null;
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  if (!buffer || buffer.byteLength === 0) {
    throw new Error(FILE_UNREADABLE_MESSAGE);
  }

  const lastModified =
    file instanceof File && file.lastModified ? file.lastModified : Date.now();

  return new File([buffer], name, { type, lastModified });
}
