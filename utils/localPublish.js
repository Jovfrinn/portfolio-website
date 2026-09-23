import fs from "fs";
import path from "path";
import crypto from "crypto";

function portfolioPath() {
  return path.join(process.cwd(), "data", "portfolio.json");
}

export function readPortfolioSnapshot() {
  const raw = fs.readFileSync(portfolioPath(), "utf-8");
  const baseSha = crypto.createHash("sha256").update(raw).digest("hex");
  return { portfolio: JSON.parse(raw), baseSha };
}

export function publishLocally({ portfolioJson, uploads, deletes, expectedBaseSha }) {
  const current = readPortfolioSnapshot();
  if (current.baseSha !== expectedBaseSha) {
    const conflictError = new Error("conflict");
    conflictError.code = "CONFLICT";
    throw conflictError;
  }

  for (const filePath of deletes) {
    const absolute = path.join(process.cwd(), filePath);
    if (fs.existsSync(absolute)) {
      fs.unlinkSync(absolute);
    }
  }

  for (const upload of uploads) {
    const absolute = path.join(process.cwd(), upload.path);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, Buffer.from(upload.base64, "base64"));
  }

  fs.writeFileSync(portfolioPath(), JSON.stringify(portfolioJson, null, 2) + "\n", "utf-8");

  return { commitSha: "local" };
}
