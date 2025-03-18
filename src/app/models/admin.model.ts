export interface AdminPermissions {
  canEditProfiles: boolean;
  canDeleteProfiles: boolean;
  canModerateContent: boolean;
  canManageSubscriptions: boolean;
  canCreateAdmin: boolean;
}

export interface Admin {
  _id: string;
  username: string;
  email: string;
  permissions: AdminPermissions;
  lastLogin?: Date;
}

export interface AdminLoginResponse {
  token: string;
  admin: Admin;
}

export interface AdminCreateResponse {
  message: string;
  admin: Admin;
}

export interface UserFileResponse {
  username: string;
  email: string;
  images: string[];
  videos: string[];
  verificationDocuments: string[];
  profilePicture: string | null;
}
