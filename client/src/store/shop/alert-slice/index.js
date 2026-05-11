import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  alerts: [],
};

export const fetchUserAlerts = createAsyncThunk("alerts/fetchUserAlerts", async () => {
  const response = await axios.get("http://localhost:5000/api/alerts/user", {
    withCredentials: true,
  });

  return response.data;
});

export const markAlertRead = createAsyncThunk("alerts/markAlertRead", async (alertId) => {
  const response = await axios.put(
    `http://localhost:5000/api/alerts/read/${alertId}`,
    {},
    { withCredentials: true }
  );

  return response.data;
});

const alertSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserAlerts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload?.data || [];
      })
      .addCase(fetchUserAlerts.rejected, (state) => {
        state.isLoading = false;
        state.alerts = [];
      })
      .addCase(markAlertRead.fulfilled, (state, action) => {
        const id = action.payload?.data?._id;
        state.alerts = state.alerts.map((alert) =>
          alert._id === id ? { ...alert, isRead: true } : alert
        );
      });
  },
});

export default alertSlice.reducer;
