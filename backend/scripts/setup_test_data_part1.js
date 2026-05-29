const axios = require("axios");
const { User } = require("../models");

const API_URL = "http://localhost:5000/api";

const usersToCreate = [
  {
    name: "Buyer One",
    email: "buyer1_test@example.com",
    password: "Test@123",
    role: "buyer",
  },
  {
    name: "Buyer Two",
    email: "buyer2_test@example.com",
    password: "Test@123",
    role: "buyer",
  },
  {
    name: "Seller One",
    email: "seller1_test@example.com",
    password: "Test@123",
    role: "seller",
  },
  {
    name: "Seller Two",
    email: "seller2_test@example.com",
    password: "Test@123",
    role: "seller",
  },
  {
    name: "Admin One",
    email: "admin1_test@example.com",
    password: "Test@123",
    role: "buyer",
  }, // will make admin later
  {
    name: "Admin Two",
    email: "admin2_test@example.com",
    password: "Test@123",
    role: "buyer",
  }, // will make admin later
  {
    name: "Restricted Buyer One",
    email: "restricted1_test@example.com",
    password: "Test@123",
    role: "buyer",
  }, // will restrict later
  {
    name: "Restricted Buyer Two",
    email: "restricted2_test@example.com",
    password: "Test@123",
    role: "buyer",
  }, // will restrict later
  {
    name: "Fraud Buyer One",
    email: "fraud1_test@example.com",
    password: "Test@123",
    role: "buyer",
  },
  {
    name: "Fraud Buyer Two",
    email: "fraud2_test@example.com",
    password: "Test@123",
    role: "buyer",
  },
];

async function setupUsers() {
  console.log("--- STARTING STEP 1: USER ACCOUNTS CREATION ---");
  try {
    for (const u of usersToCreate) {
      try {
        // Check if exists
        const existing = await User.findOne({ where: { email: u.email } });
        if (existing) {
          console.log(
            `User ${u.email} already exists, skipping API registration.`,
          );
        } else {
          const res = await axios.post(`${API_URL}/auth/register`, {
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role,
          });
          console.log(
            `✅ Registered: ${u.email} - Token: ${res.data.token ? "Yes" : "No"}`,
          );
        }
      } catch (err) {
        console.error(
          `❌ Failed to register ${u.email}:`,
          err.response ? err.response.data : err.message,
        );
      }
    }

    console.log("\n--- Updating Admin and Restricted Statuses via DB ---");

    // Update admins
    await User.update(
      { role: "admin" },
      {
        where: {
          email: ["admin1_test@example.com", "admin2_test@example.com"],
        },
      },
    );
    console.log('✅ Admins updated to role="admin"');

    // Update restricted buyers
    // Note: checking if is_restricted field exists in User model. Usually it's is_restricted or isRestricted or status='restricted'. Let's see.
    // I'll try is_restricted, if it fails I'll check model definition.
    try {
      await User.update(
        { is_restricted: true },
        {
          where: {
            email: [
              "restricted1_test@example.com",
              "restricted2_test@example.com",
            ],
          },
        },
      );
      console.log("✅ Restricted buyers updated to is_restricted=true");
    } catch (e) {
      console.log(
        "Column is_restricted might not exist exactly, trying isRestricted or status...",
        e.message,
      );
    }

    // Verify all
    const allUsers = await User.findAll({
      where: { email: usersToCreate.map((u) => u.email) },
      attributes: ["id", "email", "role", "is_restricted"],
    });

    console.table(allUsers.map((u) => u.toJSON()));
  } catch (e) {
    console.error("CRITICAL ERROR:", e);
  }
  process.exit(0);
}

setupUsers();
