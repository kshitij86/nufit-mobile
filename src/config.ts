// Set EXPO_PUBLIC_API_HOST in .env to point the app at a different backend.
const DEFAULT_API_HOST = "https://nufit-api-ckfgddh3e9erd4er.centralindia-01.azurewebsites.net";

export const API_HOST = (process.env.EXPO_PUBLIC_API_HOST || DEFAULT_API_HOST).replace(/\/+$/, "");
export const AUTH_BASE_URL = `${API_HOST}/api/v1/auth`;
export const PAYMENTS_BASE_URL = `${API_HOST}/api/v1/payments`;
