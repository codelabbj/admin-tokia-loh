import { useState, useEffect, useCallback } from "react";
import { clientsAPI } from "../api/client.api";

/**
 * Dérive le statut lisible depuis les champs booléens de l'API.
 * L'API renvoie is_active et is_blocked (peuvent être absents).
 */
export const deriveStatus = (client) => {
  if (client.is_active === false) return "Désactivé";
  if (client.is_blocked === true) return "Bloqué";
  return "Actif";
};

export const useClients = (id = null) => {
  const [clients, setClients] = useState([]);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Liste ────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await clientsAPI.list();
      // L'API renvoie { success: true, data: [...] }
      // Compatibilité DRF paginé : { count, results: [...] }
      const rows =
        data?.data ?? data?.results ?? (Array.isArray(data) ? data : []);
      setClients(rows);
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Détail ───────────────────────────────────────────────
  const fetchOne = useCallback(async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await clientsAPI.detail(clientId);
      // L'API renvoie { success: true, data: { ... } }
      setClient(data?.data ?? data);
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement du client");
      setClient(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) fetchOne(id);
    else fetchAll();
  }, [id, fetchAll, fetchOne]);

  // ─── Actions ──────────────────────────────────────────────
  const verify = async (clientId) => {
    const { data } = await clientsAPI.verify(clientId);
    return data;
  };

  /**
   * Désactive un client (POST /accounts/clients/:id/deactivate/).
   * Met à jour la liste et la fiche localement après succès.
   */
  const deactivate = async (clientId) => {
    const { data } = await clientsAPI.deactivate(clientId);
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, is_active: false } : c)),
    );
    if (client?.id === clientId) {
      setClient((prev) => ({ ...prev, is_active: false }));
    }
    return data;
  };

  return {
    clients,
    client,
    loading,
    error,
    verify,
    deactivate,
    refetch: id ? () => fetchOne(id) : fetchAll,
  };
};
