/** @jest-environment node */
const { sessionOptions } = require("../session");

test("session cookie is httpOnly and sameSite lax", () => {
  expect(sessionOptions.cookieOptions.httpOnly).toBe(true);
  expect(sessionOptions.cookieOptions.sameSite).toBe("lax");
});

test("cookie is secure only outside development", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  jest.resetModules();
  const prodSession = require("../session");
  expect(prodSession.sessionOptions.cookieOptions.secure).toBe(true);
  process.env.NODE_ENV = originalEnv;
});
