import { useState, useEffect, useCallback } from "react";
import { clientsAPI } from "../api/client.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";

export const CLIENTS_LIST_PAGE_SIZE = 20;

/**
 * Dérive le statut lisible depuis les champs booléens de l'API.
 * L'API renvoie is_active et is_blocked (peuvent être absents).
 */
export const deriveStatus = (client) => {
  if (client.is_active === false) return "Désactivé";
  if (client.is_blocked === true) return "Bloqué";
  return "Actif";
};

/**
 * Liste clients depuis la réponse API.
 * Cas Tokia : { count, next, results: { success, data: [...] } }.
 */
export function extractClientsRows(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const resultsField = payload.results;
  if (resultsField && typeof resultsField === "object" && !Array.isArray(resultsField)) {
    if (Array.isArray(resultsField.data)) return resultsField.data;
    if (Array.isArray(resultsField.results)) return resultsField.results;
    if (Array.isArray(resultsField.clients)) return resultsField.clients;
  }

  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.clients)) return payload.clients;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.list)) return payload.list;
  if (Array.isArray(payload.data)) return payload.data;
  const inner = payload.data;
  if (inner && typeof inner === "object") {
    if (Array.isArray(inner.results)) return inner.results;
    if (Array.isArray(inner.data)) return inner.data;
    if (Array.isArray(inner.clients)) return inner.clients;
    if (Array.isArray(inner.items)) return inner.items;
    if (Array.isArray(inner.list)) return inner.list;
  }
  return [];
}

export const useClients = (id = null) => {
  const [clients, setClients] = useState([]);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ─── Liste ────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await clientsAPI.list({
        page,
        page_size: CLIENTS_LIST_PAGE_SIZE,
        ordering: ORDERING_NEWEST_FIRST,
      });
      const rows = extractClientsRows(data);
      setClients(rows);
      setTotalCount(
        typeof data?.count === "number" ? data.count : rows.length,
      );
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  }, [page]);

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

  const mergeClientFromResponse = (clientId, data, fallbackActive) => {
    const payload = data?.data;
    let patch;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      patch = { ...payload };
      if (patch.is_active === undefined) patch.is_active = fallbackActive;
    } else {
      patch = { is_active: fallbackActive };
    }
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, ...patch } : c)),
    );
    if (client?.id === clientId) {
      setClient((prev) => ({ ...prev, ...patch }));
    }
  };

  /**
   * Désactive un client (POST /accounts/clients/:id/deactivate/).
   */
  const deactivate = async (clientId) => {
    const { data } = await clientsAPI.deactivate(clientId);
    mergeClientFromResponse(clientId, data, false);
    return data;
  };

  /**
   * Réactive un client (même route POST + is_active: true).
   */
  const reactivate = async (clientId) => {
    const { data } = await clientsAPI.reactivate(clientId);
    mergeClientFromResponse(clientId, data, true);
    return data;
  };

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / CLIENTS_LIST_PAGE_SIZE),
  );

  return {
    clients,
    client,
    loading,
    error,
    verify,
    deactivate,
    reactivate,
    refetch: id ? () => fetchOne(id) : fetchAll,
    ...(id
      ? {}
      : {
          page,
          setPage,
          totalPages,
          totalCount,
          pageSize: CLIENTS_LIST_PAGE_SIZE,
        }),
  };
};
