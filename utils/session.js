import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";

export const sessionOptions = {
  cookieName: "portfolio_admin_session",
  password: process.env.SESSION_SECRET,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export function withSessionApi(handler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export function withAdminApi(handler) {
  return withIronSessionApiRoute(async (req, res) => {
    if (!req.session.admin) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    return handler(req, res);
  }, sessionOptions);
}

export function withAdminSsr(getPropsFn) {
  return withIronSessionSsr(async (context) => {
    if (!context.req.session.admin) {
      return { redirect: { destination: "/admin/login", permanent: false } };
    }
    return getPropsFn ? getPropsFn(context) : { props: {} };
  }, sessionOptions);
}
