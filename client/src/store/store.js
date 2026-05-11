import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import adminProductsSlice from "./admin/products-slice";
import adminOrderSlice from "./admin/order-slice";
import adminFinancialSlice from "./admin/financial-slice";

import shopProductsSlice from "./shop/products-slice";
import shopCartSlice from "./shop/cart-slice";
import shopAddressSlice from "./shop/address-slice";
import shopOrderSlice from "./shop/order-slice";
import shopSearchSlice from "./shop/search-slice";
import shopReviewSlice from "./shop/review-slice";
import wishlistSlice from "./shop/wishlist-slice";
import alertSlice from "./shop/alert-slice";
import couponSlice from "./shop/coupon-slice";
import sellerSlice from "./seller/seller-slice";
import commonFeatureSlice from "./common-slice";
import catalogSlice from "./catalog-slice";

const store = configureStore({
  reducer: {
    auth: authReducer,

    adminProducts: adminProductsSlice,
    adminOrder: adminOrderSlice,
    adminFinancial: adminFinancialSlice,

    shopProducts: shopProductsSlice,
    shopCart: shopCartSlice,
    shopAddress: shopAddressSlice,
    shopOrder: shopOrderSlice,
    shopSearch: shopSearchSlice,
    shopReview: shopReviewSlice,
    wishlist: wishlistSlice,
    alerts: alertSlice,
    coupon: couponSlice,
    seller: sellerSlice,

    commonFeature: commonFeatureSlice,
    catalog: catalogSlice,
  },
});

export default store;
