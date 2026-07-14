const { sequelize, ProductDNA, AttributeSchema, ProductDNAAttribute, Category } = require("./sequelize_setup");

async function runVerification() {
  console.log("=== PRODUCT DNA VERIFICATION ===");

  try {
    // 1. Create a Category
    const [category] = await Category.findOrCreate({
      where: { name_en: 'Building Materials' },
      defaults: {
        name_ar: 'مواد البناء',
        slug: 'building-materials',
        isActive: true
      }
    });

    // 2. Create Attribute Schemas (String, Number, Boolean)
    const [weightAttr] = await AttributeSchema.findOrCreate({
      where: { key: 'weight' },
      defaults: { dataType: 'number', unit: 'kg', isFilterable: true, isRequired: true }
    });

    const [materialAttr] = await AttributeSchema.findOrCreate({
      where: { key: 'material' },
      defaults: { dataType: 'string', isSearchable: true }
    });

    const [isRustResistantAttr] = await AttributeSchema.findOrCreate({
      where: { key: 'is_rust_resistant' },
      defaults: { dataType: 'boolean', isFilterable: true }
    });

    // 3. Create a Product DNA
    const [productDna] = await ProductDNA.findOrCreate({
      where: { normalizedName: 'Steel Rebar 12mm' },
      defaults: {
        categoryId: category.id,
        description: 'Standard 12mm steel rebar for construction',
      }
    });

    // 4. Link Attributes to Product DNA
    await ProductDNAAttribute.findOrCreate({
      where: { dnaId: productDna.id, attributeId: weightAttr.id },
      defaults: { valueNumber: 1000 }
    });

    await ProductDNAAttribute.findOrCreate({
      where: { dnaId: productDna.id, attributeId: materialAttr.id },
      defaults: { valueString: 'Carbon Steel' }
    });

    await ProductDNAAttribute.findOrCreate({
      where: { dnaId: productDna.id, attributeId: isRustResistantAttr.id },
      defaults: { valueBoolean: false }
    });

    // 5. Fetch and Verify
    const fetchedDna = await ProductDNA.findByPk(productDna.id, {
      include: [
        {
          model: AttributeSchema,
          as: "attributes",
          through: {
            attributes: ['valueString', 'valueNumber', 'valueBoolean']
          }
        }
      ]
    });

    console.log(`\nProduct DNA: ${fetchedDna.normalizedName}`);
    console.log("Attributes Verification:");
    
    let allAssertionsPassed = true;

    fetchedDna.attributes.forEach(attr => {
      const pda = attr.ProductDNAAttribute;
      
      if (attr.key === 'weight') {
        const passed = pda.valueNumber === 1000 && pda.valueString === null && pda.valueBoolean === null;
        console.log(`- ${attr.key}: Tested valueNumber (1000). Assertion Passed? ${passed}`);
        if (!passed) allAssertionsPassed = false;
      }
      if (attr.key === 'material') {
        const passed = pda.valueString === 'Carbon Steel' && pda.valueNumber === null && pda.valueBoolean === null;
        console.log(`- ${attr.key}: Tested valueString ('Carbon Steel'). Assertion Passed? ${passed}`);
        if (!passed) allAssertionsPassed = false;
      }
      if (attr.key === 'is_rust_resistant') {
        const passed = pda.valueBoolean === false && pda.valueString === null && pda.valueNumber === null;
        console.log(`- ${attr.key}: Tested valueBoolean (false). Assertion Passed? ${passed}`);
        if (!passed) allAssertionsPassed = false;
      }
    });

    if (allAssertionsPassed) {
      console.log("\n✅ EAV Pattern stored and retrieved correctly using the appropriate Typed Columns!");
    } else {
      console.error("\n❌ FAILED: Values were stored in the incorrect columns.");
    }
    console.log("=== VERIFICATION COMPLETE ===");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    process.exit(0);
  }
}

runVerification();
