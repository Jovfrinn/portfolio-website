const fs = require("fs");
const path = require("path");
const { validatePortfolio } = require("../utils/portfolioSchema");

const filePath = path.join(process.cwd(), "data", "portfolio.json");
const raw = fs.readFileSync(filePath, "utf-8");
const json = JSON.parse(raw);
const result = validatePortfolio(json);

if (!result.success) {
  console.error("data/portfolio.json tidak valid:");
  console.error(JSON.stringify(result.errors, null, 2));
  process.exit(1);
}

console.log("data/portfolio.json valid.");
