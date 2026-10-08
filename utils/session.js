import crypto from "crypto";

export const sessionOptions = {
  cookieName: "portfolio_admin_session",
  password: process.env.SESSION_SECRET || "fallback_secret_must_be_at_least_32_characters_long",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
};

function getKey() {
  const secret = sessionOptions.password || "fallback_secret_must_be_at_least_32_characters_long";
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptSession(data) {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const jsonStr = JSON.stringify(data);
    let encrypted = cipher.update(jsonStr, "utf8", "base64");
    encrypted += cipher.final("base64");
    const tag = cipher.getAuthTag().toString("base64");
    return `${iv.toString("base64")}.${tag}.${encrypted}`;
  } catch (err) {
    console.error("Session encryption error:", err);
    return "";
  }
}

function decryptSession(cookieValue) {
  if (!cookieValue || typeof cookieValue !== "string") return {};
  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 3) return {};
    const [ivB64, tagB64, encryptedB64] = parts;
    const key = getKey();
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedB64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch (err) {
    return {};
  }
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  const cookies = {};
  cookieHeader.split(";").forEach((pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (key) {
      cookies[key.trim()] = decodeURIComponent(rest.join("="));
    }
  });
  return cookies;
}

function serializeCookie(name, val, options = {}) {
  const parts = [`${name}=${encodeURIComponent(val)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    const sameSite = typeof options.sameSite === "string" ? options.sameSite.toLowerCase() : "lax";
    if (sameSite === "lax") parts.push("SameSite=Lax");
    else if (sameSite === "strict") parts.push("SameSite=Strict");
    else if (sameSite === "none") parts.push("SameSite=None");
  }
  return parts.join("; ");
}

function appendSetCookie(res, cookieStr) {
  if (!res || !res.setHeader) return;
  const prev = res.getHeader("Set-Cookie");
  if (!prev) {
    res.setHeader("Set-Cookie", cookieStr);
  } else if (Array.isArray(prev)) {
    res.setHeader("Set-Cookie", [...prev, cookieStr]);
  } else {
    res.setHeader("Set-Cookie", [prev, cookieStr]);
  }
}

function createSessionContainer(initialData, res) {
  const session = { ...initialData };

  Object.defineProperty(session, "save", {
    enumerable: false,
    value: async function () {
      if (!res) return;
      const dataToSave = {};
      for (const key of Object.keys(session)) {
        dataToSave[key] = session[key];
      }
      const token = encryptSession(dataToSave);
      const cookieStr = serializeCookie(sessionOptions.cookieName, token, {
        ...sessionOptions.cookieOptions,
        maxAge: 60 * 60 * 24 * 14, // 14 days
      });
      appendSetCookie(res, cookieStr);
    },
  });

  Object.defineProperty(session, "destroy", {
    enumerable: false,
    value: function () {
      for (const key of Object.keys(session)) {
        delete session[key];
      }
      if (res) {
        const cookieStr = serializeCookie(sessionOptions.cookieName, "", {
          ...sessionOptions.cookieOptions,
          maxAge: 0,
          expires: new Date(0),
        });
        appendSetCookie(res, cookieStr);
      }
    },
  });

  return session;
}

export function withSessionApi(handler) {
  return async function (req, res) {
    const cookies = parseCookies(req.headers ? req.headers.cookie : "");
    const rawCookie = cookies[sessionOptions.cookieName];
    const initialData = decryptSession(rawCookie);
    req.session = createSessionContainer(initialData, res);
    return handler(req, res);
  };
}

export function withAdminApi(handler) {
  return withSessionApi(async (req, res) => {
    if (!req.session.admin) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    return handler(req, res);
  });
}

export function withAdminSsr(getPropsFn) {
  return async function (context) {
    const cookies = parseCookies(context.req && context.req.headers ? context.req.headers.cookie : "");
    const rawCookie = cookies[sessionOptions.cookieName];
    const sessionData = decryptSession(rawCookie);
    context.req.session = createSessionContainer(sessionData, context.res);

    if (!context.req.session.admin) {
      return {
        redirect: {
          destination: "/admin/login",
          permanent: false,
        },
      };
    }

    return getPropsFn ? await getPropsFn(context) : { props: {} };
  };
}

