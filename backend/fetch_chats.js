const WebSocket = require("ws");
const msgpack = require("msgpack-lite");
const crypto = require("crypto");

const TOKEN = "Saeed2026";
const CLIENT_ID = "openclaw-internal-cli";
const URL = "ws://127.0.0.1:8080/rpc";

const ws = new WebSocket(URL, "v3.openclaw.rpc");

console.log(`Connecting to ${URL} for Silent Commands...`);

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
  console.log("--- Sending Handshake ---");
  ws.send(msgpack.encode(payload));
});

ws.on("message", (data) => {
  let msg;
  try {
    msg = data[0] === 0x7b ? JSON.parse(data.toString()) : msgpack.decode(data);
  } catch (e) {
    return;
  }

  console.log("Received Message:", JSON.stringify(msg, null, 2));

  // 1. Handle Challenge
  if (msg.event === "connect.challenge") {
    const { nonce, ts } = msg.payload;
    const signature = crypto
      .createHmac("sha256", TOKEN)
      .update(`v3|operator|${CLIENT_ID}|${nonce}|${ts}`)
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
    console.log("--- Sending Challenge Response ---");
    ws.send(msgpack.encode(response));
  }

  // 2. Handle Connection Success
  else if (
    msg.result === "success" ||
    msg.event === "connect.success" ||
    (msg.type === "res" && msg.result === "success")
  ) {
    console.log("--- Authorized! Sending Silent Queries ---");

    // Query 1: db.query for chats
    const query1 = {
      jsonrpc: "2.0",
      id: 10,
      method: "db.query",
      params: { collection: "chats", query: {} },
    };
    console.log("Sending db.query...");
    ws.send(msgpack.encode(query1));

    // Query 2: whatsapp.getChats
    const query2 = {
      jsonrpc: "2.0",
      id: 11,
      method: "whatsapp.getChats",
    };
    console.log("Sending whatsapp.getChats...");
    ws.send(msgpack.encode(query2));
  }

  // 3. Log query results
  if (msg.id === 10 || msg.id === 11) {
    console.log(`--- Result for ID ${msg.id} ---`);
    console.log(JSON.stringify(msg, null, 2));
  }
});

ws.on("error", (err) => {
  console.error("Error:", err.message);
});

// Give it time to get results
setTimeout(() => {
  console.log("--- Closing after 10 seconds ---");
  process.exit(0);
}, 10000);
