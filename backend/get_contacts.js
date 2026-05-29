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
    console.log("--- Authorized ---");
    // Get contacts to see real data
    send(ws, {
      jsonrpc: "2.0",
      id: 40,
      method: "whatsapp.getContacts",
    });
  } else if (msg.id === 40) {
    console.log("CONTACTS_LIST_START");
    console.log(JSON.stringify(msg.result, null, 2));
    console.log("CONTACTS_LIST_END");
    process.exit(0);
  } else {
    console.log("Received:", JSON.stringify(msg, null, 2));
  }
});

setTimeout(() => process.exit(1), 15000);
