import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

const socket = io("http://localhost:5000", { autoConnect: false });

const UserSupportTracker = ({ userId }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchUserTickets() {
    try {
      const response = await axios.get("http://localhost:5000/api/support/my-tickets", {
        withCredentials: true,
      });

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
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    fetchUserTickets();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    socket.connect();
    socket.emit("support:join", { userId, role: "user" });

    const handleUpdate = () => {
      fetchUserTickets();
    };

    socket.on("support:updated", handleUpdate);

    return () => {
      socket.off("support:updated", handleUpdate);
      socket.disconnect();
    };
  }, [userId]);

  if (loading)
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2].map((n) => (
          <div key={n} className="h-24 border-2 border-black bg-gray-100" />
        ))}
      </div>
    );

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between border-b-4 border-black pb-2">
        <h3 className="text-xl font-black uppercase italic tracking-tighter">
          Your Support Activity
        </h3>
        <span className="bg-black px-2 py-1 text-[10px] font-bold text-white">
          {tickets.length} TICKETS
        </span>
      </div>

      {tickets.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-widest italic text-gray-500">
            No active requests.
          </p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <div
            key={ticket._id}
            className="relative overflow-hidden border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div
              className={`absolute right-0 top-0 border-b-4 border-l-4 border-black px-4 py-1 text-[10px] font-black uppercase ${
                ticket.status === "pending"
                  ? "bg-orange-500 text-white"
                  : ticket.status === "approved"
                  ? "bg-green-500 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {ticket.status}
            </div>

            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 text-[10px] font-black uppercase text-white ${
                    ticket.type === "cancel"
                      ? "bg-red-600"
                      : ticket.type === "return"
                      ? "bg-blue-600"
                      : "bg-black"
                  }`}
                >
                  {ticket.type}
                </span>
                <span className="font-mono text-[10px] font-bold text-gray-400">
                  #REF-{ticket._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Clock size={12} />
                <span className="text-[10px] font-bold uppercase">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold leading-tight text-gray-800">
                <span className="mr-2 text-orange-600">Q:</span>
                "{ticket.message}"
              </p>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <div className="h-1.5 w-1/3 bg-black" />
              <div
                className={`h-1.5 w-1/3 ${
                  ticket.status !== "pending" ? "bg-black" : "bg-gray-200"
                }`}
              />
              <div
                className={`h-1.5 w-1/3 ${
                  ticket.status === "approved" ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            </div>

            {ticket.adminResponse ? (
              <div className="flex items-start gap-3 border-2 border-black bg-gray-50 p-4">
                <MessageCircle size={18} className="mt-1 shrink-0 text-orange-600" />
                <div>
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-orange-600">
                    Official Response
                  </span>
                  <p className="text-sm font-black italic text-gray-900">
                    {ticket.adminResponse}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">
                <RefreshCw className="h-3 w-3 animate-spin text-orange-500" />
                Waiting for review...
              </div>
            )}

            {ticket.status === "approved" ? (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Order action has been approved
              </div>
            ) : null}

            {ticket.status === "rejected" ? (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase text-red-600">
                <AlertCircle className="h-4 w-4" />
                Request was not approved
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
};

export default UserSupportTracker;
