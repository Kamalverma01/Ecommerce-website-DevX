import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/seller";

const initialState = {
  isLoading: false,
  application: null,
  dashboard: null,
  products: [],
  orders: [],
  brands: [],
  error: null,
};

export const applySeller = createAsyncThunk(
  "seller/applySeller",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/apply`, formData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Seller application failed" });
    }
  }
);

export const fetchSellerApplication = createAsyncThunk(
  "seller/fetchApplication",
  async () => {
    const response = await axios.get(`${API_BASE}/application`, {
      withCredentials: true,
    });
    return response.data;
  }
);

export const fetchSellerDashboard = createAsyncThunk(
  "seller/fetchDashboard",
  async () => {
    const response = await axios.get(`${API_BASE}/dashboard`, {
      withCredentials: true,
    });
    return response.data;
  }
);

export const fetchSellerProducts = createAsyncThunk(
  "seller/fetchProducts",
  async () => {
    const response = await axios.get(`${API_BASE}/products`, {
      withCredentials: true,
    });
    return response.data;
  }
);

export const uploadSellerProductImages = createAsyncThunk(
  "seller/uploadProductImages",
  async (files, { rejectWithValue }) => {
    try {
      const data = new FormData();
      Array.from(files).forEach((file) => data.append("images", file));
      const response = await axios.post(`${API_BASE}/products/upload-images`, data, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Product image upload failed" });
    }
  }
);

export const fetchSellerBrands = createAsyncThunk(
  "seller/fetchBrands",
  async () => {
    const response = await axios.get(`${API_BASE}/brands`, {
      withCredentials: true,
    });
    return response.data;
  }
);

export const uploadSellerBrandLogo = createAsyncThunk(
  "seller/uploadBrandLogo",
  async (file, { rejectWithValue }) => {
    try {
      const data = new FormData();
      data.append("my_file", file);
      const response = await axios.post(`${API_BASE}/brands/upload-logo`, data, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Brand logo upload failed" });
    }
  }
);

export const createSellerBrand = createAsyncThunk(
  "seller/createBrand",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/brands`, formData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Create brand failed" });
    }
  }
);

export const requestSellerCategory = createAsyncThunk(
  "seller/requestCategory",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/category-requests`, formData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Category request failed" });
    }
  }
);

export const addSellerProduct = createAsyncThunk(
  "seller/addProduct",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/products`, formData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Add product failed" });
    }
  }
);

export const editSellerProduct = createAsyncThunk(
  "seller/editProduct",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE}/products/${id}`, formData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Edit product failed" });
    }
  }
);

export const deleteSellerProduct = createAsyncThunk(
  "seller/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE}/products/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Delete product failed" });
    }
  }
);

export const fetchSellerOrders = createAsyncThunk(
  "seller/fetchOrders",
  async () => {
    const response = await axios.get(`${API_BASE}/orders`, {
      withCredentials: true,
    });
    return response.data;
  }
);

export const updateSellerOrderStatus = createAsyncThunk(
  "seller/updateOrderStatus",
  async ({ orderId, sellerOrderId, orderStatus }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE}/orders/${orderId}/status`,
        { sellerOrderId, orderStatus },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Update order status failed" });
    }
  }
);

const sellerSlice = createSlice({
  name: "seller",
  initialState,
  reducers: {
    clearSellerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applySeller.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applySeller.fulfilled, (state, action) => {
        state.isLoading = false;
        state.application = action.payload.data;
      })
      .addCase(applySeller.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.error.message;
      })
      .addCase(fetchSellerApplication.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSellerApplication.fulfilled, (state, action) => {
        state.isLoading = false;
        state.application = action.payload.data;
      })
      .addCase(fetchSellerApplication.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchSellerDashboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSellerDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload.data;
      })
      .addCase(fetchSellerDashboard.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchSellerProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data || [];
      })
      .addCase(fetchSellerProducts.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchSellerBrands.fulfilled, (state, action) => {
        state.brands = action.payload.data || [];
      })
      .addCase(addSellerProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addSellerProduct.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(addSellerProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.error.message;
      })
      .addCase(editSellerProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(editSellerProduct.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(editSellerProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.error.message;
      })
      .addCase(deleteSellerProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteSellerProduct.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteSellerProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.error.message;
      })
      .addCase(fetchSellerOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data || [];
      })
      .addCase(fetchSellerOrders.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(updateSellerOrderStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSellerOrderStatus.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateSellerOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.error.message;
      });
  },
});

export const { clearSellerError } = sellerSlice.actions;
export default sellerSlice.reducer;
