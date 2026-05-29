const WebSocket = require("ws");
const crypto = require("crypto");
const fs = require("fs");
const qrcode = require("qrcode");
const path = require("path");

const TOKEN = "Saeed2026";
const CLIENT_ID = "openclaw-json-" + Date.now();
const PHONE = "966555621469";
const URL = "ws://127.0.0.1:8080/rpc";

console.log("Connecting to", URL, "using JSON only...");
const ws = new WebSocket(URL, "v3.openclaw.rpc"); // Keeping subprotocol as requested by server before, but sending JSON

const timeout = setTimeout(() => {
  console.log("TIMEOUT: Could not complete registration in 60s");
  process.exit(1);
}, 60000);

ws.on("open", () => {
  console.log("--- WEBSOCKET OPENED ---");
  const connectMsg = {
    jsonrpc: "2.0",
    id: 1,
    method: "connect",
    params: {
      auth: { token: TOKEN },
      client: { id: CLIENT_ID, mode: "operator" },
    },
  };
  ws.send(JSON.stringify(connectMsg));
  console.log("Sent initial connect as JSON...");
});

ws.on("message", async (data) => {
  let msg;
  try {
    // Since we expect JSON text now:
    msg = JSON.parse(data.toString());
  } catch (e) {
    console.error("Failed to decode message as JSON:", e.message);
    // Fallback to check if it's still binary just in case
    return;
  }

  console.log("Received JSON:", JSON.stringify(msg, null, 2));

  if (msg.event === "connect.challenge") {
    const { nonce, ts } = msg.payload;
    const dataToSign = `v3|operator|${CLIENT_ID}|${nonce}|${ts}`;
    const signature = crypto
      .createHmac("sha256", TOKEN)
      .update(dataToSign)
      .digest("hex")
      .toUpperCase();

    const response = {
      jsonrpc: "2.0",
      id: 2,
      method: "connect",
      params: {
        auth: { token: TOKEN, signature, nonce, ts: Number(ts) },
        client: { id: CLIENT_ID, mode: "operator" },
      },
    };
    ws.send(JSON.stringify(response));
    console.log("Sent JSON challenge response...");
  } else if (msg.result === "success" || msg.id === 2) {
    console.log("--- AUTHORIZED VIA JSON ---");
    ws.send(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 101,
        method: "whatsapp.getPairingCode",
        params: { phone: PHONE },
      }),
    );
    ws.send(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 102,
        method: "whatsapp.getQrCode",
      }),
    );
  } else if (msg.id === 101) {
    if (msg.result && msg.result.code) {
      console.log("JSON_CODE:" + msg.result.code);
    }
  } else if (msg.id === 102) {
    if (msg.result && msg.result.qr) {
      const qrPath = path.resolve(__dirname, "whatsapp_qr_json.png");
      await qrcode.toFile(qrPath, msg.result.qr, { width: 512, margin: 4 });
      console.log("QR Image saved to:", qrPath);
    }
  }
});

ws.on("error", (err) => console.error("WS_ERROR:", err.message));
ws.on("close", () => console.log("Connection closed."));
