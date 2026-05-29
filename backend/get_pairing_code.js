const WebSocket = require("ws");
const msgpack = require("msgpack-lite");
const crypto = require("crypto");

const TOKEN = "Saeed2026";
const CLIENT_ID = "openclaw-internal-cli";
const PHONE_NUMBER = "966555621469"; // Your phone number without '00'
const URL = "ws://127.0.0.1:8080/rpc";

const ws = new WebSocket(URL, "v3.openclaw.rpc");

function send(ws, obj) {
  ws.send(msgpack.encode(obj));
}

ws.on("open", () => {
  console.log("Connecting to gateway...");
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
    console.log(`Requesting Pairing Code for ${PHONE_NUMBER}...`);

    // Trying variety of param names to be safe
    send(ws, {
      jsonrpc: "2.0",
      id: 200,
      method: "whatsapp.getPairingCode",
      params: {
        phonenumber: PHONE_NUMBER,
        phoneNumber: PHONE_NUMBER,
        phone: PHONE_NUMBER,
        number: PHONE_NUMBER,
      },
    });
  } else if (msg.id === 200) {
    if (msg.result && msg.result.code) {
      console.log("\n=======================================");
      console.log("YOUR PAIRING CODE IS:", msg.result.code);
      console.log("=======================================\n");
      process.exit(0);
    } else {
      console.log("Server response (No Code):", JSON.stringify(msg, null, 2));
      process.exit(1);
    }
  } else if (msg.error) {
    console.log("Error from Server:", JSON.stringify(msg.error, null, 2));
    process.exit(1);
  }
});

setTimeout(() => {
  console.log("Timeout - No response from gateway.");
  process.exit(1);
}, 20000);
