import { Octokit } from "@octokit/rest";

function getOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

function repoParams() {
  return {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
  };
}

function branchName() {
  return process.env.GITHUB_BRANCH || "main";
}

export async function getPortfolioSnapshot() {
  const octokit = getOctokit();
  const branch = branchName();
  const params = repoParams();

  const { data: refData } = await octokit.rest.git.getRef({ ...params, ref: "heads/" + branch });
  const baseSha = refData.object.sha;

  const { data: fileData } = await octokit.rest.repos.getContent({
    ...params,
    path: "data/portfolio.json",
    ref: branch,
  });

  const content = Buffer.from(fileData.content, "base64").toString("utf-8");
  return { portfolio: JSON.parse(content), baseSha };
}

export async function publishToGithub({ portfolioJson, uploads, deletes, expectedBaseSha }) {
  const octokit = getOctokit();
  const branch = branchName();
  const params = repoParams();

  const { data: refData } = await octokit.rest.git.getRef({ ...params, ref: "heads/" + branch });
  const currentSha = refData.object.sha;

  if (currentSha !== expectedBaseSha) {
    const conflictError = new Error("conflict");
    conflictError.code = "CONFLICT";
    throw conflictError;
  }

  const { data: commitData } = await octokit.rest.git.getCommit({ ...params, commit_sha: currentSha });
  const baseTreeSha = commitData.tree.sha;

  const portfolioBlob = await octokit.rest.git.createBlob({
    ...params,
    content: Buffer.from(JSON.stringify(portfolioJson, null, 2) + "\n", "utf-8").toString("base64"),
    encoding: "base64",
  });

  const treeEntries = [
    { path: "data/portfolio.json", mode: "100644", type: "blob", sha: portfolioBlob.data.sha },
  ];

  for (const upload of uploads) {
    const blob = await octokit.rest.git.createBlob({ ...params, content: upload.base64, encoding: "base64" });
    treeEntries.push({ path: upload.path, mode: "100644", type: "blob", sha: blob.data.sha });
  }

  for (const filePath of deletes) {
    treeEntries.push({ path: filePath, mode: "100644", type: "blob", sha: null });
  }

  const { data: newTree } = await octokit.rest.git.createTree({
    ...params,
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  const { data: newCommit } = await octokit.rest.git.createCommit({
    ...params,
    message: "content: update via admin",
    tree: newTree.sha,
    parents: [currentSha],
  });

  await octokit.rest.git.updateRef({ ...params, ref: "heads/" + branch, sha: newCommit.sha });

  return { commitSha: newCommit.sha };
}
