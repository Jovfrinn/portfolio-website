import { withAdminApi } from "../../../utils/session";
import { validatePortfolio } from "../../../utils/portfolioSchema";
import { publishToGithub } from "../../../utils/github";
import { publishLocally } from "../../../utils/localPublish";

// Measured on the base64 STRING length, not the decoded binary size - that string is
// what actually makes up the HTTP request body Vercel's serverless functions cap at
// 4.5MB total, so this must reflect the wire size, not the smaller pre-encoding size.
const MAX_BATCH_BYTES = 4 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: { sizeLimit: "8mb" },
  },
};

export default withAdminApi(async function publish(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = req.body || {};
  const portfolio = body.portfolio;
  const baseSha = body.baseSha;
  const uploads = body.uploads || [];
  const deletes = body.deletes || [];

  const validation = validatePortfolio(portfolio);
  if (!validation.success) {
    res.status(400).json({ error: "invalid_data", details: validation.errors });
    return;
  }

  const totalBytes = uploads.reduce((sum, upload) => sum + upload.base64.length, 0);
  if (totalBytes > MAX_BATCH_BYTES) {
    res.status(413).json({
      error: "batch_too_large",
      message: "Total ukuran gambar baru melebihi 4 MB. Kurangi jumlah gambar atau publish bertahap.",
    });
    return;
  }

  try {
    const result =
      process.env.NODE_ENV === "development"
        ? publishLocally({ portfolioJson: validation.data, uploads, deletes, expectedBaseSha: baseSha })
        : await publishToGithub({ portfolioJson: validation.data, uploads, deletes, expectedBaseSha: baseSha });

    res.status(200).json({
      ok: true,
      commitSha: result.commitSha,
      message:
        process.env.NODE_ENV === "development"
          ? "Tersimpan secara lokal."
          : "Deploy sedang berjalan, tayang dalam 1 sampai 2 menit.",
    });
  } catch (error) {
    if (error.code === "CONFLICT") {
      res.status(409).json({ error: "conflict", message: "Data telah berubah, silakan reload." });
      return;
    }
    res.status(500).json({ error: "publish_failed", message: error.message });
  }
});
