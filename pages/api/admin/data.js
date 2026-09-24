import { withAdminApi } from "../../../utils/session";
import { getPortfolioSnapshot } from "../../../utils/github";
import { readPortfolioSnapshot } from "../../../utils/localPublish";

export default withAdminApi(async function data(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const snapshot =
    process.env.NODE_ENV === "development" ? readPortfolioSnapshot() : await getPortfolioSnapshot();

  res.status(200).json(snapshot);
});
