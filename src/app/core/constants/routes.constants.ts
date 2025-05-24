// Route path constants to avoid hardcoding route strings throughout the application
export const ROUTES = {
  // Main routes
  HOME: '',
  LOGIN: 'login',
  REGISTER: 'register',
  LOGOUT: 'logout',
  
  // Profile routes
  PROFILE: 'profile',
  PROFILE_DETAIL: 'profile/:id',
  UPDATE_PROFILE: 'update-profile',
  SETTINGS: 'settings',
  
  // Payment routes
  PAYMENT: 'payment',
  PRICING: 'pricing',
  VIDEO_PAYMENT: 'video-payment',
  MANUAL_PAYMENT: 'manual-payment',
  
  // Video routes
  VIDEO_UPLOAD: 'video-upload',
  
  // Account routes
  ACTIVATION: 'activation',
  
  // Admin routes
  ADMIN: 'admin',
  ADMIN_LOGIN: 'admin/login',
  ADMIN_HOME: 'home',
  ADMIN_USERS: 'users',
  ADMIN_MODERATION: 'moderation',
  ADMIN_ANALYTICS: 'analytics',
  ADMIN_EDIT_USER: 'users/:userId/edit',
  ADMIN_MANUAL_PAYERS: 'manual-payers',
  ADMIN_MANUAL_PAYMENT_DETAIL: 'manual-payers/:id',
  
  // Wildcard route
  NOT_FOUND: '**'
};
