import { toFrenchUserMessage } from './apiMessagesFr';

/**
 * Réponses structurées du backend Tokia (ex. 400 unicité nom, suppression bloquée).
 * @param {unknown} err - Erreur Axios ou autre
 * @returns {{ message: string | null, existingId: string | null, status: number | undefined }}
 */
export function parseBackendErrorResponse(err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    if (data == null || typeof data !== 'object') {
        return { message: null, existingId: null, status };
    }
    let message = null;
    if (typeof data.message === 'string' && data.message.trim()) {
        message = data.message.trim();
    } else if (typeof data.detail === 'string' && data.detail.trim()) {
        message = data.detail.trim();
    }
    const rawId = data.existing_id ?? data.existingId;
    const existingId =
        rawId != null && String(rawId).trim() !== ''
            ? String(rawId).trim()
            : null;
    return { message, existingId, status };
}

/**
 * Message utilisateur à afficher (priorité au corps JSON `message`, sinon fallback).
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function getBackendErrorMessage(
    err,
    fallback = 'Une erreur est survenue.',
) {
    const { message } = parseBackendErrorResponse(err);
    if (message) return message;
    return toFrenchUserMessage(err?.message, fallback);
}
