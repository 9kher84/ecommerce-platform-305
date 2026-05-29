const WebSocket = require("ws");
const msgpack = require("msgpack-lite");

const url = "ws://127.0.0.1:8080/rpc";
const subprotocol = "v3.openclaw.rpc";

console.log(`Connecting to ${url} with subprotocol ${subprotocol}...`);

const ws = new WebSocket(url, subprotocol);

ws.on("open", () => {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "connect",
    params: {
      auth: { token: "Saeed2026" },
    },
  };
  console.log("Sending MessagePack payload:", JSON.stringify(payload));
  ws.send(msgpack.encode(payload));
});

ws.on("message", (data) => {
  console.log("Received raw data:", data);

  // Try to decode as MessagePack
  try {
    const decoded = msgpack.decode(data);
    console.log("Decoded as MessagePack:", JSON.stringify(decoded, null, 2));
  } catch (e) {
    console.log("Failed to decode as MessagePack. Trying JSON...");
    try {
      const decoded = JSON.parse(data.toString());
      console.log("Decoded as JSON:", JSON.stringify(decoded, null, 2));
    } catch (e2) {
      console.log("Failed to decode as JSON. Raw string:", data.toString());
    }
  }

  // Check if it's a success or error
  // (We won't close immediately if it's a challenge, to see if anything else follows)

  if (data.includes && data.toString().includes("result")) {
    console.log('Found "result" in response!');
    process.exit(0);
  }
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err.message);
  process.exit(1);
});

// Set a timeout
setTimeout(() => {
  console.log("Test timed out after 5 seconds.");
  process.exit(1);
}, 5000);
