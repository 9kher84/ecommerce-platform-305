const net = require("net");
const axios = require("axios");

const HOST = "127.0.0.1";
const PORT = 8081;
const WEBHOOK_URL = "https://chilly-comics-sip.lt/api/agents/webhook";

console.log(`🚀 Starting Raw TCP Bridge on ${HOST}:${PORT} (No Auth Mode)...`);

function connect() {
  const client = new net.Socket();

  client.connect(PORT, HOST, () => {
    console.log("✅ Connected to Socat Raw TCP Bridge (Port 8081)");

    // 🔥 NEW: Simplified connect without Auth (Socat Tunnel Mode)
    const connectMsg =
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "connect",
        params: {},
      }) + "\n";

    client.write(connectMsg);
    console.log("📡 Connect command sent to Socat (params: {})");
  });

  client.on("data", async (data) => {
    try {
      const raw = data.toString().trim();
      console.log("📩 Received:", raw);

      // Handle multi-line or concatenated JSONs
      const lines = raw.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const payload = JSON.parse(line);

          // Auth success check
          if (
            payload.result === "success" ||
            payload.result?.status === "connected"
          ) {
            console.log("🟢 BRIDGE ACTIVE! No Auth required.");
            continue;
          }

          // Forwarding logic
          const msg =
            payload.params?.payload ||
            payload.payload ||
            payload.data ||
            payload;
          if (msg.from && (msg.body || msg.message)) {
            console.log(
              `💬 Forwarding from ${msg.from}: ${msg.body || msg.message}`,
            );
            try {
              await axios.post(WEBHOOK_URL, {
                from: msg.from,
                message: msg.body || msg.message,
              });
              console.log("   ✅ Webhook success");
            } catch (err) {
              console.error("   ❌ Webhook error:", err.message);
            }
          }
        } catch (e) {
          console.error(
            "   ⚠️ Partially malformed JSON fragment:",
            line.substring(0, 50),
          );
        }
      }
    } catch (error) {
      console.error("❌ Data processing error:", error.message);
    }
  });

  client.on("close", () => {
    console.log("⚠️ TCP Connection closed. Reconnecting in 5s...");
    setTimeout(connect, 5000);
  });

  client.on("error", (err) => {
    console.error("❌ TCP Error:", err.message);
    client.destroy();
  });
}

connect();
