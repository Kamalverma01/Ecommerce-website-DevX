import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth`;

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

async function postAuth(url, data, withCredentials = true) {
  const response = await axios.post(url, data, { withCredentials });
  return response.data;
}

async function putAuth(url, data) {
  const response = await axios.put(url, data, { withCredentials: true });
  return response.data;
}

export const registerUser = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      return await postAuth(`${API_BASE}/register`, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Registration failed" });
    }
  }
);

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/send-otp`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "OTP send failed" });
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/verify-otp`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "OTP verification failed" });
    }
  }
);

export const changeEmail = createAsyncThunk(
  "auth/changeEmail",
  async (formData, { rejectWithValue }) => {
    try {
      return await putAuth(`${API_BASE}/change-email`, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Email update failed" });
    }
  }
);

export const changePhone = createAsyncThunk(
  "auth/changePhone",
  async (formData, { rejectWithValue }) => {
    try {
      return await putAuth(`${API_BASE}/change-phone`, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Phone update failed" });
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (formData, { rejectWithValue }) => {
    try {
      return await putAuth(`${API_BASE}/change-password`, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Password update failed" });
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      return await putAuth(`${API_BASE}/profile`, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Profile update failed" });
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (formData, { rejectWithValue }) => {
    try {
      const payload = {
        ...formData,
        identifier: formData?.identifier || formData?.email || formData?.phone || "",
      };
      return await postAuth(`${API_BASE}/login`, payload);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Login failed" });
    }
  }
);

export const getProfileSummary = createAsyncThunk(
  "auth/profileSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/profile`, { withCredentials: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Profile fetch failed" });
    }
  }
);

export const loginWithGoogle = createAsyncThunk(
  "auth/google",
  async (formData, { rejectWithValue }) => {
    try {
      return await postAuth(`${API_BASE}/google`, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Google sign-in failed" });
    }
  }
);

export const loginWithPhone = createAsyncThunk(
  "auth/phone",
  async (formData, { rejectWithValue }) => {
    try {
      return await postAuth(`${API_BASE}/phone`, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Phone sign-in failed" });
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  return postAuth(`${API_BASE}/logout`, {});
});

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/check-auth`, {
        withCredentials: true,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Session check failed" });
    }
  }
);

const fulfilledUserHandler = (state, action) => {
  state.isLoading = false;
  if (action.payload?.profileCompletionRequired || action.payload?.registrationRequired) {
    return;
  }
  state.user = action.payload?.success ? action.payload.user : null;
  state.isAuthenticated = Boolean(action.payload?.success && action.payload?.user);
};

const rejectedAuthHandler = (state) => {
  state.isLoading = false;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.rejected, rejectedAuthHandler)
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, fulfilledUserHandler)
      .addCase(loginUser.rejected, rejectedAuthHandler)
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginWithGoogle.fulfilled, fulfilledUserHandler)
      .addCase(loginWithGoogle.rejected, rejectedAuthHandler)
      .addCase(loginWithPhone.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginWithPhone.fulfilled, fulfilledUserHandler)
      .addCase(loginWithPhone.rejected, rejectedAuthHandler)
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, fulfilledUserHandler)
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(changeEmail.fulfilled, fulfilledUserHandler)
      .addCase(changePhone.fulfilled, fulfilledUserHandler)
      .addCase(updateProfile.fulfilled, fulfilledUserHandler);
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
