import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchSellerOrders,
  updateSellerOrderStatus,
} from "@/store/seller/seller-slice";

const socket = io("http://localhost:5000", { autoConnect: false });

const statusOptions = [
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

function SellerOrders() {
  const dispatch = useDispatch();
  const { orders, isLoading } = useSelector((state) => state.seller);
  const { user } = useSelector((state) => state.auth);
  const [selectedStatus, setSelectedStatus] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchSellerOrders());
  }, [dispatch]);

  useEffect(() => {
    if (!user?.id) return;
    socket.connect();
    socket.emit("order:join", { sellerId: user.id, role: "seller" });

    const handleOrderUpdated = (data) => {
      if (!data) return;
      const hasSellerOrder = Array.isArray(data.sellerOrders)
        ? data.sellerOrders.some((item) => String(item.sellerId) === String(user.id))
        : false;
      if (hasSellerOrder) {
        dispatch(fetchSellerOrders());
      }
    };

    socket.on("order:updated", handleOrderUpdated);

    return () => {
      socket.off("order:updated", handleOrderUpdated);
      socket.disconnect();
    };
  }, [dispatch, user?.id]);

  function handleStatusChange(orderId, sellerOrderId, status) {
    dispatch(updateSellerOrderStatus({ orderId, sellerOrderId, orderStatus: status })).then((result) => {
      if (result.payload?.success) {
        toast({ title: "Order status updated" });
        dispatch(fetchSellerOrders());
      }
    });
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6 lg:rounded-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Seller orders</p>
        <h2 className="mt-3 text-xl font-bold text-slate-950 sm:text-2xl">Manage your order items</h2>
      </div>
      {orders?.map((order) => (
        <div key={order._id} className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6 lg:rounded-3xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Order ID</p>
              <p className="break-all font-semibold text-slate-900">{order._id}</p>
            </div>
            <div className="text-sm text-slate-500">
              Placed on {new Date(order.orderDate).toLocaleDateString()}
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {order.sellerOrders?.map((sellerOrder) => (
              <div key={sellerOrder._id} className="min-w-0 rounded-2xl border bg-slate-50 p-3 sm:p-4 lg:rounded-3xl">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Seller order</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{sellerOrder.sellerName || "Seller"}</p>
                <p className="text-sm text-slate-600">Subtotal: Rs. {sellerOrder.subtotal || 0}</p>
                <p className="text-sm text-slate-600">Status: {sellerOrder.orderStatus}</p>
                <div className="mt-3 space-y-2">
                  {sellerOrder.items?.map((item) => (
                    <div key={item.productId} className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="break-words font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">Qty: {item.quantity} - Rs. {item.lineTotal}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Select
                    value={selectedStatus[sellerOrder._id] || sellerOrder.orderStatus}
                    onValueChange={(value) => {
                      setSelectedStatus((prev) => ({ ...prev, [sellerOrder._id]: value }));
                      handleStatusChange(order._id, sellerOrder._id, value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {orders?.length === 0 && (
        <div className="rounded-2xl border bg-white p-4 text-slate-500 shadow-sm sm:p-6 lg:rounded-3xl">
          No seller order items yet.
        </div>
      )}
    </div>
  );
}

export default SellerOrders;
