/** @jest-environment node */
const fs = require("fs");
const path = require("path");
const os = require("os");

let tmpDir;
let originalCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-test-"));
  fs.mkdirSync(path.join(tmpDir, "data"));
  fs.writeFileSync(path.join(tmpDir, "data", "portfolio.json"), JSON.stringify({ name: "before" }));
  originalCwd = process.cwd();
  process.chdir(tmpDir);
  jest.resetModules();
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("readPortfolioSnapshot returns parsed json and a stable hash", () => {
  const { readPortfolioSnapshot } = require("../localPublish");
  const result = readPortfolioSnapshot();
  expect(result.portfolio).toEqual({ name: "before" });
  expect(typeof result.baseSha).toBe("string");
});

test("publishLocally writes the new json, uploads, and deletes when sha matches", () => {
  const { readPortfolioSnapshot, publishLocally } = require("../localPublish");
  const before = readPortfolioSnapshot();

  fs.mkdirSync(path.join(tmpDir, "public", "images", "projects", "a"), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "public", "images", "projects", "a", "old.webp"), "old");

  publishLocally({
    portfolioJson: { name: "after" },
    uploads: [{ path: "public/images/projects/a/new.webp", base64: Buffer.from("new").toString("base64") }],
    deletes: ["public/images/projects/a/old.webp"],
    expectedBaseSha: before.baseSha,
  });

  const updated = JSON.parse(fs.readFileSync(path.join(tmpDir, "data", "portfolio.json"), "utf-8"));
  expect(updated).toEqual({ name: "after" });
  expect(fs.existsSync(path.join(tmpDir, "public", "images", "projects", "a", "old.webp"))).toBe(false);
  expect(fs.existsSync(path.join(tmpDir, "public", "images", "projects", "a", "new.webp"))).toBe(true);
});

test("publishLocally throws CONFLICT when the file changed since baseSha was read", () => {
  const { publishLocally } = require("../localPublish");
  expect(() =>
    publishLocally({ portfolioJson: { name: "after" }, uploads: [], deletes: [], expectedBaseSha: "stale-hash" })
  ).toThrow(expect.objectContaining({ code: "CONFLICT" }));
});
