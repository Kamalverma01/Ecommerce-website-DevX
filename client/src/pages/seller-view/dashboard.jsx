import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerDashboard } from "@/store/seller/seller-slice";

function SellerDashboard() {
  const dispatch = useDispatch();
  const { dashboard, isLoading } = useSelector((state) => state.seller);

  useEffect(() => {
    dispatch(fetchSellerDashboard());
  }, [dispatch]);

  return (
    <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6 lg:rounded-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Your Sales</p>
        <p className="mt-4 break-words text-2xl font-black text-slate-950 sm:text-3xl lg:text-4xl">Rs. {dashboard?.totalRevenue || 0}</p>
        <p className="mt-2 text-sm text-slate-600">Total revenue from seller orders</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6 lg:rounded-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Seller Earnings</p>
        <p className="mt-4 break-words text-2xl font-black text-slate-950 sm:text-3xl lg:text-4xl">Rs. {dashboard?.totalSellerEarning || 0}</p>
        <p className="mt-2 text-sm text-slate-600">Amount retained after marketplace commission</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6 lg:rounded-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Commission Paid</p>
        <p className="mt-4 break-words text-2xl font-black text-slate-950 sm:text-3xl lg:text-4xl">Rs. {dashboard?.totalCommission || 0}</p>
        <p className="mt-2 text-sm text-slate-600">Total platform commission across your orders</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6 lg:col-span-3 lg:rounded-3xl">
        <h2 className="text-xl font-semibold text-slate-900">Sales performance</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="min-w-0 rounded-2xl border p-4">
            <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500">Top Products</h3>
            {dashboard?.topProducts?.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {dashboard.topProducts.map((item) => (
                  <li key={item.productId} className="rounded-2xl bg-slate-50 p-3">
                    <div className="break-all text-sm font-semibold text-slate-900">{item.productId}</div>
                    <div className="text-xs text-slate-500">Quantity sold: {item.quantity}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No seller orders found yet.</p>
            )}
          </div>
          <div className="min-w-0 rounded-2xl border p-4">
            <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500">Monthly sales</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {dashboard?.salesByMonth && Object.keys(dashboard.salesByMonth).length > 0 ? (
                Object.entries(dashboard.salesByMonth).map(([month, value]) => (
                  <div key={month} className="flex flex-wrap justify-between gap-2">
                    <span>{month}</span>
                    <span>Rs. {value}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No monthly sales data yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
