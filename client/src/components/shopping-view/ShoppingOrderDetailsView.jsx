import { useSelector } from "react-redux";
import { Badge } from "../ui/badge";
import { DialogContent } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import SupportRequestModal from "./support-request-modal"; 

function ShoppingOrderDetailsView({ orderDetails }) {
  const { user } = useSelector((state) => state.auth);

  // Status mapping for consistent Club branding
  const statusConfig = {
    confirmed: "bg-green-500",
    delivered: "bg-black",
    shipped: "bg-blue-600",
    cancelled: "bg-red-600",
    returned: "bg-orange-600",
    rejected: "bg-gray-500",
  };

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-4 border-black rounded-none shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <div className="flex mt-6 items-center justify-between">
            <p className="font-black uppercase text-xs italic tracking-widest">Order ID</p>
            <Label className="font-mono text-xs">#{orderDetails?._id.toUpperCase()}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-black uppercase text-xs italic tracking-widest">Order Date</p>
            <Label>{orderDetails?.orderDate.split("T")[0]}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-black uppercase text-xs italic tracking-widest">Total Amount</p>
            <Label className="text-lg font-black">${orderDetails?.totalAmount}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-black uppercase text-xs italic tracking-widest">Current Status</p>
            <Label>
              <Badge
                className={`py-1 px-4 rounded-none font-black uppercase text-[10px] tracking-tighter ${
                  statusConfig[orderDetails?.orderStatus] || "bg-black"
                }`}
              >
                {orderDetails?.orderStatus}
              </Badge>
            </Label>
          </div>
        </div>

        <Separator className="bg-black h-0.5" />

        <div className="grid gap-4">
          <div className="font-black uppercase italic text-sm tracking-tighter">Order Items</div>
          <ul className="grid gap-3">
            {orderDetails?.cartItems?.map((item) => (
              <li key={item._id} className="flex items-center justify-between bg-gray-50 p-2 border border-black/10">
                <span className="font-bold text-sm underline decoration-orange-500">{item.title} <span className="text-gray-400 font-normal">x{item.quantity}</span></span>
                <span className="font-black italic">Rs.{item.price}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4">
          <div className="font-black uppercase italic text-sm tracking-tighter">Delivery Info</div>
          <div className="grid gap-0.5 text-sm p-4 border-2 border-black bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-black uppercase">{user?.userName}</span>
            <span className="font-medium">{orderDetails?.addressInfo?.address}</span>
            <span className="font-medium text-xs text-gray-600">{orderDetails?.addressInfo?.city}, {orderDetails?.addressInfo?.pincode}</span>
            <span className="font-bold text-xs mt-1">Ph: {orderDetails?.addressInfo?.phone}</span>
          </div>
        </div>

        <Separator className="bg-black h-0.5" />

        {/* --- DYNAMIC SUPPORT SECTION --- */}
        <div className="flex flex-col gap-3 py-2">
          <div className="text-[10px] font-black uppercase text-orange-600 flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-orange-600 rounded-full animate-pulse" />
            Member Assistance & Policy Actions
          </div>
          <SupportRequestModal 
            orderDetails={orderDetails} 
            onTicketCreated={() => null}
          />
        </div>
      </div>
    </DialogContent>
  );
}

export default ShoppingOrderDetailsView;
