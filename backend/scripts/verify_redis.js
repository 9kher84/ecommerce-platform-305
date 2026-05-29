const Redis = require("ioredis");

async function verifyRedis() {
  console.log("🔄 Attempting to connect to Redis at localhost:6379...");

  const client = new Redis({
    host: "localhost",
    port: 6379,
    colors: true,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying
      }
      return 500;
    },
  });

  client.on("connect", () => {
    console.log("✅ Connected to Redis successfully!");
  });

  client.on("ready", async () => {
    console.log("✅ Redis client is ready.");
    try {
      await client.set("test_key", "Hello from validation script");
      const value = await client.get("test_key");
      console.log(`✅ Write/Read test successful: Retrieved '${value}'`);

      await client.del("test_key");
      console.log("✅ Cleanup successful.");

      client.disconnect();
      process.exit(0);
    } catch (err) {
      console.error("❌ Redis operation failed:", err);
      client.disconnect();
      process.exit(1);
    }
  });

  client.on("error", (err) => {
    console.error("❌ Redis connection error:", err.message);
  });

  client.on("end", () => {
    console.log("Redis connection closed.");
  });

  // Timeout if it takes too long
  setTimeout(() => {
    if (client.status !== "ready") {
      console.error("❌ Timeout waiting for Redis connection.");
      client.disconnect();
      process.exit(1);
    }
  }, 5000);
}

verifyRedis();
