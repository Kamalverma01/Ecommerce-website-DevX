/**
 * Authentication Context
 * Provides authentication state and methods to the entire application
 */

import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import * as authService from '@/services/authService';
import { getAccessToken, setAccessToken, setRefreshTokenMarker, clearAllTokens, getUserFromToken, isAuthenticated } from '@/utils/token';

/**
 * Auth Context
 * @type {React.Context}
 */
export const AuthContext = createContext(null);

/**
 * Initial auth state
 */
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isLoginLoading: false,
  isRefreshingToken: false,
};

/**
 * Auth reducer
 */
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_LOGIN_LOADING':
      return {
        ...state,
        isLoginLoading: action.payload,
      };

    case 'SET_REFRESH_LOADING':
      return {
        ...state,
        isRefreshingToken: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
      };

    case 'RESET_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

/**
 * Auth Provider Component
 * Wraps the app and provides auth context
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Initialize auth on app load
   * Checks if user has valid token and auto-login
   */
  const initializeAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Check if there's an access token in storage
      const token = getAccessToken();

      if (token && isAuthenticated()) {
        // Token is valid, set user from token
        const user = getUserFromToken();
        dispatch({ type: 'SET_USER', payload: user });
      } else if (token) {
        // Token expired, try to refresh
        try {
          const response = await authService.refreshAccessToken();
          if (response.success) {
            dispatch({ type: 'SET_USER', payload: response.user });
          } else {
            clearAllTokens();
            dispatch({ type: 'SET_USER', payload: null });
          }
        } catch (error) {
          clearAllTokens();
          dispatch({ type: 'SET_USER', payload: null });
        }
      } else {
        // No token
        dispatch({ type: 'SET_USER', payload: null });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({ type: 'SET_USER', payload: null });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Handle logout event from interceptor
   */
  useEffect(() => {
    const handleLogout = (event) => {
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Login user with email and password
   */
  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      dispatch({ type: 'SET_LOGIN_LOADING', payload: true });
      dispatch({ type: 'RESET_ERROR' });

      const response = await authService.login(email, password, rememberMe);

      if (response.success) {
        dispatch({ type: 'SET_USER', payload: response.user });
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOGIN_LOADING', payload: false });
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: 'SET_LOGIN_LOADING', payload: true });
      dispatch({ type: 'RESET_ERROR' });

      const response = await authService.register(userData);

      if (response.success) {
        dispatch({ type: 'SET_USER', payload: response.user });
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOGIN_LOADING', payload: false });
    }
  }, []);

  /**
   * Login with Google OAuth
   */
  const loginWithGoogle = useCallback(async (googleTokenData) => {
    try {
      dispatch({ type: 'SET_LOGIN_LOADING', payload: true });
      dispatch({ type: 'RESET_ERROR' });

      const response = await authService.loginWithGoogle(googleTokenData);

      if (response.success) {
        dispatch({ type: 'SET_USER', payload: response.user });
        return response;
      } else {
        throw new Error(response.message || 'Google login failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Google login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOGIN_LOADING', payload: false });
    }
  }, []);

  /**
   * Login with phone number
   */
  const loginWithPhone = useCallback(async (phoneData) => {
    try {
      dispatch({ type: 'SET_LOGIN_LOADING', payload: true });
      dispatch({ type: 'RESET_ERROR' });

      const response = await authService.loginWithPhone(phoneData);

      if (response.success) {
        dispatch({ type: 'SET_USER', payload: response.user });
        return response;
      } else {
        throw new Error(response.message || 'Phone login failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Phone login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOGIN_LOADING', payload: false });
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    try {
      dispatch({ type: 'SET_REFRESH_LOADING', payload: true });

      const response = await authService.refreshAccessToken();

      if (response.success) {
        dispatch({ type: 'SET_USER', payload: response.user });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_REFRESH_LOADING', payload: false });
    }
  }, []);

  /**
   * Forgot password - send OTP
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      dispatch({ type: 'RESET_ERROR' });
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Failed to send password reset OTP';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Reset password - verify OTP and set new password
   */
  const resetPassword = useCallback(async (email, otp, newPassword, otpSessionId) => {
    try {
      dispatch({ type: 'RESET_ERROR' });
      const response = await authService.resetPassword(email, otp, newPassword, otpSessionId);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Password reset failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      dispatch({ type: 'RESET_ERROR' });

      const response = await authService.updateProfile(profileData);

      if (response.success) {
        dispatch({ type: 'SET_USER', payload: response.user });
        return response;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'RESET_ERROR' });
  }, []);

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    isLoginLoading: state.isLoginLoading,
    isRefreshingToken: state.isRefreshingToken,

    // Methods
    login,
    register,
    loginWithGoogle,
    loginWithPhone,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    updateProfile,
    clearError,
    initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use AuthContext
 * 
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
