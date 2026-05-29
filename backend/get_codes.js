const WebSocket = require("ws");
const msgpack = require("msgpack-lite");
const crypto = require("crypto");
const qrcodeTerm = require("qrcode-terminal");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");

const TOKEN = "Saeed2026";
const CLIENT_ID = "openclaw-internal-cli-v2"; // Changing ID to ensure fresh session
const PHONE_NUMBER = "966555621469";
const URL = "ws://127.0.0.1:8080/rpc";

const ws = new WebSocket(URL, "v3.openclaw.rpc");

function send(ws, obj) {
  ws.send(msgpack.encode(obj));
}

ws.on("open", () => {
  console.log("Connecting to OpenClaw...");
  send(ws, {
    jsonrpc: "2.0",
    id: 1,
    method: "connect",
    params: {
      auth: { token: TOKEN },
      client: { id: CLIENT_ID, mode: "operator" },
    },
  });
});

ws.on("message", async (data) => {
  let msg;
  try {
    msg = data[0] === 0x7b ? JSON.parse(data.toString()) : msgpack.decode(data);
  } catch (e) {
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

    send(ws, {
      jsonrpc: "2.0",
      id: 2,
      method: "connect",
      params: {
        auth: { token: TOKEN, signature, nonce, ts: Number(ts) },
        client: { id: CLIENT_ID, mode: "operator" },
      },
    });
  } else if (
    msg.result === "success" ||
    msg.event === "connect.success" ||
    (msg.id === 2 && msg.result === "success")
  ) {
    console.log("--- AUTHORIZED ---");
    console.log("Requesting QR Code and Pairing Code...");
    // Request QR
    send(ws, { jsonrpc: "2.0", id: 101, method: "whatsapp.getQrCode" });
    // Request Pairing Code
    send(ws, {
      jsonrpc: "2.0",
      id: 200,
      method: "whatsapp.getPairingCode",
      params: { phoneNumber: PHONE_NUMBER },
    });
  } else if (msg.id === 101) {
    if (msg.result && msg.result.qr) {
      console.log("\n--- QR CODE OBTAINED ---");
      qrcodeTerm.generate(msg.result.qr, { small: true });
      console.log("\nBase64 Data:", msg.result.qr);

      // Generate an image file as well
      const filePath = path.join(__dirname, "whatsapp_qr.png");
      await qrcode.toFile(filePath, msg.result.qr);
      console.log(`\nQR Code saved to: ${filePath}`);
    }
  } else if (msg.id === 200) {
    if (msg.result && msg.result.code) {
      console.log("\n--- PAIRING CODE ---");
      console.log("CODE:", msg.result.code);
      console.log("--------------------\n");
    }
  }
});

ws.on("close", () => console.log("Connection closed"));
ws.on("error", (err) => console.log("Error:", err.message));

setTimeout(() => {
  console.log("Timeout. Closing.");
  process.exit(0);
}, 45000);
