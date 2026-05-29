import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const SupervisorPanel = () => {
  const [activeTab, setActiveTab] = useState("deals");
  const [deals, setDeals] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDeals();
    fetchCommissions();
    fetchNotifications();

    // Socket logic
    const socket = io("/supervisor_notifications");
    socket.on("new_notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data } = await axios.get("/api/supervisor/deals");
      setDeals(data.data);
    } catch (e) {}
  };

  const fetchCommissions = async () => {
    try {
      const { data } = await axios.get("/api/supervisor/commissions");
      setCommissions(data.data);
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get("/api/supervisor/notifications");
      setNotifications(data.data);
    } catch (e) {}
  };

  const markRead = async (id) => {
    try {
      await axios.put(`/api/supervisor/notifications/${id}/read`);
      fetchNotifications();
    } catch (e) {}
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Supervisor Panel</h1>

      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab("deals")}
          className={`pb-2 ${activeTab === "deals" ? "border-b-2 border-blue-500" : ""}`}
        >
          Assigned Deals
        </button>
        <button
          onClick={() => setActiveTab("commissions")}
          className={`pb-2 ${activeTab === "commissions" ? "border-b-2 border-blue-500" : ""}`}
        >
          My Commissions
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`pb-2 ${activeTab === "notifications" ? "border-b-2 border-blue-500" : ""}`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-2 ${activeTab === "reports" ? "border-b-2 border-blue-500" : ""}`}
        >
          Reports
        </button>
      </div>

      {activeTab === "deals" && (
        <div>
          <h2 className="text-xl mb-4">Assigned Deals</h2>
          <ul className="space-y-2">
            {deals.map((d) => (
              <li key={d.id} className="p-4 bg-gray-50 border rounded">
                Deal ID: {d.deal_id} (Platform Share: {d.platform_share}%, Your
                Share: {d.supervisor_share}%)
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "commissions" && (
        <div>
          <h2 className="text-xl mb-4">My Commissions</h2>
          <ul className="space-y-2">
            {commissions.map((c) => (
              <li key={c.id} className="p-4 bg-gray-50 border rounded">
                Amount: {c.amount} SAR | Status: {c.status} | Deal ID:{" "}
                {c.deal_id}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "notifications" && (
        <div>
          <h2 className="text-xl mb-4">Notifications</h2>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`p-4 border rounded ${n.read ? "bg-gray-100" : "bg-blue-50"}`}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-sm text-blue-500 underline mt-2"
                  >
                    Mark as Read
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "reports" && (
        <div>
          <h2 className="text-xl mb-4">Custom Reports</h2>
          <p>No custom reports yet</p>
        </div>
      )}
    </div>
  );
};

export default SupervisorPanel;
