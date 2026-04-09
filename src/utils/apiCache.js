/**
 * Cache mémoire léger pour les appels API.
 *
 * Principe :
 *  - Les données sont stockées avec un timestamp.
 *  - Si les données ont moins de `ttlMs` millisecondes, elles sont retournées sans appel réseau.
 *  - Le cache est en mémoire (lifetime = onglet ouvert) : il se vide automatiquement
 *    au rechargement de la page ou à la déconnexion.
 *
 * Usage :
 *   import { apiCache } from '../utils/apiCache';
 *
 *   // Lire
 *   const cached = apiCache.get('products');
 *
 *   // Écrire
 *   apiCache.set('products', data);
 *
 *   // Invalider (ex: après mutation)
 *   apiCache.invalidate('products');
 *   apiCache.invalidateAll(); // vide tout
 */

const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes

const store = new Map(); // clé → { data, timestamp }

export const apiCache = {
    /**
     * Retourne les données si elles sont encore fraîches, sinon null.
     * @param {string} key
     * @param {number} [ttlMs]
     */
    get(key, ttlMs = DEFAULT_TTL_MS) {
        const entry = store.get(key);
        if (!entry) return null;
        const age = Date.now() - entry.timestamp;
        if (age > ttlMs) {
            store.delete(key);
            return null;
        }
        return entry.data;
    },

    /**
     * Enregistre des données dans le cache.
     * @param {string} key
     * @param {*} data
     */
    set(key, data) {
        store.set(key, { data, timestamp: Date.now() });
    },

    /**
     * Invalide une entrée du cache (force le prochain appel réseau).
     * @param {string} key
     */
    invalidate(key) {
        store.delete(key);
    },

    /**
     * Invalide toutes les entrées dont la clé commence par un préfixe donné.
     * @param {string} prefix
     */
    invalidatePrefix(prefix) {
        for (const key of store.keys()) {
            if (key.startsWith(prefix)) store.delete(key);
        }
    },

    /** Vide tout le cache. */
    invalidateAll() {
        store.clear();
    },
};
