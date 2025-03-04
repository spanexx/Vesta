import { environment } from '../environments/environment';

const apiUrl = environment.apiUrl;

// Example of importing routes
const authRoutes = `${apiUrl}/auth`;
const profileRoutes = `${apiUrl}/profiles`;
const moderationRoutes = `${apiUrl}/moderation`;


// Exporting the routes for use in the application
export {
  authRoutes,
  profileRoutes,
  moderationRoutes,

};