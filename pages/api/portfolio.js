import fs from "fs";
import { join } from "path";

export default function handler(req, res) {
  // Return 404 in production to block the endpoint
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ message: "Not Found" });
  }

  const portfolioData = join(process.cwd(), "/data/portfolio.json");
  
  if (req.method === "POST") {
    fs.writeFileSync(
      portfolioData,
      JSON.stringify(req.body),
      "utf-8",
      (err) => console.log(err)
    );
    return res.status(200).json({ status: "success", message: "Saved successfully" });
  } else {
    return res
      .status(200)
      .json({ name: "This route works in development mode only" });
  }
}
