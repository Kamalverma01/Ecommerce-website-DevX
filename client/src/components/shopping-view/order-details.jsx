import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { Badge } from "../ui/badge";
import { DialogContent } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import SupportRequestModal from "./support-request-modal";

const socket = io("http://localhost:5000", { autoConnect: false });

function ShoppingOrderDetailsView({ orderDetails }) {
  const { user } = useSelector((state) => state.auth);
  const [liveOrder, setLiveOrder] = useState(orderDetails);

  useEffect(() => {
    setLiveOrder(orderDetails);
  }, [orderDetails]);

  useEffect(() => {
    if (!orderDetails?._id) return;

    socket.connect();
    socket.emit("order:join", {
      orderId: orderDetails._id,
      userId: user?.id,
      role: "user",
    });

    const handleOrderUpdated = (data) => {
      if (!data || data.orderId !== orderDetails._id) return;
      setLiveOrder((current) => ({ ...current, ...data }));
    };

    socket.on("order:updated", handleOrderUpdated);

    return () => {
      socket.off("order:updated", handleOrderUpdated);
      socket.disconnect();
    };
  }, [orderDetails?._id, user?.id]);

  const displayOrder = liveOrder || orderDetails;

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <div className="flex mt-6 items-center justify-between">
            <p className="font-medium">Order ID</p>
            <Label>{displayOrder?._id}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Date</p>
            <Label>{displayOrder?.orderDate?.split("T")[0]}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Price</p>
            <Label>Rs.{displayOrder?.totalAmount}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Payment method</p>
            <Label>{displayOrder?.paymentMethod}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Payment Status</p>
            <Label>{displayOrder?.paymentStatus}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Status</p>
            <Label>
              <Badge
                className={`py-1 px-3 ${
                  displayOrder?.orderStatus === "confirmed"
                    ? "bg-green-500"
                    : displayOrder?.orderStatus === "rejected"
                    ? "bg-red-600"
                    : "bg-black"
                }`}
              >
                {displayOrder?.orderStatus}
              </Badge>
            </Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Tracking ID</p>
            <Label>{displayOrder?.trackingId || "Not assigned"}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Last update</p>
            <Label>{displayOrder?.orderUpdateDate ? new Date(displayOrder.orderUpdateDate).toLocaleString() : "Pending"}</Label>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Order Details</div>
            <ul className="grid gap-3">
              {displayOrder?.cartItems && displayOrder?.cartItems.length > 0
                ? displayOrder.cartItems.map((item) => (
                    <li key={item._id || item.productId} className="flex items-center justify-between">
                      <span>Title: {item.title}</span>
                      <span>Quantity: {item.quantity}</span>
                      <span>Price: Rs.{item.price}</span>
                    </li>
                  ))
                : null}
            </ul>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Shipping Info</div>
            <div className="grid gap-0.5 text-muted-foreground">
              <span>{user.userName}</span>
              <span>{displayOrder?.addressInfo?.address}</span>
              <span>{displayOrder?.addressInfo?.city}</span>
              <span>{displayOrder?.addressInfo?.pincode}</span>
              <span>{displayOrder?.addressInfo?.phone}</span>
              <span>{displayOrder?.addressInfo?.notes}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* 2. ADDED SUPPORT SECTION HERE */}
        <div className="flex flex-col gap-3 py-2">
          <div className="text-sm font-bold uppercase text-gray-500">
            Need to cancel or return this gear?
          </div>
          <SupportRequestModal 
            orderDetails={displayOrder}
            onTicketCreated={() => null}
          />
        </div>
      </div>
    </DialogContent>
  );
}

export default ShoppingOrderDetailsView;
