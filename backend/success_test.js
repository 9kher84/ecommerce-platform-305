const WebSocket = require("ws");
const msgpack = require("msgpack-lite");
const crypto = require("crypto");

/**
 * OpenClaw RPC Gateway Test - Bypass Mode & MessagePack
 * This script connects to the gateway, handles the authentication challenge,
 * and retrieves the success result.
 */

const CONFIG = {
  URL: "ws://127.0.0.1:8080/rpc",
  PROTOCOL: "v3.openclaw.rpc",
  TOKEN: "Saeed2026",
  CLIENT_ID: "openclaw-internal-cli",
};

const ws = new WebSocket(CONFIG.URL, CONFIG.PROTOCOL);

console.log(`Connecting to ${CONFIG.URL}...`);

ws.on("open", () => {
  // Phase 1: Initial Connection
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "connect",
    params: {
      auth: { token: CONFIG.TOKEN },
      client: { id: CONFIG.CLIENT_ID, mode: "operator" },
    },
  };
  console.log("--- Step 1: Sending Initial Connect ---");
  ws.send(msgpack.encode(payload));
});

ws.on("message", (data) => {
  let msg;
  try {
    // The server currently sends JSON (starts with '{' / 0x7b)
    msg = data[0] === 0x7b ? JSON.parse(data.toString()) : msgpack.decode(data);
  } catch (e) {
    console.error("Failed to decode message:", e.message);
    return;
  }

  console.log("Received:", JSON.stringify(msg, null, 2));

  // Phase 2: Handle Challenge
  if (msg.event === "connect.challenge") {
    console.log("--- Step 2: Handling Challenge ---");
    const { nonce, ts } = msg.payload;
    const dataToSign = `v3|operator|${CONFIG.CLIENT_ID}|${nonce}|${ts}`;
    const signature = crypto
      .createHmac("sha256", CONFIG.TOKEN)
      .update(dataToSign)
      .digest("hex")
      .toUpperCase();

    const response = {
      jsonrpc: "2.0",
      id: 2,
      method: "connect",
      params: {
        auth: {
          token: CONFIG.TOKEN,
          signature: signature,
          nonce: nonce,
          ts: Number(ts),
        },
        client: { id: CONFIG.CLIENT_ID, mode: "operator" },
      },
    };
    ws.send(msgpack.encode(response));
  }

  // Success Check
  if (
    msg.result === "success" ||
    msg.event === "connect.success" ||
    (msg.type === "res" && msg.result)
  ) {
    console.log("\n✅ FINAL RESULT RECEIVED:");
    console.log(JSON.stringify(msg, null, 2));
    process.exit(0);
  }
});

ws.on("error", (err) => {
  console.error("Connection error:", err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log("Test timed out.");
  process.exit(1);
}, 8000);
