export interface LoginResponse {
  token: string;
  isAdmin?: boolean;
  adminUsername?: string;
  permissions?: {
    canEditProfiles?: boolean;
    canDeleteProfiles?: boolean;
    canModerateContent?: boolean;
    canManageSubscriptions?: boolean;
    canCreateAdmin?: boolean;
  };
  user?: {
    id: string;
    email: string;
    // Add other user properties as needed
  };
}
