process.env.PORT = 5555; // Must be first!
const {
  Sequelize,
  User,
  Category,
  PurchaseRequest,
  PriceQuote,
  Role,
  Permission,
  sequelize,
} = require("../sequelize_setup");
const DataTypes = Sequelize.DataTypes;
// 🔥 Sovereign Fix: Manual Import for Test
const Message = require("../models/Message")(sequelize, DataTypes);
const io = require("socket.io-client");

// Config & Self-Hosting
const PORT = 5555;
const API_URL = `http://localhost:${PORT}/api`;
const SOCKET_URL = `http://localhost:${PORT}`;
const HEADERS = { "Content-Type": "application/json" };

let app, server;
let buyer, seller, sector, request, quote;
let buyerToken, sellerToken;
let buyerSocket, sellerSocket;

async function runTest() {
  try {
    // 1. Start Server
    console.log(
      "🚀 Starting Chat Integration Test (Self-Hosted on Port 5555)...",
    );
    app = require("../server");

    if (!app.startServer) {
      throw new Error("startServer function not found on app");
    }

    await app.startServer(true);
    console.log("✅ Test Server Started.");

    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Setup Data
    sector = await Category.create({
      name_ar: "قطاع الدردشة",
      name_en: "Chat Sector",
      type: "SECTOR",
      isActive: true,
    });

    // RBAC Setup
    const [permCreateReq] = await Permission.findOrCreate({
      where: { key: "CREATE_REQUEST" },
      defaults: { description: "Create Request" },
    });
    const [permCreateQuote] = await Permission.findOrCreate({
      where: { key: "CREATE_QUOTE" },
      defaults: { description: "Create Quote" },
    });

    const [buyerRole] = await Role.findOrCreate({
      where: { name: "buyer" },
      defaults: { description: "Buyer" },
    });
    await buyerRole.addPermission(permCreateReq);

    const [sellerRole] = await Role.findOrCreate({
      where: { name: "seller" },
      defaults: { description: "Seller" },
    });
    await sellerRole.addPermission(permCreateQuote);

    const timestamp = Date.now();
    buyer = await User.create({
      name: "Buyer Chat",
      email: `buyer_chat_${timestamp}@test.com`,
      password: "password123",
      role: "buyer",
      subscriptionTier: "plan_a",
      isActive: true,
      isVerified: true,
    });
    await buyer.addRole(buyerRole);

    seller = await User.create({
      name: "Seller Chat",
      email: `seller_chat_${timestamp}@test.com`,
      password: "password123",
      role: "seller",
      subscriptionTier: "plan_a",
      isActive: true,
      isVerified: true,
    });
    await seller.addRole(sellerRole);

    console.log("✅ Users Created");

    // 3. Login
    const loginBuyer = async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ email: buyer.email, password: "password123" }),
      });

      // Extract from Cookie (Primary Strategy due to JSON Sanitization)
      const cookies = res.headers.get("set-cookie");
      let cookieToken;
      if (cookies) {
        // Handle multiple cookies or single string
        // In node-fetch, get('set-cookie') might return all combined or just one.
        // We look for 'token='
        const match = cookies.match(/token=([^;]+)/);
        if (match) cookieToken = match[1];
      }

      const data = await res.json();
      // console.log('🔍 Login Response:', JSON.stringify(data, null, 2));
      return cookieToken || data.token || data.accessToken || data.data?.token;
    };

    const loginSeller = async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ email: seller.email, password: "password123" }),
      });

      const cookies = res.headers.get("set-cookie");
      let cookieToken;
      if (cookies) {
        const match = cookies.match(/token=([^;]+)/);
        if (match) cookieToken = match[1];
      }

      const data = await res.json();
      return cookieToken || data.token || data.accessToken || data.data?.token;
    };

    buyerToken = await loginBuyer();
    sellerToken = await loginSeller();
    console.log("✅ Users Logged In");
    console.log("🔑 Buyer Token:", buyerToken ? "Present" : "MISSING");
    console.log("🔑 Seller Token:", sellerToken ? "Present" : "MISSING");

    // 4. Create Request
    const reqRes = await fetch(`${API_URL}/requests`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        title: "Request for Chat Test",
        description: "Testing chat system",
        sectorId: sector.id,
        quantity: 10,
        unit: "pcs",
        delivery_city: "Riyadh",
        execution_date: new Date(),
        deviceFingerprint: "chat_test_device",
      }),
    });

    const reqData = await reqRes.json();
    if (!reqData.success)
      throw new Error("Request creation failed: " + JSON.stringify(reqData));

    request = reqData.data;
    const requestId = request.id;
    console.log("✅ Request Created:", requestId);

    // 5. Publish Request
    await fetch(`${API_URL}/requests/${requestId}/publish`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${buyerToken}` },
    });
    console.log("✅ Request Published");

    // 6. Submit Quote
    const quoteRes = await fetch(`${API_URL}/quotes`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        purchaseRequestId: requestId,
        priceType: "fixed",
        fixedPrice: 5000,
        amount: 5000, // Legacy/Fallback
        currency: "SAR",
        notes: "Best offer",
        deliveryTime: 7,
      }),
    });

    const quoteData = await quoteRes.json();
    if (!quoteData.success)
      throw new Error("Quote submission failed: " + JSON.stringify(quoteData));
    console.log("✅ Quote Submitted");
    // RESPONSE STRUCTURE: { success: true, quote: { id, ... } }
    const quoteId = quoteData.quote?.id || quoteData.data?.id; // Fallback for safety

    // 7. Accept Quote (Transition to deal_in_progress)
    const acceptRes = await fetch(`${API_URL}/quotes/${quoteId}/accept`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${buyerToken}` },
    });

    const acceptData = await acceptRes.json();
    if (!acceptData.success)
      throw new Error("Quote acceptance failed: " + JSON.stringify(acceptData));
    console.log("✅ Quote Accepted - Request now in deal_in_progress");

    // 8. Connect Sockets
    console.log("🔌 Connecting sockets...");

    buyerSocket = io(SOCKET_URL, {
      auth: { userId: buyer.id },
      transports: ["websocket"],
    });

    sellerSocket = io(SOCKET_URL, {
      auth: { userId: seller.id },
      transports: ["websocket"],
    });

    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for connection

    // 9. Join Request Room
    console.log("🚪 Joining request room...");

    const joinPromise = new Promise((resolve) => {
      buyerSocket.on("joined_request", (data) => {
        console.log("✅ Buyer joined room:", data.requestId);
        resolve();
      });
    });

    buyerSocket.emit("join_request", { requestId });
    await joinPromise;

    const sellerJoinPromise = new Promise((resolve) => {
      sellerSocket.on("joined_request", (data) => {
        console.log("✅ Seller joined room:", data.requestId);
        resolve();
      });
    });

    sellerSocket.emit("join_request", { requestId });
    await sellerJoinPromise;

    // 10. Send Message from Seller to Buyer
    console.log("💬 Sending message from seller...");

    const messagePromise = new Promise((resolve) => {
      buyerSocket.on("new_message", (data) => {
        console.log("✅ Buyer received message:", data.content);
        resolve(data);
      });
    });

    sellerSocket.emit("send_message", {
      requestId,
      content: "Hello, I can deliver in 5 days!",
    });

    const receivedMessage = await messagePromise;

    // 11. Verify Message in Database
    const dbMessage = await Message.findOne({
      where: { requestId, content: "Hello, I can deliver in 5 days!" },
    });

    if (!dbMessage) {
      throw new Error("❌ Message not found in database");
    }

    console.log(
      "✅ PASS: Message stored in database with timestamp:",
      dbMessage.sentAt,
    );
    console.log("📊 Message Data:", {
      id: dbMessage.id,
      requestId: dbMessage.requestId,
      senderId: dbMessage.senderId,
      receiverId: dbMessage.receiverId,
      content: dbMessage.content,
      sentAt: dbMessage.sentAt,
    });

    // 12. Test REST API
    const chatHistoryRes = await fetch(`${API_URL}/chat/${requestId}`, {
      method: "GET",
      headers: { ...HEADERS, Authorization: `Bearer ${buyerToken}` },
    });

    const chatHistory = await chatHistoryRes.json();
    if (!chatHistory.success) {
      throw new Error(
        "Failed to fetch chat history: " + JSON.stringify(chatHistory),
      );
    }

    console.log("✅ PASS: Chat history retrieved via REST API");
    console.log(`📊 Total messages: ${chatHistory.data.messages.length}`);

    console.log("\n🎉 ALL TESTS PASSED! Chat Engine is operational.");
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    // Cleanup
    if (buyerSocket) buyerSocket.disconnect();
    if (sellerSocket) sellerSocket.disconnect();
    console.log("🏁 Chat Test Completed.");
    process.exit(0);
  }
}

runTest();
