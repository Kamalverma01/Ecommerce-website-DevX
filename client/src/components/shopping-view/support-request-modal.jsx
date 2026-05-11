import React, { useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PackageX,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";

function getEligibility(orderDetails) {
  const orderStatus = String(orderDetails?.orderStatus || "").toLowerCase();
  const deliveredAt = orderDetails?.deliveredAt || orderDetails?.orderUpdateDate;
  const deliveredDate = deliveredAt ? new Date(deliveredAt) : null;
  const now = new Date();
  const withinReturnWindow =
    deliveredDate &&
    now.getTime() - deliveredDate.getTime() <= 4 * 24 * 60 * 60 * 1000;

  return {
    canCancel: ["pending", "processing", "confirmed"].includes(orderStatus),
    canReturn: orderStatus === "delivered" && withinReturnWindow,
    orderStatus,
  };
}

const SupportRequestModal = ({ orderDetails, onTicketCreated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ type: "", message: "" });

  if (!orderDetails) {
    return (
      <Button disabled className="mt-2 w-full border-2 border-black bg-gray-200 py-6 font-bold uppercase text-gray-500">
        Initializing...
      </Button>
    );
  }

  const { _id: orderId } = orderDetails;
  const { canCancel, canReturn, orderStatus } = getEligibility(orderDetails);
  const isAllowed = canCancel || canReturn;

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    if (!formData.type || !formData.message.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/support/create-ticket",
        {
          orderId,
          type: formData.type,
          message: formData.message.trim(),
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setOpen(false);
        setFormData({ type: "", message: "" });
        onTicketCreated?.(response.data.data);
      }
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to send request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-orange-600 py-6 font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-black">
          Cancel / Return This Order
        </Button>
      </DialogTrigger>

      <DialogContent className="overflow-hidden rounded-none border-4 border-black p-0 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] sm:max-w-[480px]">
        <div className="flex items-center justify-between bg-black p-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight">
              Support Hub
            </DialogTitle>
          </DialogHeader>
          <div className="border border-white bg-orange-500 px-2 py-1 text-[10px] font-black uppercase">
            Status: {orderStatus || "unknown"}
          </div>
        </div>

        <form onSubmit={handleCreateTicket} className="space-y-5 p-6">
          <div className="flex items-start gap-3 border-2 border-black bg-yellow-50 p-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-black" />
            <div className="text-[11px] font-bold uppercase leading-tight">
              {canCancel ? <p>Eligible for cancellation before shipment.</p> : null}
              {canReturn ? <p>Eligible for return within the 4-day window.</p> : null}
              {!isAllowed ? (
                <p className="text-red-600">Request not allowed.</p>
              ) : null}
              <p className="mt-1 text-slate-600">
                You can still send a modify request for address or support guidance.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  type: "cancel",
                  message:
                    current.message || "I would like to cancel this order before shipment.",
                }))
              }
              disabled={!canCancel}
              className={`border-2 border-black p-3 text-left ${
                formData.type === "cancel" ? "bg-red-500 text-white" : "bg-white"
              } ${!canCancel ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <PackageX className="mb-2 h-5 w-5" />
              <p className="text-xs font-black uppercase">Cancel</p>
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  type: "return",
                  message:
                    current.message || "I would like to return this order.",
                }))
              }
              disabled={!canReturn}
              className={`border-2 border-black p-3 text-left ${
                formData.type === "return" ? "bg-blue-600 text-white" : "bg-white"
              } ${!canReturn ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <RotateCcw className="mb-2 h-5 w-5" />
              <p className="text-xs font-black uppercase">Return</p>
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  type: "modify",
                  message:
                    current.message || "I need help modifying or clarifying this order.",
                }))
              }
              className={`border-2 border-black p-3 text-left ${
                formData.type === "modify" ? "bg-black text-white" : "bg-white"
              }`}
            >
              <MessageCircle className="mb-2 h-5 w-5" />
              <p className="text-xs font-black uppercase">Modify</p>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Reason
            </label>
            <textarea
              required
              className="min-h-[110px] w-full rounded-none border-2 border-black p-3 text-sm font-medium outline-none"
              placeholder="Tell the support team what happened..."
              value={formData.message}
              onChange={(event) =>
                setFormData((current) => ({ ...current, message: event.target.value }))
              }
            />
          </div>

          <Button
            disabled={loading || !formData.type || !formData.message.trim()}
            type="submit"
            className="w-full rounded-none border-2 border-black bg-black py-6 font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] hover:bg-orange-600 disabled:bg-gray-300"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Submit Ticket
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupportRequestModal;
