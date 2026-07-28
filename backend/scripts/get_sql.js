const { sequelize, User, Role } = require("../sequelize_setup");

async function run() {
  await sequelize.authenticate();
  const Organization = require("../sequelize_setup").Organization;

  console.log("--- GENERATED SQL FOR AUTH MIDDLEWARE ---");
  const user = await User.findByPk('7264949e-58b9-4df7-b575-fa5145700d1a', {
    logging: console.log,
    include: [
      {
        model: Role,
        as: "roles",
        attributes: ["name"],
        through: { attributes: [] },
      },
      {
        model: Organization,
        as: "organizations",
        through: {
          where: { is_primary: true },
          attributes: ["organization_id"],
        },
      },
    ],
  });
  console.log("--- RESULT ---");
  console.log(user ? "User Found" : "User NOT Found (Returned Null)");
  process.exit(0);
}

run();
