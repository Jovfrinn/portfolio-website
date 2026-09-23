import { withSessionApi } from "../../../utils/session";

export default withSessionApi(async function logout(req, res) {
  req.session.destroy();
  res.status(200).json({ ok: true });
});
