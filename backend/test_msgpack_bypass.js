const WebSocket = require("ws");
const msgpack = require("msgpack-lite");
const crypto = require("crypto");

const TOKEN = "Saeed2026";
const CLIENT_ID = "openclaw-internal-cli";
const URL = "ws://127.0.0.1:8080/rpc";

console.log(`Connecting to ${URL} in bypass mode...`);

const ws = new WebSocket(URL, "v3.openclaw.rpc");

ws.on("open", () => {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "connect",
    params: {
      auth: { token: TOKEN },
      client: { id: CLIENT_ID, mode: "operator" },
    },
  };
  console.log("Sending initial connect (MsgPack):", JSON.stringify(payload));
  ws.send(msgpack.encode(payload));
});

ws.on("message", (data) => {
  let payload;
  // Server might send JSON or MsgPack.
  // If it starts with '{' (0x7b), it's likely JSON.
  if (data[0] === 0x7b) {
    try {
      payload = JSON.parse(data.toString());
      console.log("Received JSON:", JSON.stringify(payload, null, 2));
    } catch (e) {
      console.log("Failed to parse JSON, trying MsgPack...");
    }
  }

  if (!payload) {
    try {
      payload = msgpack.decode(data);
      console.log("Received MsgPack:", JSON.stringify(payload, null, 2));
    } catch (e) {
      console.log("Failed to decode MsgPack. Raw:", data.toString());
      return;
    }
  }

  // Handle Challenge
  if (payload.event === "connect.challenge") {
    const { nonce, ts } = payload.payload;
    const dataToSign = `v3|operator|${CLIENT_ID}|${nonce}|${ts}`;
    const signature = crypto
      .createHmac("sha256", TOKEN)
      .update(dataToSign)
      .digest("hex")
      .toUpperCase();

    const responsePayload = {
      jsonrpc: "2.0",
      id: 2,
      method: "connect",
      params: {
        auth: {
          token: TOKEN,
          signature: signature,
          nonce: nonce,
          ts: Number(ts),
        },
        client: { id: CLIENT_ID, mode: "operator" },
      },
    };
    console.log(
      "Sending Challenge Response (MsgPack):",
      JSON.stringify(responsePayload),
    );
    ws.send(msgpack.encode(responsePayload));
  }

  // Handle Success
  if (
    payload.result === "success" ||
    (payload.type === "res" && payload.result)
  ) {
    console.log("✅ SUCCESS: Received Result:", payload.result);
    process.exit(0);
  }

  if (payload.error) {
    console.log("❌ ERROR:", payload.error);
    process.exit(1);
  }
});

ws.on("error", (err) => {
  console.error("WebSocket Error:", err.message);
});

ws.on("close", () => {
  console.log("Connection closed.");
});

setTimeout(() => {
  console.log("Timeout.");
  process.exit(1);
}, 10000);
