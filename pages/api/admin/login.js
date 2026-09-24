import bcrypt from "bcryptjs";
import { withSessionApi } from "../../../utils/session";
import { isLocked, lockRemainingMs, registerFailedAttempt, clearAttempts } from "../../../utils/loginRateLimit";

export default withSessionApi(async function login(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (isLocked(req)) {
    res.status(429).json({ error: "locked", retryAfterSeconds: Math.ceil(lockRemainingMs(req) / 1000) });
    return;
  }

  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminPasswordHash) {
    res.status(500).json({ error: "admin_not_configured" });
    return;
  }

  const emailMatches = typeof email === "string" && email.toLowerCase() === adminEmail.toLowerCase();
  const passwordMatches = typeof password === "string" && (await bcrypt.compare(password, adminPasswordHash));

  if (!emailMatches || !passwordMatches) {
    registerFailedAttempt(req, res);
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  clearAttempts(req, res);
  req.session.admin = { email: adminEmail, loginAt: Date.now() };
  await req.session.save();
  res.status(200).json({ ok: true });
});
