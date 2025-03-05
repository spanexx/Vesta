export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    // Add other user properties as needed
  };
}
