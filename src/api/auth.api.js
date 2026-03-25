import api from "./client";

class AuthAPI {
  /** Connexion admin. */
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
