const fs = require("fs");
const path = require("path");
const { User, Deal } = require("../sequelize_setup");

async function generateSitemap() {
  const baseUrl = "https://sovereign.com";
  const sitemapPath = path.join(__dirname, "../../frontend/public/sitemap.xml");

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static pages
  const staticPages = [
    "",
    "/about",
    "/buyers",
    "/suppliers",
    "/pricing",
    "/contact",
  ];

  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === "" ? "1.0" : "0.8"}</priority>\n  </url>\n`;
  }

  try {
    // Dynamic Suppliers
    const suppliers = await User.findAll({ where: { role: "seller" } });
    for (const supplier of suppliers) {
      xml += `  <url>\n    <loc>${baseUrl}/supplier/${supplier.id}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    // Add additional dynamic pages if necessary...
    // For instance, product categories, etc.
  } catch (error) {
    console.error("Error generating dynamic sitemap links:", error);
  }

  xml += `</urlset>`;

  fs.writeFileSync(sitemapPath, xml);
  console.log(`✅ Sitemap generated at ${sitemapPath}`);
  process.exit(0);
}

generateSitemap();
