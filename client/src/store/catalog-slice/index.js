import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const initialState = {
  isLoading: false,
  categories: [],
  brands: [],
  categoryOptionsMap: {},
  brandOptionsMap: {},
  categoryPagination: null,
  categoryRequests: [],
};

const toOptionsMap = (items) =>
  items.reduce((acc, item) => {
    acc[item.slug] = item.name;
    return acc;
  }, {});

export const fetchCategories = createAsyncThunk(
  "/catalog/fetchCategories",
  async ({ page = 1, limit = 100 } = {}) => {
    const response = await axios.get(
      `${API_BASE_URL}/categories?page=${page}&limit=${limit}`
    );

    return response.data;
  }
);

export const addCategory = createAsyncThunk(
  "/catalog/addCategory",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/categories`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const editCategory = createAsyncThunk(
  "/catalog/editCategory",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/categories/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "/catalog/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/categories/${id}`, {
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchCategoryRequests = createAsyncThunk(
  "/catalog/fetchCategoryRequests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories/requests`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const approveCategoryRequest = createAsyncThunk(
  "/catalog/approveCategoryRequest",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/categories/requests/${id}/approve`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const rejectCategoryRequest = createAsyncThunk(
  "/catalog/rejectCategoryRequest",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/categories/requests/${id}/reject`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchBrands = createAsyncThunk("/catalog/fetchBrands", async () => {
  const response = await axios.get(`${API_BASE_URL}/brands`);

  return response.data;
});

export const uploadBrandLogo = createAsyncThunk(
  "/catalog/uploadBrandLogo",
  async (file, { rejectWithValue }) => {
    try {
      const data = new FormData();
      data.append("my_file", file);

      const response = await axios.post(`${API_BASE_URL}/brands/upload-logo`, data, {
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const addBrand = createAsyncThunk(
  "/catalog/addBrand",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/brands`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const editBrand = createAsyncThunk(
  "/catalog/editBrand",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/brands/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const deleteBrand = createAsyncThunk(
  "/catalog/deleteBrand",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/brands/${id}`, {
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload?.data || [];
        state.categoryOptionsMap = toOptionsMap(state.categories);
        state.categoryPagination = action.payload?.pagination || null;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.isLoading = false;
        state.categories = [];
        state.categoryOptionsMap = {};
        state.categoryPagination = null;
      })
      .addCase(fetchBrands.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.isLoading = false;
        state.brands = action.payload?.data || [];
        state.brandOptionsMap = toOptionsMap(state.brands);
      })
      .addCase(fetchBrands.rejected, (state) => {
        state.isLoading = false;
        state.brands = [];
        state.brandOptionsMap = {};
      })
      .addCase(fetchCategoryRequests.fulfilled, (state, action) => {
        state.categoryRequests = action.payload?.data || [];
      });
  },
});

export default catalogSlice.reducer;
