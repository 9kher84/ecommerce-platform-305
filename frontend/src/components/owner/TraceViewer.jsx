import React, { useState } from "react";

const TraceViewer = ({ trace, onClose }) => {
  const [expandedRule, setExpandedRule] = useState(null);

  if (!trace) return null;

  const timeline = trace.timeline || [];
  const contextViolations = trace.contextAnalysis?.violations || [];
  const isPoisoned = trace.contextAnalysis?.status === "POISONED";
  const isTampered = trace.integrity?.tamperDetected;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Canonical Policy Trace
              </h2>
              <span className="font-mono text-[10px] text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                v{trace.traceVersion || "1.0"}
              </span>
            </div>
            <div className="flex gap-4 text-xs font-mono text-neutral-400">
              <span>
                ID:{" "}
                <span className="text-neutral-200">
                  {trace.traceId?.slice(0, 8)}...
                </span>
              </span>
              <span>
                ACTOR:{" "}
                <span className="text-neutral-200">{trace.actor?.type}</span>
              </span>
              <span>
                ACTION: <span className="text-indigo-400">{trace.action}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className={`px-4 py-1 rounded-full text-sm font-bold border ${getPillStyle(trace.decision)}`}
            >
              {trace.decision}
            </div>
            {isPoisoned && (
              <span className="text-xs text-red-500 font-bold bg-red-900/20 px-2 py-0.5 rounded border border-red-900">
                ☣️ POISONED CONTEXT
              </span>
            )}
            {isTampered && (
              <span className="text-xs text-red-500 font-bold bg-red-900/20 px-2 py-0.5 rounded border border-red-900">
                🔓 TAMPER DETECTED
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-neutral-900 grid grid-cols-3 gap-6">
          {/* Left: Metadata & Context */}
          <div className="col-span-1 space-y-6">
            {/* Context Analysis Widget */}
            <div
              className={`p-4 rounded-lg border ${isPoisoned ? "bg-red-900/10 border-red-800" : "bg-neutral-950 border-neutral-800"}`}
            >
              <h3 className="text-xs font-bold uppercase text-neutral-400 mb-3">
                Context Analysis
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Status</span>
                  <span
                    className={
                      isPoisoned
                        ? "text-red-400 font-bold"
                        : "text-green-400 font-bold"
                    }
                  >
                    {trace.contextAnalysis?.status || "UNKNOWN"}
                  </span>
                </div>
                {contextViolations.map((v, i) => (
                  <div
                    key={i}
                    className="text-[10px] bg-red-900/20 p-2 rounded border border-red-900/30 text-red-300 mt-2"
                  >
                    <div className="font-bold">{v.field}</div>
                    <div>
                      {v.receivedType} !== {v.expectedType}
                    </div>
                    {v.reason && (
                      <div className="text-red-400 mt-1">
                        Reason: {v.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Integrity Widget */}
            <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
              <h3 className="text-xs font-bold uppercase text-neutral-400 mb-3">
                Cryptographic Seal
              </h3>
              <div className="space-y-2 font-mono text-[10px] break-all">
                <div>
                  <span className="text-neutral-600 block mb-1">
                    HMAC Signature
                  </span>
                  <span className="text-emerald-400/80">
                    {trace.integrity?.signature?.slice(0, 32)}...
                  </span>
                </div>
                <div>
                  <span className="text-neutral-600 block mb-1">
                    Payload Hash
                  </span>
                  <div className="text-neutral-400">
                    {trace.integrity?.hash?.slice(0, 32)}...
                  </div>
                </div>
                <div className="pt-2 border-t border-neutral-800 mt-2">
                  <span className="text-neutral-500">Policy Version:</span>{" "}
                  <span className="text-blue-400">
                    {trace.meta?.policyVersion}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Timeline */}
          <div className="col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase text-neutral-400">
              Rule Execution Timeline
            </h3>
            <div className="relative border-l-2 border-neutral-800 ml-3 space-y-6 pb-4">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Dot */}
                  <div
                    className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-neutral-900 ${getDotColor(event.result)}`}
                  />

                  {/* Card */}
                  <div
                    className={`p-3 rounded border transition-all cursor-pointer hover:bg-neutral-800/50 ${expandedRule === idx ? "bg-neutral-800 border-neutral-600" : "bg-neutral-950 border-neutral-800"}`}
                    onClick={() =>
                      setExpandedRule(expandedRule === idx ? null : idx)
                    }
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white font-mono">
                            {event.ruleId}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase">
                            {event.ruleType || event.type}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          {event.description || event.expression}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getResultBadge(event.result)}`}
                        >
                          {event.result}
                        </span>
                        <span className="text-[9px] text-neutral-600 mt-1 uppercase tracking-wider">
                          {event.decisionImpact}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedRule === idx && (
                      <div className="mt-3 pt-3 border-t border-neutral-700/50 text-xs font-mono text-neutral-400">
                        <div className="mb-2">
                          <span className="text-neutral-500">Expression:</span>{" "}
                          <span className="text-yellow-500/80">
                            {event.expression}
                          </span>
                        </div>
                        <div className="bg-neutral-900 p-2 rounded">
                          <div className="text-[10px] text-neutral-500 uppercase mb-1">
                            Captured Inputs
                          </div>
                          {Object.entries(event.inputs).map(([key, val]) => (
                            <div
                              key={key}
                              className="flex justify-between py-0.5 border-b border-neutral-800 last:border-0"
                            >
                              <span className="text-blue-300">{key}</span>
                              <span
                                className={
                                  val.status === "POISONED"
                                    ? "text-red-500 font-bold"
                                    : "text-neutral-300"
                                }
                              >
                                {String(val.value)}
                                {val.status !== "VALID" && (
                                  <span className="ml-2 px-1 rounded bg-neutral-800 text-[8px] border border-neutral-700">
                                    {val.status}
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black font-bold text-sm rounded hover:bg-neutral-200"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};

// Utils
function getPillStyle(decision) {
  if (decision === "ALLOW")
    return "bg-green-900/20 border-green-700 text-green-400";
  if (decision === "DENY") return "bg-red-900/20 border-red-700 text-red-400";
  return "bg-blue-900/20 border-blue-700 text-blue-400"; // Force?
}

function getDotColor(result) {
  if (result === "PASS") return "bg-green-500";
  if (result === "FAIL") return "bg-red-500";
  if (result === "SKIPPED") return "bg-neutral-600";
  return "bg-blue-500";
}

function getResultBadge(result) {
  if (result === "PASS") return "bg-green-900/30 text-green-400";
  if (result === "FAIL") return "bg-red-900/30 text-red-400";
  if (result === "SKIPPED") return "bg-neutral-800 text-neutral-500";
  return "bg-blue-900/30 text-blue-400";
}

export default TraceViewer;
