const RequestService = require("./services/requestService");
const {
  sequelize,
  User,
  Category,
  PurchaseRequest,
} = require("./sequelize_setup");
const { Op } = require("sequelize");

// Mock console.log to capture output
const originalLog = console.log;
const logs = [];
console.log = (...args) => {
  logs.push(args.join(" "));
  originalLog(...args);
};

// Mock sequelize.query to capture SQL without executing
const originalQuery = sequelize.query;
const capturedQueries = [];

sequelize.query = async (sql, options) => {
  capturedQueries.push({ sql, options });
  // Return mock data structure expected by the service
  if (sql.includes("COUNT(*)")) return [{ count: 10 }];
  return [
    {
      id: 1,
      userId: 1,
      categoryId: 1,
      title: "Test Request",
      status: "published",
      expiresAt: new Date(),
      delivery_city: "Riyadh",
      createdAt: new Date(),
    },
  ];
};

// Mock PurchaseRequest.findAll/findAndCountAll
PurchaseRequest.findAll = async (options) => {
  capturedQueries.push({ type: "findAll", options });
  return [];
};
PurchaseRequest.findAndCountAll = async (options) => {
  capturedQueries.push({ type: "findAndCountAll", options });
  return { count: 0, rows: [] };
};

async function runTests() {
  console.log("🚀 Starting Request Fetching Tests...\n");

  // Scenario 1: Free Tier + City Filter Only
  console.log('--- Scenario 1: Free Tier + City Filter "Riyadh" ---');
  capturedQueries.length = 0;
  await RequestService.getAllRequests("buyer", "free", { city: "الرياض" });
  analyzeQuery(capturedQueries[0], "Scenario 1");

  // Scenario 2: Free Tier + Search Query Only
  console.log('\n--- Scenario 2: Free Tier + Search "Cement" ---');
  capturedQueries.length = 0;
  await RequestService.getAllRequests("buyer", "free", {
    searchQuery: "إسمنت",
  });
  analyzeQuery(capturedQueries[0], "Scenario 2");

  // Scenario 3: Free Tier + City + Search
  console.log(
    '\n--- Scenario 3: Free Tier + City "Riyadh" + Search "Cement" ---',
  );
  capturedQueries.length = 0;
  await RequestService.getAllRequests("buyer", "free", {
    city: "الرياض",
    searchQuery: "إسمنت",
  });
  analyzeQuery(capturedQueries[0], "Scenario 3");

  // Scenario 4: Premium User (Plan A) + Same Filters
  console.log("\n--- Scenario 4: Premium (Plan A) + City + Search ---");
  capturedQueries.length = 0;
  await RequestService.getAllRequests("buyer", "plan_a", {
    city: "الرياض",
    searchQuery: "إسمنت",
  });
  analyzePremiumQuery(capturedQueries[0], "Scenario 4");
}

function analyzeQuery(queryData, scenarioName) {
  if (!queryData || !queryData.sql) {
    console.error(`❌ ${scenarioName}: No SQL query generated!`);
    return;
  }

  const sql = queryData.sql;
  const replacements = queryData.options.replacements;

  console.log(`✅ SQL Generated: Yes`);

  // Check for City Filter
  if (scenarioName.includes("City")) {
    if (sql.includes('"delivery_city" = :param')) {
      console.log(`✅ City Filter: Present`);
    } else {
      console.error(`❌ City Filter: MISSING!`);
    }
  }

  // Check for Search Query
  if (scenarioName.includes("Search")) {
    if (sql.includes("ILIKE :param")) {
      console.log(`✅ Search Filter: Present`);
    } else {
      console.error(`❌ Search Filter: MISSING!`);
    }
  }

  // Check for ROW_NUMBER (Free Tier Limit)
  if (sql.includes("ROW_NUMBER() OVER")) {
    console.log(`✅ Free Tier Limit (ROW_NUMBER): Present`);
  } else {
    console.error(`❌ Free Tier Limit: MISSING!`);
  }

  // Check for correct column names (sample)
  if (sql.includes("deliveryLocations") && sql.includes("contactNumbers")) {
    console.log(`✅ Column Names: Correct`);
  } else {
    console.error(`❌ Column Names: Incorrect or Old!`);
  }

  console.log("--- SQL Snippet ---");
  console.log(sql.replace(/\s+/g, " ").substring(0, 200) + "...");
}

function analyzePremiumQuery(queryData, scenarioName) {
  if (!queryData || queryData.type !== "findAndCountAll") {
    console.error(
      `❌ ${scenarioName}: Expected findAndCountAll (Sequelize), got raw query!`,
    );
    return;
  }
  console.log(`✅ Used Sequelize findAndCountAll (No Raw SQL)`);

  const where = queryData.options.where;

  // Check City
  if (where.delivery_city === "الرياض") {
    console.log(`✅ City Filter: Correct (${where.delivery_city})`);
  } else {
    console.error(`❌ City Filter: Missing or Incorrect`);
  }

  // Check Search (Complex Op.and structure)
  const opAnd = where[Op.and];
  if (opAnd && opAnd.length > 0) {
    console.log(`✅ Search Filter: Present (Complex Logic)`);
  } else {
    console.error(`❌ Search Filter: Missing`);
  }
}

// Run the tests
runTests().catch((err) => console.error(err));
