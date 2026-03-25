import { useState, useEffect, useCallback } from "react";
import api from "../api/client"; // Import de votre instance axios configurée

// ─── Hook principal ────────────────────────────────────────────────────────────
export function useAdmin() {
  // ── État utilisateur courant ─────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("admin");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const isSuperAdmin = !!currentUser?.is_superuser;

  // ── Bannières ────────────────────────────────────────────────────────────────
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannersError, setBannersError] = useState(null);

  const fetchBanners = useCallback(async () => {
    setBannersLoading(true);
    setBannersError(null);
    try {
      const { data } = await api.get("/shop/banners/");
      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      setBannersError(error.message || "Impossible de charger les bannières.");
    } finally {
      setBannersLoading(false);
    }
  }, []);

  const addBanner = useCallback(
    async (formData) => {
      try {
        const { data } = await api.post("/shop/banners/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await fetchBanners();
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [fetchBanners],
  );

  const updateBanner = useCallback(
    async (id, formData) => {
      try {
        const { data } = await api.put(`/shop/banners/${id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await fetchBanners();
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [fetchBanners],
  );

  const deleteBanner = useCallback(async (id) => {
    try {
      const { data } = await api.delete(`/shop/banners/${id}/`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        data: error.response?.data || { message: error.message },
      };
    }
  }, []);

  // ── Admins ───────────────────────────────────────────────────────────────────
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState(null);

  const fetchAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;
    setAdminsLoading(true);
    setAdminsError(null);
    try {
      const { data } = await api.get("/accounts/admin/list/");
      if (data?.success) {
        setAdmins(data.data || []);
      } else {
        setAdminsError("Impossible de charger les administrateurs.");
      }
    } catch (error) {
      setAdminsError(
        error.message || "Impossible de charger les administrateurs.",
      );
    } finally {
      setAdminsLoading(false);
    }
  }, [isSuperAdmin]);

  const createAdmin = useCallback(
    async ({ email, phone, password, is_superuser = false }) => {
      if (!isSuperAdmin) {
        return { ok: false, data: { message: "Permission refusée." } };
      }
      try {
        const { data } = await api.post("/accounts/admin/create-admin/", {
          email,
          phone,
          password,
          is_admin: true,
          is_superuser,
        });
        await fetchAdmins();
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [isSuperAdmin, fetchAdmins],
  );

  const deleteAdmin = useCallback(
    async (id) => {
      if (!isSuperAdmin) {
        return { ok: false, data: { message: "Permission refusée." } };
      }
      try {
        const { data } = await api.delete(
          `/accounts/admin/delete-admin/${id}/`,
        );
        setAdmins((prev) => prev.filter((a) => a.id !== id));
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [isSuperAdmin],
  );

  // ── Mot de passe ─────────────────────────────────────────────────────────────
  const changePassword = useCallback(
    async ({ old_password, new_password, confirm_new_password }) => {
      try {
        const { data } = await api.post("/accounts/admin/change_password/", {
          email: currentUser?.email,
          old_password,
          new_password,
          confirm_new_password,
        });
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [currentUser],
  );

  // ── Chargement initial ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchBanners();
    if (isSuperAdmin) fetchAdmins();
  }, [fetchBanners, fetchAdmins, isSuperAdmin]);

  return {
    // Utilisateur courant
    currentUser,
    isSuperAdmin,

    // Bannières
    banners,
    bannersLoading,
    bannersError,
    fetchBanners,
    addBanner,
    updateBanner,
    deleteBanner,

    // Admins (superadmin seulement)
    admins,
    adminsLoading,
    adminsError,
    fetchAdmins,
    createAdmin,
    deleteAdmin,

    // Mot de passe
    changePassword,
  };
}
