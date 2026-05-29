const WebSocket = require("ws");
const msgpack = require("msgpack-lite");
const crypto = require("crypto");

const TOKEN = "Saeed2026";
const CLIENT_ID = "openclaw-internal-cli";
const URL = "ws://127.0.0.1:8080/rpc";

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
  ws.send(msgpack.encode(payload));
});

ws.on("message", (data) => {
  let msg;
  try {
    // Detect if JSON or MessagePack
    msg = data[0] === 0x7b ? JSON.parse(data.toString()) : msgpack.decode(data);
  } catch (e) {
    return;
  }

  if (msg.event === "connect.challenge") {
    const { nonce, ts } = msg.payload;
    const signature = crypto
      .createHmac("sha256", TOKEN)
      .update(`v3|operator|${CLIENT_ID}|${nonce}|${ts}`)
      .digest("hex")
      .toUpperCase();

    ws.send(
      msgpack.encode({
        jsonrpc: "2.0",
        id: 2,
        method: "connect",
        params: {
          auth: { token: TOKEN, signature, nonce, ts: Number(ts) },
          client: { id: CLIENT_ID, mode: "operator" },
        },
      }),
    );
  } else if (msg.result || msg.error) {
    console.log(JSON.stringify(msg));
    process.exit(0);
  }
});

ws.on("error", (err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error("Timeout");
  process.exit(1);
}, 5000);
