const WebSocket = require("ws");
const msgpack = require("msgpack-lite");
const crypto = require("crypto");

const TOKEN = "Saeed2026";
const CLIENT_ID = "openclaw-internal-cli";
const URL = "ws://127.0.0.1:8080/rpc";

const ws = new WebSocket(URL, "v3.openclaw.rpc");

function send(ws, obj) {
  console.log(
    `[RPC] Sending ${obj.method || "response"} (ID: ${obj.id || "N/A"})`,
  );
  ws.send(msgpack.encode(obj));
}

ws.on("open", () => {
  console.log("Connected to " + URL);
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

ws.on("message", (data) => {
  let msg;
  try {
    msg = data[0] === 0x7b ? JSON.parse(data.toString()) : msgpack.decode(data);
  } catch (e) {
    console.log("Raw data received (failed decode):", data.toString("hex"));
    return;
  }

  console.log("Received:", JSON.stringify(msg, null, 2));

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
    console.log("--- Authorized ---");
    send(ws, {
      jsonrpc: "2.0",
      id: 100,
      method: "whatsapp.getQrCode",
    });
  }

  if (msg.result && msg.result.qr) {
    console.log("QRCODE_FOUND_IN_RESULT");
  }
  if (msg.event === "whatsapp.qrCode") {
    console.log("QRCODE_FOUND_IN_EVENT");
  }
});

ws.on("close", () => console.log("Connection closed"));
ws.on("error", (err) => console.log("Error:", err.message));

setTimeout(() => {
  console.log("Exiting after 30s");
  process.exit(0);
}, 30000);
