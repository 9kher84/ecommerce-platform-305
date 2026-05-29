const WebSocket = require("ws");
const msgpack = require("msgpack-lite");
const crypto = require("crypto");
const fs = require("fs");
const qrcode = require("qrcode");
const path = require("path");

const TOKEN = "Saeed2026";
const CLIENT_ID = "openclaw-final-" + Date.now();
const PHONE = "966555621469";
const URL = "ws://127.0.0.1:8080/rpc";

console.log("Connecting to", URL, "protocol v3.openclaw.rpc...");
const ws = new WebSocket(URL, "v3.openclaw.rpc");

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
  ws.send(msgpack.encode(connectMsg));
  console.log("Sent initial connect...");
});

ws.on("message", async (data) => {
  let msg;
  try {
    if (data[0] === 0x7b) {
      msg = JSON.parse(data.toString());
    } else {
      msg = msgpack.decode(data);
    }
  } catch (e) {
    console.error("Failed to decode message:", e.message);
    return;
  }

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
    ws.send(msgpack.encode(response));
  } else if (msg.result === "success" || msg.id === 2) {
    console.log("--- AUTHORIZED ---");
    ws.send(
      msgpack.encode({
        jsonrpc: "2.0",
        id: 101,
        method: "whatsapp.getPairingCode",
        params: { phone: PHONE },
      }),
    );
    ws.send(
      msgpack.encode({
        jsonrpc: "2.0",
        id: 102,
        method: "whatsapp.getQrCode",
      }),
    );
  } else if (msg.id === 101) {
    if (msg.result && msg.result.code) {
      console.log("PAIRING_CODE:" + msg.result.code);
    } else if (msg.error) {
      console.log("PAIRING_ERROR:" + JSON.stringify(msg.error));
    }
  } else if (msg.id === 102) {
    if (msg.result && msg.result.qr) {
      const qrPath = path.resolve(__dirname, "whatsapp_qr.png");
      await qrcode.toFile(qrPath, msg.result.qr);
      console.log("QR_SAVED");
    }
  }
});

ws.on("error", (err) => console.error("WS_ERROR:", err.message));
