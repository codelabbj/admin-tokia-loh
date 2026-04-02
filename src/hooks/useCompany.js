import { useState, useEffect, useCallback } from "react";
import { companyAPI } from "../api/company.api";

/**
 * Données entreprise exposées par /accounts/company/
 */
export const useCompany = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await companyAPI.get();
      setCompany(data);
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement de l’entreprise");
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const update = async (payload) => {
    const { data } = await companyAPI.patch(payload);
    setCompany(data);
    return data;
  };

  return {
    company,
    loading,
    error,
    refetch: fetchCompany,
    update,
  };
};
