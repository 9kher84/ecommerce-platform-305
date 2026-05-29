const { Category } = require("./sequelize_setup");
const { Op } = require("sequelize");

async function test() {
  try {
    console.log("Testing Category.findAll...");
    const sectors = await Category.findAll({
      where: {
        id: { [Op.in]: [1] },
        type: "SECTOR",
        parentId: null,
      },
    });
    console.log("Sectors found:", sectors.length);
    process.exit(0);
  } catch (err) {
    console.error("Error details:", err);
    process.exit(1);
  }
}

test();
