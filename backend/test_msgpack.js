const WebSocket = require("ws");
const msgpack = require("msgpack-lite");

const ws = new WebSocket("ws://127.0.0.1:8080/rpc");

ws.on("open", () => {
  console.log("🚀 Connecting to OpenClaw (Internal CLI Spoof)...");
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "connect",
    params: {
      auth: { token: "Saeed2026" },
      client: { id: "openclaw-internal-cli", mode: "operator" },
    },
  };
  console.log("📤 Sending MessagePack payload:", payload);
  ws.send(msgpack.encode(payload));
});

ws.on("message", (data) => {
  console.log("📥 Raw data (Text):", data.toString());
  try {
    const decoded = msgpack.decode(data);
    console.log("📥 Response (MsgPack):", JSON.stringify(decoded, null, 2));
  } catch (e) {
    console.log("❌ MsgPack decode failed");
  }
});

ws.on("error", (err) => {
  console.error("❌ WebSocket error:", err.message);
  process.exit(1);
});

ws.on("close", () => {
  console.log("⚠️ WebSocket closed");
  process.exit(0);
});

// Set a timeout to avoid hanging
setTimeout(() => {
  console.log("⏰ Timeout reached");
  process.exit(1);
}, 10000);
