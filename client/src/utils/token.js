/**
 * Token Management Utilities
 * Handles token storage, retrieval, and validation
 */

import { jwtDecode } from 'jwt-decode';

// Token keys for localStorage
const TOKENS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken', // Note: refresh token is in httpOnly cookie, this is for tracking
};

/**
 * Parse and validate JWT token
 * 
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    const decoded = jwtDecode(token);
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null; // Token is expired
    }
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * 
 * @param {string} token - JWT token to check
 * @returns {boolean} True if expired, false if valid
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  return !decoded; // null means expired or invalid
};

/**
 * Store access token (stored in memory, not localStorage for security)
 * 
 * @param {string} token - Access token to store
 */
export const setAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem(TOKENS.ACCESS_TOKEN, token);
  }
};

/**
 * Get access token from memory
 * 
 * @returns {string|null} Stored access token or null
 */
export const getAccessToken = () => {
  return sessionStorage.getItem(TOKENS.ACCESS_TOKEN) || null;
};

/**
 * Clear access token
 */
export const clearAccessToken = () => {
  sessionStorage.removeItem(TOKENS.ACCESS_TOKEN);
};

/**
 * Store refresh token marker (actual token is in httpOnly cookie)
 * This helps track if a refresh token exists
 * 
 * @param {boolean} remember - Whether to use persistent storage
 */
export const setRefreshTokenMarker = (remember = false) => {
  if (remember) {
    localStorage.setItem(TOKENS.REFRESH_TOKEN, 'present');
  } else {
    sessionStorage.setItem(TOKENS.REFRESH_TOKEN, 'present');
  }
};

/**
 * Check if refresh token exists (marker check)
 * 
 * @returns {boolean} True if refresh token marker exists
 */
export const hasRefreshToken = () => {
  return (
    localStorage.getItem(TOKENS.REFRESH_TOKEN) === 'present' ||
    sessionStorage.getItem(TOKENS.REFRESH_TOKEN) === 'present'
  );
};

/**
 * Clear refresh token marker
 */
export const clearRefreshTokenMarker = () => {
  localStorage.removeItem(TOKENS.REFRESH_TOKEN);
  sessionStorage.removeItem(TOKENS.REFRESH_TOKEN);
};

/**
 * Clear all tokens
 */
export const clearAllTokens = () => {
  clearAccessToken();
  clearRefreshTokenMarker();
};

/**
 * Get user info from access token
 * 
 * @returns {Object|null} User object from token or null
 */
export const getUserFromToken = () => {
  const token = getAccessToken();
  const decoded = decodeToken(token);
  
  if (decoded) {
    return {
      id: decoded.id,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role,
      userName: decoded.userName,
      address: decoded.address,
      authProvider: decoded.authProvider,
      phoneVerified: decoded.phoneVerified,
      emailVerified: decoded.emailVerified,
      mustChangePassword: decoded.mustChangePassword,
    };
  }
  
  return null;
};

/**
 * Check if user is authenticated
 * 
 * @returns {boolean} True if valid access token exists
 */
export const isAuthenticated = () => {
  const token = getAccessToken();
  return !!token && !isTokenExpired(token);
};

/**
 * Get time until token expiry (in seconds)
 * 
 * @returns {number} Seconds until expiry, or 0 if no token
 */
export const getTokenExpiryTime = () => {
  const token = getAccessToken();
  if (!token) return 0;
  
  try {
    const decoded = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  } catch {
    return 0;
  }
};

/**
 * Check if token will expire soon (within 2 minutes)
 * 
 * @returns {boolean} True if token expiring soon
 */
export const isTokenExpiringSoon = () => {
  const secondsLeft = getTokenExpiryTime();
  return secondsLeft > 0 && secondsLeft < 120; // Less than 2 minutes
};

export default {
  decodeToken,
  isTokenExpired,
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  setRefreshTokenMarker,
  hasRefreshToken,
  clearRefreshTokenMarker,
  clearAllTokens,
  getUserFromToken,
  isAuthenticated,
  getTokenExpiryTime,
  isTokenExpiringSoon,
};
