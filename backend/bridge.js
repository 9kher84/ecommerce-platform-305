const WebSocket = require("ws");
const axios = require("axios");
const crypto = require("crypto");
const msgpack = require("msgpack-lite");

require("dotenv").config();

const TOKEN = (process.env.OPENCLAW_TOKEN || "Saeed2026").trim();
const CLIENT_ID = "openclaw-internal-cli";
const OPENCLAW_WS_URL = `ws://127.0.0.1:8080/rpc`;
const WEBHOOK_URL = "https://chilly-comics-sip.lt/api/agents/webhook";

let ws;
let reqId = 0;

/**
 * Sends a JSON-RPC request over WebSocket using MessagePack encoding.
 */
function sendRPC(method, params = {}) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    reqId++;
    const payload = {
      jsonrpc: "2.0",
      id: reqId,
      method: method,
      params: params,
    };
    console.log(`[RPC] Sending ${method} (ID: ${reqId})`);
    ws.send(msgpack.encode(payload));
  } else {
    console.error(`[RPC] Cannot send ${method}: WebSocket not open`);
  }
}

/**
 * Establishes and maintains a connection to the OpenClaw Gateway.
 */
function connect() {
  console.log(`\nConnecting to OpenClaw at ${OPENCLAW_WS_URL}...`);
  ws = new WebSocket(OPENCLAW_WS_URL, "v3.openclaw.rpc");

  ws.on("open", () => {
    console.log("✅ Connected to OpenClaw /rpc (MessagePack Mode)");

    // Step 1: Initialize connection
    sendRPC("connect", {
      auth: { token: TOKEN },
      client: { id: CLIENT_ID, mode: "operator" },
    });
  });

  ws.on("message", async (data) => {
    let payload;
    try {
      // Adapt to either JSON (fallback) or MessagePack (primary)
      payload =
        data[0] === 0x7b ? JSON.parse(data.toString()) : msgpack.decode(data);
    } catch (error) {
      console.error("❌ Failed to decode message:", error.message);
      return;
    }

    // 🛡️ Handle Authentication Challenge
    if (payload.event === "connect.challenge") {
      const { nonce, ts } = payload.payload;
      const dataToSign = `v3|operator|${CLIENT_ID}|${nonce}|${ts}`;
      const signature = crypto
        .createHmac("sha256", TOKEN)
        .update(dataToSign)
        .digest("hex")
        .toUpperCase();

      console.log(
        `📡 [Handshake] Challenge Recieved: nonce=${nonce}, ts=${ts}`,
      );
      console.log(`📡 [Handshake] Signing: ${dataToSign}`);

      sendRPC("connect", {
        auth: {
          token: TOKEN,
          signature: signature,
          nonce: nonce,
          ts: Number(ts),
        },
        client: { id: CLIENT_ID, mode: "operator" },
      });
      return;
    }

    // 🔓 Handle Successful Authorization
    if (
      payload.result === "success" ||
      payload.event === "connect.success" ||
      (payload.type === "res" && payload.result === "success")
    ) {
      console.log("🟢 AUTHORIZED! Connection established and verified.");

      // Trigger the test message requested by the user
      setTimeout(() => {
        console.log("🚀 Sending test message to Saeed...");
        sendRPC("whatsapp.sendMessage", {
          to: "966555621469@c.us",
          text: "تم اختراق الحصن بنجاح يا سعيد! 🚀",
        });
      }, 1000);
      return;
    }

    // 🎯 Handle specific RPC responses
    if (payload.id === 3) {
      console.log(
        "✅ Message Response Received:",
        JSON.stringify(payload, null, 2),
      );
    }

    // Log other incoming messages/events
    if (payload.event) {
      console.log("🔔 Event Received:", payload.event);
    } else if (payload.method) {
      console.log("📡 Method Called:", payload.method);
    }

    // 📬 Forward messages to the webhook
    const msg = payload.payload || payload.data || payload;
    if (msg.from && (msg.body || msg.message)) {
      console.log(`💬 From ${msg.from}: ${msg.body || msg.message}`);
      try {
        await axios.post(WEBHOOK_URL, {
          from: msg.from,
          message: msg.body || msg.message,
          source: "openclaw-bridge",
        });
        console.log("   -> Forwarded to webhook");
      } catch (err) {
        console.error("   -> Webhook error:", err.message);
      }
    }
  });

  ws.on("close", () => {
    console.log("⚠️ WebSocket closed. Reconnecting in 5 seconds...");
    setTimeout(connect, 5000);
  });

  ws.on("error", (err) => {
    console.error("❌ WebSocket error:", err.message);
    // Closing will trigger the 'close' event and reconnection
    ws.close();
  });
}

// Start the bridge
connect();
