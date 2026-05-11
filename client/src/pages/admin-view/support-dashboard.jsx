import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  CheckCircle,
  Clock,
  Filter,
  ShieldAlert,
  XCircle,
} from "lucide-react";

const socket = io("http://localhost:5000", { autoConnect: false });

function AdminSupportDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchTickets(activeStatus = statusFilter) {
    try {
      const suffix =
        activeStatus && activeStatus !== "all" ? `?status=${activeStatus}` : "";
      const response = await axios.get(
        `http://localhost:5000/api/support/all-tickets${suffix}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setTickets(response.data.tickets || []);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    socket.connect();
    socket.emit("support:join", { role: "admin" });

    const handleUpdate = () => fetchTickets(statusFilter);
    socket.on("support:updated", handleUpdate);

    return () => {
      socket.off("support:updated", handleUpdate);
      socket.disconnect();
    };
  }, [statusFilter]);

  async function handleAction(ticket, newStatus) {
    const finalOrderStatus =
      newStatus === "approved"
        ? ticket.type === "cancel"
          ? "cancelled"
          : ticket.type === "return"
          ? "returned"
          : ticket.orderId?.orderStatus
        : ticket.orderId?.orderStatus;

    try {
      await axios.put(
        `http://localhost:5000/api/support/update-ticket/${ticket._id}`,
        {
          status: newStatus,
          orderUpdate: finalOrderStatus,
          adminResponse:
            responses[ticket._id] ||
            "Your request has been processed by the support team.",
        },
        { withCredentials: true }
      );

      fetchTickets(statusFilter);
    } catch (error) {
      console.error("Update failed:", error);
      alert(error.response?.data?.message || "Failed to update ticket");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-black" />
        <p className="font-black uppercase tracking-tighter italic">
          Scanning database...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8 flex flex-col gap-4 border-b-8 border-black pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Support <span className="text-orange-600">Command Center</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review member cancellations, returns, and order changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
            {tickets.filter((ticket) => ticket.status === "pending").length} Pending
          </div>
          <div className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2">
            <Filter className="h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="bg-transparent text-xs font-black uppercase outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {tickets.length === 0 ? (
          <div className="border-4 border-dashed border-gray-300 py-20 text-center">
            <ShieldAlert className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p className="font-bold uppercase italic tracking-widest text-gray-500">
              No tickets in this view.
            </p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket._id}
              className={`flex flex-col justify-between gap-6 border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] lg:flex-row ${
                ticket.status !== "pending" ? "opacity-80" : ""
              }`}
            >
              <div className="flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white ${
                      ticket.type === "cancel"
                        ? "bg-red-600"
                        : ticket.type === "return"
                        ? "bg-blue-600"
                        : "bg-black"
                    }`}
                  >
                    {ticket.type} request
                  </span>
                  <p className="text-lg font-black uppercase italic">
                    {ticket.userId?.userName || "Guest Member"}
                  </p>
                </div>

                <div className="mb-4 space-y-1">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <Clock className="h-3 w-3" />
                    Received: {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                  <p className="inline-block bg-gray-100 px-2 py-1 font-mono text-xs font-bold">
                    ORDER_REF: #{ticket.orderId?._id?.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Current Order Status: {ticket.orderId?.orderStatus || "unknown"}
                  </p>
                </div>

                <div className="border-2 border-black bg-orange-50 p-4 font-medium italic text-gray-800">
                  "{ticket.message}"
                </div>
              </div>

              {ticket.status === "pending" ? (
                <div className="flex w-full flex-col gap-3 lg:w-80">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Official Admin Response
                  </label>
                  <textarea
                    placeholder="Provide details for the member..."
                    className="h-24 border-2 border-black p-3 text-xs font-medium focus:bg-yellow-50 focus:outline-none"
                    value={responses[ticket._id] || ""}
                    onChange={(event) =>
                      setResponses((current) => ({
                        ...current,
                        [ticket._id]: event.target.value,
                      }))
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(ticket, "approved")}
                      className="flex-1 border-2 border-black bg-green-500 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-black"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(ticket, "rejected")}
                      className="flex-1 border-2 border-black bg-white py-3 text-xs font-black uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-red-600 hover:text-white"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end justify-center lg:w-80">
                  <div
                    className={`mb-3 border-4 border-black px-6 py-2 text-sm font-black uppercase ${
                      ticket.status === "approved" ? "bg-green-400" : "bg-red-400"
                    }`}
                  >
                    {ticket.status}
                  </div>
                  {ticket.adminResponse ? (
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-gray-400">
                        Response Sent
                      </p>
                      <p className="max-w-[220px] text-xs italic text-gray-600">
                        {ticket.adminResponse}
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-4 text-xs font-bold uppercase text-slate-500">
                    {ticket.status === "approved" ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Order updated
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        No order change applied
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminSupportDashboard;
