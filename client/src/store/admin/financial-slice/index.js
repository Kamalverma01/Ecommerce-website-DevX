import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../services/axiosInterceptor";

const API_URL = "/api/admin/financial";

export const fetchFinancialSummary = createAsyncThunk(
  "admin/financial/fetchSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/summary`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch financial summary");
    }
  }
);

export const fetchRevenueBreakdown = createAsyncThunk(
  "admin/financial/fetchRevenueBreakdown",
  async ({ startDate, endDate, groupBy = "daily" }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("groupBy", groupBy);

      const response = await axiosInstance.get(
        `${API_URL}/revenue/breakdown?${params.toString()}`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch revenue breakdown");
    }
  }
);

export const fetchSellerCommissions = createAsyncThunk(
  "admin/financial/fetchSellerCommissions",
  async ({ page = 1, limit = 10, sortBy = "commission", search = "" }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);
      params.append("sortBy", sortBy);
      if (search) params.append("search", search);

      const response = await axiosInstance.get(
        `${API_URL}/seller-commissions?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch seller commissions");
    }
  }
);

export const fetchFraudLogs = createAsyncThunk(
  "admin/financial/fetchFraudLogs",
  async ({ page = 1, limit = 10, status = "", sortBy = "createdAt" }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);
      params.append("sortBy", sortBy);
      if (status) params.append("status", status);

      const response = await axiosInstance.get(
        `${API_URL}/fraud-logs?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch fraud logs");
    }
  }
);

export const fetchFraudLogStats = createAsyncThunk(
  "admin/financial/fetchFraudLogStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/fraud-logs/stats`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch fraud statistics");
    }
  }
);

export const updateFraudLogStatus = createAsyncThunk(
  "admin/financial/updateFraudLogStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`${API_URL}/fraud-logs/${id}/status`, {
        status,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update fraud log status");
    }
  }
);

export const markPayoutAsPaid = createAsyncThunk(
  "admin/financial/markPayoutAsPaid",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`${API_URL}/payouts/${id}/pay`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to mark payout as paid");
    }
  }
);

export const updateCommissionSetting = createAsyncThunk(
  "admin/financial/updateCommissionSetting",
  async (commissionPercent, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`${API_URL}/commission`, {
        commissionPercent,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update commission setting");
    }
  }
);

const initialState = {
  summary: {
    data: null,
    loading: false,
    error: null,
  },
  revenueBreakdown: {
    data: [],
    loading: false,
    error: null,
  },
  sellerCommissions: {
    data: [],
    pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 },
    loading: false,
    error: null,
  },
  fraudLogs: {
    data: [],
    statusSummary: [],
    pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 },
    loading: false,
    error: null,
  },
  fraudStats: {
    data: null,
    loading: false,
    error: null,
  },
};

const financialSlice = createSlice({
  name: "admin/financial",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinancialSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchFinancialSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        state.summary.data = action.payload;
      })
      .addCase(fetchFinancialSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload;
      })

      .addCase(fetchRevenueBreakdown.pending, (state) => {
        state.revenueBreakdown.loading = true;
        state.revenueBreakdown.error = null;
      })
      .addCase(fetchRevenueBreakdown.fulfilled, (state, action) => {
        state.revenueBreakdown.loading = false;
        state.revenueBreakdown.data = action.payload;
      })
      .addCase(fetchRevenueBreakdown.rejected, (state, action) => {
        state.revenueBreakdown.loading = false;
        state.revenueBreakdown.error = action.payload;
      })

      .addCase(fetchSellerCommissions.pending, (state) => {
        state.sellerCommissions.loading = true;
        state.sellerCommissions.error = null;
      })
      .addCase(fetchSellerCommissions.fulfilled, (state, action) => {
        state.sellerCommissions.loading = false;
        state.sellerCommissions.data = action.payload.data;
        state.sellerCommissions.pagination = action.payload.pagination;
      })
      .addCase(fetchSellerCommissions.rejected, (state, action) => {
        state.sellerCommissions.loading = false;
        state.sellerCommissions.error = action.payload;
      })

      .addCase(fetchFraudLogs.pending, (state) => {
        state.fraudLogs.loading = true;
        state.fraudLogs.error = null;
      })
      .addCase(fetchFraudLogs.fulfilled, (state, action) => {
        state.fraudLogs.loading = false;
        state.fraudLogs.data = action.payload.data;
        state.fraudLogs.statusSummary = action.payload.statusSummary;
        state.fraudLogs.pagination = action.payload.pagination;
      })
      .addCase(fetchFraudLogs.rejected, (state, action) => {
        state.fraudLogs.loading = false;
        state.fraudLogs.error = action.payload;
      })

      .addCase(fetchFraudLogStats.pending, (state) => {
        state.fraudStats.loading = true;
        state.fraudStats.error = null;
      })
      .addCase(fetchFraudLogStats.fulfilled, (state, action) => {
        state.fraudStats.loading = false;
        state.fraudStats.data = action.payload;
      })
      .addCase(fetchFraudLogStats.rejected, (state, action) => {
        state.fraudStats.loading = false;
        state.fraudStats.error = action.payload;
      })

      .addCase(updateFraudLogStatus.fulfilled, (state, action) => {
        const index = state.fraudLogs.data.findIndex((log) => log._id === action.payload._id);
        if (index !== -1) {
          state.fraudLogs.data[index] = action.payload;
        }
      })

      .addCase(markPayoutAsPaid.fulfilled, (state, action) => {
        const index = state.sellerCommissions.data.findIndex(
          (seller) => seller.sellerId === action.payload.sellerId
        );
        if (index !== -1) {
          state.sellerCommissions.data[index].paidPayouts += action.payload.sellerEarning;
        }
      })

      .addCase(updateCommissionSetting.fulfilled, (state, action) => {
        if (state.summary.data) {
          state.summary.data.globalCommission = action.payload.globalCommissionPercent;
        }
      });
  },
});

export default financialSlice.reducer;
