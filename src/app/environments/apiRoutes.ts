import { environment } from './environment.prod';

const apiUrl = environment.apiUrl;

// Example of importing routes
const authRoutes = `${apiUrl}/auth`;
const profileRoutes = `${apiUrl}/profiles`;
const moderationRoutes = `${apiUrl}/moderation`;
const meRoute = `${authRoutes}/me`; // Add this new route
const videoRoutes = `${apiUrl}/videos`;
const adminRoutes = `${apiUrl}/admin`;

// Exporting the routes for use in the application
export {
  authRoutes,
  profileRoutes,
  moderationRoutes,
  meRoute,
  videoRoutes,
  adminRoutes,
};