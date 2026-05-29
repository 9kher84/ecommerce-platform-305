import React, { useState, useEffect } from "react";
import axios from "axios";

const OwnerPanel = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [deals, setDeals] = useState([]); // Placeholder if needed

  useEffect(() => {
    fetchSupervisors();
    fetchCommissions();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const { data } = await axios.get("/api/owner/supervisors/available");
      setSupervisors(data.data);
    } catch (error) {
      console.error("Error fetching supervisors", error);
    }
  };

  const fetchCommissions = async () => {
    try {
      const { data } = await axios.get("/api/owner/commission-reports");
      setCommissions(data.data);
    } catch (error) {
      console.error("Error fetching commissions", error);
    }
  };

  const handleAssign = async (dealId, supervisorId) => {
    try {
      await axios.post(`/api/owner/deals/${dealId}/assign-supervisor`, {
        supervisorId,
      });
      alert("Assigned successfully");
      fetchCommissions();
    } catch (error) {
      alert("Failed to assign supervisor");
    }
  };

  const handleRemove = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to remove this assignment?"))
      return;
    try {
      await axios.delete(`/api/owner/assignments/${assignmentId}`);
      alert("Removed successfully");
      fetchCommissions();
    } catch (error) {
      alert("Failed to remove assignment");
    }
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">
        Owner Panel - Supervisor Management
      </h1>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Commission Reports</h2>
        <div className="bg-white p-4 shadow rounded">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2">Supervisor</th>
                <th className="border-b p-2">Deal ID</th>
                <th className="border-b p-2">Amount</th>
                <th className="border-b p-2">Status</th>
                <th className="border-b p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id}>
                  <td className="border-b p-2">
                    {c.supervisor?.name || "N/A"}
                  </td>
                  <td className="border-b p-2">{c.deal_id}</td>
                  <td className="border-b p-2">{c.amount} SAR</td>
                  <td className="border-b p-2">{c.status}</td>
                  <td className="border-b p-2">
                    <button
                      onClick={() => handleRemove(c.assignment_id)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Remove Assignment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OwnerPanel;
