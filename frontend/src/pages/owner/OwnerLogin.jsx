import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OwnerLogin = () => {
  const [status, setStatus] = useState("idle"); // idle, loading, error
  const navigate = useNavigate();

  // Guard: Production Block
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center p-4">
        <div className="bg-red-900 text-white p-8 rounded shadow-2xl text-center">
          <h1 className="text-4xl font-bold mb-4">🚫 ACCESS DENIED</h1>
          <p>Sovereign Panel is disabled in PRODUCTION.</p>
        </div>
      </div>
    );
  }

  const handleBootstrap = async () => {
    setStatus("loading");
    try {
      // No password sent, backend relies on ENV + internal logic
      await axios.post(
        "/api/owner/bootstrap-login",
        {},
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // Essential for Cookie
        },
      );
      navigate("/owner/dashboard");
    } catch (err) {
      console.error("Bootstrap Failed", err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-neutral-900 p-8 rounded-xl border border-neutral-800 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            👑 Sovereign Panel
          </h1>
          <p className="text-neutral-500 text-sm">
            Restricted Environment • Owner Only
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-900/50 p-4 rounded text-red-200 text-xs font-mono">
            ⚠ WARNING: This interface bypasses standard security controls. Use
            with extreme caution.
          </div>

          {status === "error" && (
            <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded text-center">
              Access Denied. Integrity Check Failed.
            </div>
          )}

          <button
            onClick={handleBootstrap}
            disabled={status === "loading"}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group"
          >
            {status === "loading" ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Enter Sovereign Mode</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </>
            )}
          </button>

          <p className="text-center text-neutral-600 text-xs mt-4">
            Build: v1.0.0-SOVEREIGN
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;
