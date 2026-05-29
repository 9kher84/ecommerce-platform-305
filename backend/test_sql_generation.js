const { Op } = require("sequelize");

// Mock implementation of buildWhereClause for testing
function buildWhereClause(whereConditions, replacements = {}) {
  const clauses = [];
  let paramCounter = Object.keys(replacements).length + 1;

  const processCondition = (key, value) => {
    if (key === Symbol.for("and") || key.toString() === "Symbol(and)") {
      // Mock Op.and
      const andClauses = value
        .map((cond) => {
          const subClauses = [];
          Object.keys(cond).forEach((subKey) => {
            // ... simplified for test
            const result = processCondition(subKey, cond[subKey]);
            if (result) subClauses.push(result);
          });
          return subClauses.length > 0 ? `(${subClauses.join(" AND ")})` : null;
        })
        .filter(Boolean);
      return andClauses.length > 0 ? andClauses.join(" AND ") : null;
    }

    // Handle Op.or manually for test
    if (key === Symbol.for("or") || key.toString() === "Symbol(or)") {
      // ... simplified
      return null;
    }

    if (typeof value === "object" && value !== null) {
      if (value[Symbol.for("in")] || value["in"]) {
        // Mock Op.in
        const paramName = `param${paramCounter++}`;
        replacements[paramName] = value[Symbol.for("in")] || value["in"];
        return `"${key}" IN (:${paramName})`;
      }
      if (value[Symbol.for("gt")] || value["gt"]) {
        // Mock Op.gt
        const paramName = `param${paramCounter++}`;
        replacements[paramName] = value[Symbol.for("gt")] || value["gt"];
        return `"${key}" > :${paramName}`;
      }
      if (value[Symbol.for("iLike")] || value["iLike"]) {
        // Mock Op.iLike
        const paramName = `param${paramCounter++}`;
        replacements[paramName] = value[Symbol.for("iLike")] || value["iLike"];
        return `"${key}" ILIKE :${paramName}`;
      }
    } else {
      const paramName = `param${paramCounter++}`;
      replacements[paramName] = value;
      return `"${key}" = :${paramName}`;
    }
    return null;
  };

  Object.keys(whereConditions).forEach((key) => {
    const result = processCondition(key, whereConditions[key]);
    if (result) clauses.push(result);
  });

  return { sql: clauses.join(" AND "), replacements };
}

// Simulate the scenario
const where = {
  status: { [Symbol.for("in")]: ["published", "negotiating"] },
  expiresAt: { [Symbol.for("gt")]: new Date("2025-12-31") },
  delivery_city: "الرياض",
};

// Add search query simulation (simplified)
// In real code: where[Op.and] = ...

const { sql, replacements } = buildWhereClause(where);

console.log("Generated SQL WHERE:", sql);
console.log("Replacements:", replacements);

const fullQuery = `
WITH base_filtered AS (
  SELECT pr.*
  FROM "PurchaseRequests" pr
  WHERE ${sql}
),
ranked_requests AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY "categoryId" 
      ORDER BY "createdAt" DESC
    ) as row_num
  FROM base_filtered
)
SELECT * FROM ranked_requests
WHERE row_num <= 3
ORDER BY "createdAt" DESC
LIMIT :limit OFFSET :offset;
`;

console.log("\nFull Query Structure:\n", fullQuery);
