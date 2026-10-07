/** @jest-environment node */
const httpMocks = require("node-mocks-http");
const bcrypt = require("bcryptjs");

beforeAll(() => {
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-characters-long";
  process.env.ADMIN_EMAIL = "admin@example.com";
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("correct-password", 10);
});

test("rejects wrong password with 401", async () => {
  const handler = require("../login").default;
  const req = httpMocks.createRequest({
    method: "POST",
    body: { email: "admin@example.com", password: "wrong-password" },
    cookies: {},
  });
  const res = httpMocks.createResponse();
  await handler(req, res);
  expect(res.statusCode).toBe(401);
});

test("accepts correct credentials and sets a session cookie", async () => {
  const handler = require("../login").default;
  const req = httpMocks.createRequest({
    method: "POST",
    body: { email: "admin@example.com", password: "correct-password" },
    cookies: {},
  });
  const res = httpMocks.createResponse();
  await handler(req, res);
  expect(res.statusCode).toBe(200);
  expect(res.getHeader("Set-Cookie")).toBeDefined();
});
