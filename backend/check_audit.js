const authController = require("./controllers/authController");
const required = ["register", "login", "logout", "refresh", "getMe"];
const forbidden = ["impersonate", "editAnyField"];

console.log("--- Auth Controller Audit ---");
required.forEach((f) =>
  console.log((typeof authController[f] === "function" ? "? " : "? ") + f),
);
forbidden.forEach((f) =>
  console.log(
    (typeof authController[f] === "function" ? "?? " : "? ") +
      f +
      " (forbidden)",
  ),
);
