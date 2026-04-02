import api from "./client";

/**
 * Auth admin — le renouvellement du JWT (refresh) est géré dans api/client.js
 * (intercepteur 401). Le back doit exposer POST {VITE_AUTH_REFRESH_PATH}
 * (défaut /accounts/token/refresh/) avec body { refresh } → { access, refresh? }.
 */
class AuthAPI {
  /**
   * Connexion admin.
   * Réponse attendue : success, access, refresh, exp, user: { id, email, is_admin?, is_superuser? }
   */
  login(email, password) {
    return api.post("/accounts/admin/login/", { email, password });
  }

  /** Changer le mot de passe. */
  changePassword(email, oldPassword, newPassword, confirmNewPassword) {
    return api.post("/accounts/admin/change_password/", {
      email,
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });
  }

  /** Mot de passe oublié. */
  forgotPassword(email) {
    return api.post("/accounts/admin/forgot-password/", { email });
  }

  resetPassword(email, otp, newPassword, confirmNewPassword) {
    return api.post("/accounts/admin/reset-password/", {
      email,
      otp,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });
  }
}

export const authAPI = new AuthAPI();
