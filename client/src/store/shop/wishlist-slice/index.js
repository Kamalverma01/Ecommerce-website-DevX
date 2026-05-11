import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  wishlist: [],
};

export const addToWishlist = createAsyncThunk(
  "/wishlist/addToWishlist",
  async ({ userId, productId }) => {
    const result = await axios.post(
      `http://localhost:5000/api/shop/wishlist/add`,
      { userId, productId },
      { withCredentials: true }
    );

    return result?.data;
  }
);

export const fetchWishlist = createAsyncThunk(
  "/wishlist/fetchWishlist",
  async (userId) => {
    const result = await axios.get(
      `http://localhost:5000/api/shop/wishlist/get/${userId}`,
      { withCredentials: true }
    );

    return result?.data;
  }
);

export const removeFromWishlist = createAsyncThunk(
  "/wishlist/removeFromWishlist",
  async ({ userId, productId }) => {
    const result = await axios.delete(
      `http://localhost:5000/api/shop/wishlist/remove/${userId}/${productId}`,
      { withCredentials: true }
    );

    return result?.data;
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(addToWishlist.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wishlist = action.payload.data;
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.isLoading = false;
        state.wishlist = [];
      })
      .addCase(removeFromWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(removeFromWishlist.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default wishlistSlice.reducer;
