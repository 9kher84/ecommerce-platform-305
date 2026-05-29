const WebSocket = require("ws");
const msgpack = require("msgpack-lite");
const crypto = require("crypto");

const TOKEN = "Saeed2026";
const CLIENT_ID = "openclaw-internal-cli";
const URL = "ws://127.0.0.1:8080/rpc";

const ws = new WebSocket(URL, "v3.openclaw.rpc");

function send(ws, obj) {
  ws.send(msgpack.encode(obj));
}

ws.on("open", () => {
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
  } else if (msg.result === "success" || msg.event === "connect.success") {
    // Requesting QR code now
    send(ws, {
      jsonrpc: "2.0",
      id: 100,
      method: "whatsapp.getQrCode",
    });
  } else if (msg.id === 100) {
    if (msg.result && msg.result.qr) {
      console.log("--- QR CODE DETECTED ---");
      console.log(msg.result.qr);
      process.exit(0);
    } else if (msg.result) {
      console.log(
        "Result received but no QR found:",
        JSON.stringify(msg.result),
      );
    } else if (msg.error) {
      console.log("Error from Server:", JSON.stringify(msg.error));
    }
    process.exit(1);
  }
});

setTimeout(() => {
  console.log("Timeout - No QR received.");
  process.exit(1);
}, 20000);
