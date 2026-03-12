import { api } from './client';
import type {
  UpdateOrganizationData,
  InviteUserData,
  OrganizationResponse,
  LogoUploadResponse,
  InviteResponse,
} from '../types/organization';

export const organizationApi = {
  /**
   * Get organization settings
   */
  getSettings: () => api.get<OrganizationResponse>('/organization/settings'),

  /**
   * Update organization settings
   */
  updateSettings: (data: UpdateOrganizationData) =>
    api.put<OrganizationResponse>('/organization/settings', data),

  /**
   * Upload company logo
   */
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post<LogoUploadResponse>('/organization/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Invite a new user to the organization
   */
  inviteUser: (data: InviteUserData) =>
    api.post<InviteResponse>('/organization/invite', data),
};