/**
 * Authentication Service
 * Handles all auth API calls to the backend
 */

import axios from 'axios';
import { setAccessToken, setRefreshTokenMarker, clearAllTokens } from '@/utils/token';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: send cookies with requests
});

/**
 * Register new user
 * 
 * @param {Object} userData - User registration data
 * @returns {Promise} API response
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    if (response.data.success) {
      setAccessToken(response.data.accessToken);
      setRefreshTokenMarker(false);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Registration failed' };
  }
};

/**
 * Login with email and password
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} rememberMe - Whether to persist session
 * @returns {Promise} API response
 */
export const login = async (email, password, rememberMe = false) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
      rememberMe,
    });
    
    if (response.data.success) {
      setAccessToken(response.data.accessToken);
      setRefreshTokenMarker(rememberMe);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Login failed' };
  }
};

/**
 * Login with Google
 * 
 * @param {Object} googleTokenData - Google authentication data
 * @returns {Promise} API response
 */
export const loginWithGoogle = async (googleTokenData) => {
  try {
    const response = await api.post('/auth/google', googleTokenData);
    
    if (response.data.success) {
      setAccessToken(response.data.accessToken);
      setRefreshTokenMarker(false);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Google login failed' };
  }
};

/**
 * Login with phone number
 * 
 * @param {Object} phoneData - Phone authentication data
 * @returns {Promise} API response
 */
export const loginWithPhone = async (phoneData) => {
  try {
    const response = await api.post('/auth/phone', phoneData);
    
    if (response.data.success) {
      setAccessToken(response.data.accessToken);
      setRefreshTokenMarker(false);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Phone login failed' };
  }
};

/**
 * Refresh access token using refresh token from cookie
 * 
 * @returns {Promise} API response with new access token
 */
export const refreshAccessToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    
    if (response.data.success) {
      setAccessToken(response.data.accessToken);
      setRefreshTokenMarker(true);
    }
    
    return response.data;
  } catch (error) {
    // Clear tokens on refresh failure
    clearAllTokens();
    throw error.response?.data || { success: false, message: 'Token refresh failed' };
  }
};

/**
 * Logout user
 * 
 * @returns {Promise} API response
 */
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    clearAllTokens();
    return response.data;
  } catch (error) {
    // Clear tokens anyway
    clearAllTokens();
    return { success: true, message: 'Logged out' };
  }
};

/**
 * Check authentication status
 * Validates current token with backend
 * 
 * @returns {Promise} API response with current user info
 */
export const checkAuthStatus = async () => {
  try {
    const response = await api.get('/auth/check-auth');
    
    if (response.data.success) {
      setAccessToken(response.data.accessToken);
    }
    
    return response.data;
  } catch (error) {
    clearAllTokens();
    throw error.response?.data || { success: false, message: 'Auth check failed' };
  }
};

/**
 * Send OTP to email
 * 
 * @param {string} email - Email address
 * @param {string} purpose - Purpose of OTP (register, change-email, etc.)
 * @returns {Promise} API response
 */
export const sendOtp = async (email, purpose = 'register') => {
  try {
    const response = await api.post('/auth/send-otp', {
      target: email,
      purpose,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to send OTP' };
  }
};

/**
 * Verify OTP
 * 
 * @param {string} email - Email address
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise} API response with OTP session ID
 */
export const verifyOtp = async (email, otp, purpose = 'register') => {
  try {
    const response = await api.post('/auth/verify-otp', {
      target: email,
      otp,
      purpose,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'OTP verification failed' };
  }
};

/**
 * Update user profile
 * 
 * @param {Object} profileData - User profile data
 * @returns {Promise} API response
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    
    if (response.data.success) {
      setAccessToken(response.data.accessToken);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Profile update failed' };
  }
};

/**
 * Change password
 * 
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} API response
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Password change failed' };
  }
};

/**
 * Change email address
 * 
 * @param {string} email - New email address
 * @param {string} otpSessionId - OTP session ID from verification
 * @returns {Promise} API response
 */
export const changeEmail = async (email, otpSessionId) => {
  try {
    const response = await api.put('/auth/change-email', {
      email,
      otpSessionId,
    });
    
    if (response.data.success) {
      setAccessToken(response.data.accessToken);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Email change failed' };
  }
};

/**
 * Forgot password - send OTP
 * 
 * @param {string} email - User email
 * @param {string} channel - Channel for OTP (email or whatsapp)
 * @returns {Promise} API response with OTP session ID
 */
export const forgotPassword = async (email, channel = 'email') => {
  try {
    const response = await api.post('/auth/forgot-password', {
      email,
      channel,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to send password reset OTP' };
  }
};

/**
 * Reset password - verify OTP and set new password
 * 
 * @param {string} email - User email
 * @param {string} otp - OTP code
 * @param {string} newPassword - New password
 * @param {string} otpSessionId - OTP session ID
 * @returns {Promise} API response
 */
export const resetPassword = async (email, otp, newPassword, otpSessionId) => {
  try {
    const response = await api.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
      otpSessionId,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Password reset failed' };
  }
};

/**
 * Change phone number
 * 
 * @param {string} phone - New phone number
 * @param {Object} verificationData - Verification data (OTP or Firebase token)
 * @returns {Promise} API response
 */
export const changePhone = async (phone, verificationData) => {
  try {
    const response = await api.put('/auth/change-phone', {
      phone,
      ...verificationData,
    });
    
    if (response.data.success) {
      setAccessToken(response.data.accessToken);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Phone change failed' };
  }
};

export default {
  register,
  login,
  loginWithGoogle,
  loginWithPhone,
  refreshAccessToken,
  logout,
  checkAuthStatus,
  sendOtp,
  verifyOtp,
  updateProfile,
  changePassword,
  changeEmail,
  changePhone,
  forgotPassword,
  resetPassword,
};
