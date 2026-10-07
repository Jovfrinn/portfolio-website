const COOKIE_NAME = "portfolio_login_attempts";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function readState(req) {
  const raw = req.cookies[COOKIE_NAME];
  if (!raw) return { count: 0, lockedUntil: 0 };
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    return { count: parsed.count || 0, lockedUntil: parsed.lockedUntil || 0 };
  } catch (error) {
    return { count: 0, lockedUntil: 0 };
  }
}

function writeState(res, state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf-8").toString("base64");
  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    COOKIE_NAME + "=" + encoded + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=900" + secureFlag
  );
}

function isLocked(req) {
  return readState(req).lockedUntil > Date.now();
}

function lockRemainingMs(req) {
  return Math.max(0, readState(req).lockedUntil - Date.now());
}

function registerFailedAttempt(req, res) {
  const state = readState(req);
  const count = state.count + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0;
  writeState(res, { count, lockedUntil });
}

function clearAttempts(req, res) {
  writeState(res, { count: 0, lockedUntil: 0 });
}

module.exports = { isLocked, lockRemainingMs, registerFailedAttempt, clearAttempts };
