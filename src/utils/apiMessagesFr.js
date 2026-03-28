/**
 * Traduit des messages d'API (souvent en anglais) vers un libellé français pour l'utilisateur.
 * Clés en minuscules pour une correspondance insensible à la casse.
 */
const API_MESSAGE_TO_FR = new Map([
    [
        "cannot delete a super admin",
        "Impossible de supprimer un super administrateur.",
    ],
    [
        "cannot delete super admin",
        "Impossible de supprimer un super administrateur.",
    ],
    ["permission denied.", "Permission refusée."],
    ["permission denied", "Permission refusée."],
    ["not found.", "Élément introuvable."],
    ["not found", "Élément introuvable."],
    [
        "you do not have permission to perform this action.",
        "Vous n'avez pas la permission d'effectuer cette action.",
    ],
    [
        "authentication credentials were not provided.",
        "Authentification requise. Veuillez vous reconnecter.",
    ],
    ["invalid token.", "Session invalide. Veuillez vous reconnecter."],
    ["bad request.", "Requête invalide."],
]);

/**
 * @param {string | null | undefined} raw - Message brut (ex. corps API ou Error#message)
 * @param {string} [fallback] - Si vide ou non mappable et non FR évident
 * @returns {string}
 */
export function toFrenchUserMessage(raw, fallback = "Une erreur est survenue.") {
    if (raw == null || typeof raw !== "string") return fallback;
    const t = raw.trim();
    if (!t) return fallback;

    const mapped = API_MESSAGE_TO_FR.get(t.toLowerCase());
    if (mapped) return mapped;

    // Déjà probablement en français (accents / mots courants) : on garde le texte du serveur
    if (/[àâäéèêëïîôùûçœ]/i.test(t)) return t;
    if (
        /\b(le|la|les|de|des|une|pour|avec|sans|erreur|impossible|veuillez)\b/i.test(
            t,
        )
    ) {
        return t;
    }

    // Anglais ou autre sans entrée dédiée : éviter d'afficher brut à l'utilisateur
    return fallback;
}
