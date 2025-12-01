import { api } from './api-config';

export const passwordResetService = {
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/password-reset/request', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post('/auth/password-reset/reset', {
      token,
      newPassword,
    });
    return response.data;
  },

  async validateResetToken(token: string): Promise<{ isValid: boolean }> {
    const response = await api.get(`/auth/password-reset/validate-token?token=${token}`);
    return response.data;
  },
};