const { sequelize } = require("../sequelize_setup");

exports.generateInvoiceNumber = async (transaction) => {
  const [result] = await sequelize.query(
    "SELECT nextval('invoice_number_seq') as seq",
    { transaction, type: sequelize.QueryTypes.SELECT },
  );
  const year = new Date().getFullYear();
  return `INV-${year}-${String(result.seq).padStart(6, "0")}`;
};

exports.calculateTax = (amount) => {
  const rate = 0.15;
  return (amount * rate).toFixed(2);
};
