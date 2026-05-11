import React, { useEffect, useState } from "react";
import axios from "axios";
import { MessageSquare, Clock, CheckCircle, XCircle, Timer } from "lucide-react";

const UserSupportHistory = ({ userId }) => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchUserTickets = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/support/user/${userId}`);
        if (response.data.success) {
          setTickets(response.data.tickets);
        }
      } catch (error) {
        console.error("Error fetching support history:", error);
      }
    };
    if (userId) fetchUserTickets();
  }, [userId]);

  // Helper to calculate estimated time (Assuming 24-hour goal)
  const getEstimatedTime = (createdAt) => {
    const created = new Date(createdAt);
    const target = new Date(created.getTime() + 24 * 60 * 60 * 1000); // +24 Hours
    const now = new Date();
    
    const diff = target - now;
    if (diff <= 0) return "Processing Soon";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `~${hours}h remaining`;
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <h2 className="text-xl font-black uppercase tracking-tighter">Support Tracker</h2>
        <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Goal: 24h Resolution</span>
      </div>

      {tickets.length === 0 ? (
        <p className="text-gray-500 italic text-center py-10">No active tickets found.</p>
      ) : (
        tickets.map((ticket) => (
          <div key={ticket._id} className="border-2 border-black p-0 overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Status Header */}
            <div className={`p-2 flex justify-between items-center text-white font-bold text-xs uppercase ${
              ticket.status === 'pending' ? 'bg-orange-500' : 
              ticket.status === 'approved' ? 'bg-green-600' : 'bg-red-600'
            }`}>
              <div className="flex items-center gap-2">
                {ticket.status === 'pending' ? <Timer size={14}/> : <CheckCircle size={14}/>}
                {ticket.status === 'pending' ? 'Open / Under Review' : 'Resolved'}
              </div>
              <div>{ticket.status === 'pending' ? getEstimatedTime(ticket.createdAt) : 'Closed'}</div>
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Issue Type</p>
                  <p className="font-black text-sm uppercase">{ticket.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Ticket ID</p>
                  <p className="font-mono text-xs">#{ticket._id.slice(-6)}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded border border-dashed border-gray-300 mb-4">
                <p className="text-sm text-gray-700">"{ticket.message}"</p>
              </div>

              {/* Admin Feedback Section */}
              {ticket.adminResponse ? (
                <div className="bg-green-50 p-3 border-l-4 border-green-600">
                  <p className="text-[10px] font-black text-green-700 uppercase mb-1">Official Response:</p>
                  <p className="text-sm italic font-medium">"{ticket.adminResponse}"</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={14}/>
                  <p className="text-[10px] font-bold uppercase italic">Awaiting Admin feedback...</p>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserSupportHistory;