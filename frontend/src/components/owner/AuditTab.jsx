import React, { useState, useEffect } from "react";
import { ownerService } from "../../services/ownerService";
import TraceViewer from "./TraceViewer";

// Legal & Audit Explorer
const AuditTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterResource, setFilterResource] = useState("");

  // Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterAction) params.action = filterAction;
      if (filterResource) params.resourceId = filterResource;

      const res = await ownerService.getAuditLogs(params);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportSignedJSON = async () => {
    if (!selectedLog) return;
    try {
      const res = await ownerService.exportAuditLog(selectedLog.id);
      // Create Blob from response
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-legal-${selectedLog.id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Export Failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header / Filter Bar */}
      <div className="flex justify-between items-end mb-6 bg-neutral-900/50 p-4 rounded border border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            Legal Audit Explorer
          </h2>
          <div className="flex gap-4">
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-1">
                Filter Action
              </label>
              <input
                className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-sm text-white w-48"
                placeholder="e.g. SUSPEND_USER_OVERRIDE"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-1">
                Resource ID
              </label>
              <input
                className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-sm text-white w-64 font-mono"
                placeholder="UUID..."
                value={filterResource}
                onChange={(e) => setFilterResource(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchLogs}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-1.5 rounded text-sm border border-neutral-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-500">Total Records</div>
          <div className="text-2xl font-mono text-white">{logs.length}</div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-neutral-500">Loading Audit Trails...</div>
      ) : (
        <div className="flex-1 overflow-auto bg-neutral-900 rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="bg-neutral-800 text-neutral-300 uppercase font-bold text-xs sticky top-0 z-10">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="p-4 font-mono text-xs text-neutral-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase border
                                            ${
                                              log.action.includes("OVERRIDE")
                                                ? "bg-red-900/20 text-red-400 border-red-900/50"
                                                : "bg-neutral-800 text-neutral-300 border-neutral-700"
                                            }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-white text-xs">
                      {log.actor?.name || "System"}
                    </div>
                    <div className="text-[10px] text-neutral-600 font-mono">
                      {log.actorId}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-mono text-neutral-300">
                      {log.resourceId}
                    </div>
                    <div className="text-[10px] text-neutral-600">
                      {log.resourceType}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-bold border-b border-dashed border-indigo-500/50"
                    >
                      VIEW NARRATIVE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legal Narrative Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] p-4">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
            {/* Legal Header */}
            <div className="p-6 border-b border-neutral-800 bg-neutral-950 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-serif text-white mb-1">
                  Official Audit Narrative
                </h3>
                <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                  Ref: {selectedLog.id}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleExportSignedJSON}
                  className="px-4 py-2 border border-neutral-600 text-neutral-300 hover:text-white rounded text-xs uppercase hover:bg-neutral-800"
                >
                  Export Signed JSON
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-white text-black font-bold rounded text-xs uppercase hover:bg-gray-200"
                >
                  Close Case
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left: The Narrative (Reason) */}
              <div className="w-1/3 p-8 border-r border-neutral-800 overflow-auto bg-neutral-950">
                <div className="mb-8">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase mb-4">
                    Sovereign Context
                  </h4>
                  <table className="w-full text-xs text-neutral-300">
                    <tbody>
                      <tr className="border-b border-neutral-900">
                        <td className="py-2 text-neutral-500">Timestamp</td>
                        <td className="py-2 text-right font-mono">
                          {selectedLog.createdAt}
                        </td>
                      </tr>
                      <tr className="border-b border-neutral-900">
                        <td className="py-2 text-neutral-500">Action Type</td>
                        <td className="py-2 text-right font-bold text-red-400">
                          {selectedLog.action}
                        </td>
                      </tr>
                      <tr className="border-b border-neutral-900">
                        <td className="py-2 text-neutral-500">
                          Executing Authority
                        </td>
                        <td className="py-2 text-right">
                          {selectedLog.actor?.name}
                        </td>
                      </tr>
                      <tr className="border-b border-neutral-900">
                        <td className="py-2 text-neutral-500">
                          Target Resource
                        </td>
                        <td className="py-2 text-right font-mono">
                          {selectedLog.resourceId}
                        </td>
                      </tr>
                      <tr className="border-b border-neutral-900">
                        <td className="py-2 text-neutral-500">Location (IP)</td>
                        <td className="py-2 text-right font-mono">
                          {selectedLog.ipAddress}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase mb-4">
                    Justification (Narrative)
                  </h4>
                  <div className="p-6 bg-neutral-900 rounded border border-neutral-800 text-sm leading-relaxed text-white font-serif">
                    "{selectedLog.details?.reason || "No narrative provided."}"
                  </div>
                </div>

                {(selectedLog.details?.from || selectedLog.details?.to) && (
                  <div className="mt-8 p-4 bg-neutral-900 rounded border border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2">
                      State Change
                    </h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-red-400">
                        {selectedLog.details.from || "N/A"}
                      </span>
                      <span className="text-neutral-600">➔</span>
                      <span className="text-green-400">
                        {selectedLog.details.to || "N/A"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: The Evidence (Trace) */}
              <div className="w-2/3 bg-black flex flex-col relative border-l border-neutral-800">
                <div className="absolute top-0 left-0 right-0 bg-neutral-900 border-b border-neutral-800 p-2 text-center text-[10px] text-neutral-500 font-mono uppercase">
                  Digital Evidence Package (Cryptographically Sealed)
                </div>
                <div className="flex-1 overflow-auto pt-8 p-4">
                  {selectedLog.details?.trace ? (
                    <TraceViewer trace={selectedLog.details.trace} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-600 italic">
                      No Forensic Trace Attached to this Record.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTab;
