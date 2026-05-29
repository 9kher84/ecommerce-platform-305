const axios = require("axios");

const GRAPHQL_URL = "http://localhost:5000/graphql";

// 1. Valid Depth Query (Depth ~6)
const VALID_QUERY = `
  query ValidDepth {
    __schema {
      types {
        fields {
          type {
            fields {
              type {
                name
              }
            }
          }
        }
      }
    }
  }
`;

// 2. Excess Depth Query (Depth ~12)
const DEEP_QUERY = `
  query DeepQuery {
    __schema {
      types {
        fields {
          type {
            fields {
              type {
                fields {
                  type {
                    fields {
                      type {
                        fields {
                          type {
                             name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function runGraphQLTests() {
  console.log("=== J) GraphQL Security Tests ===\n");

  // 1. Test Introspection (Development)
  console.log("--- 1. Testing Introspection (Dev) ---");
  try {
    const res = await axios.post(GRAPHQL_URL, {
      query: `query { __schema { types { name } } }`,
    });

    if (res.data.data && res.data.data.__schema) {
      console.log("✅ Introspection Successful (Expected in Development)");
    }
  } catch (error) {
    console.log("❌ Introspection Request Failed:", error.message);
    if (error.response && error.response.data) {
      console.log("   Errors:", JSON.stringify(error.response.data, null, 2));
    }
  }

  // 2. Test Depth Limit
  console.log("\n--- 2. Testing Query Depth Limit (Limit: 10) ---");

  // 2a. Valid Query
  console.log("Test A: Valid Query (Depth ~6)");
  try {
    const res = await axios.post(GRAPHQL_URL, { query: VALID_QUERY });
    if (res.data.data) {
      console.log("✅ PASS: Valid depth query accepted");
    } else if (res.data.errors) {
      console.log(
        "⚠️ Warning: Valid query had errors:",
        JSON.stringify(res.data.errors),
      );
    }
  } catch (error) {
    console.log("❌ FAIL: Valid query rejected:", error.message);
    if (error.response) console.log(JSON.stringify(error.response.data));
  }

  // 2b. Deep Query
  console.log("Test B: Deep Query (Depth ~12)");
  try {
    await axios.post(GRAPHQL_URL, { query: DEEP_QUERY });
    console.log("❌ FAIL: Deep query was NOT blocked!");
  } catch (error) {
    if (error.response && error.response.data && error.response.data.errors) {
      const errors = error.response.data.errors;
      const depthError = errors.find(
        (e) =>
          e.message.includes("depth") || e.message.includes("exceeds maximum"),
      );

      if (depthError) {
        console.log("✅ PASS: Deep query blocked correctly");
        console.log("   Error:", depthError.message);
      } else {
        console.log(
          "❌ FAIL: Blocked for wrong reason:",
          JSON.stringify(errors),
        );
      }
    } else {
      console.log("⚠️ Unexpected error structure:", error.message);
      if (error.response) console.log(error.response.data);
    }
  }
}

runGraphQLTests();
