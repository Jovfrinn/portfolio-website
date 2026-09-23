/** @jest-environment node */
jest.mock("@octokit/rest");
const { Octokit } = require("@octokit/rest");

beforeAll(() => {
  process.env.GITHUB_TOKEN = "test-token";
  process.env.GITHUB_OWNER = "test-owner";
  process.env.GITHUB_REPO = "test-repo";
  process.env.GITHUB_BRANCH = "main";
});

function mockOctokit(overrides) {
  const impl = Object.assign(
    {
      rest: {
        git: {
          getRef: jest.fn().mockResolvedValue({ data: { object: { sha: "current-sha" } } }),
          getCommit: jest.fn().mockResolvedValue({ data: { tree: { sha: "tree-sha" } } }),
          createBlob: jest.fn().mockResolvedValue({ data: { sha: "blob-sha" } }),
          createTree: jest.fn().mockResolvedValue({ data: { sha: "new-tree-sha" } }),
          createCommit: jest.fn().mockResolvedValue({ data: { sha: "new-commit-sha" } }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
        repos: {
          getContent: jest.fn().mockResolvedValue({
            data: { content: Buffer.from('{"name":"test"}').toString("base64") },
          }),
        },
      },
    },
    overrides
  );
  Octokit.mockImplementation(() => impl);
  return impl;
}

test("getPortfolioSnapshot returns parsed JSON and ref sha", async () => {
  mockOctokit();
  const { getPortfolioSnapshot } = require("../github");
  const result = await getPortfolioSnapshot();
  expect(result.baseSha).toBe("current-sha");
  expect(result.portfolio).toEqual({ name: "test" });
});

test("publishToGithub throws CONFLICT when ref sha has moved", async () => {
  mockOctokit();
  const { publishToGithub } = require("../github");
  await expect(
    publishToGithub({ portfolioJson: { name: "x" }, uploads: [], deletes: [], expectedBaseSha: "stale-sha" })
  ).rejects.toMatchObject({ code: "CONFLICT" });
});

test("publishToGithub builds a tree with sha:null entries for deletes", async () => {
  const impl = mockOctokit();
  const { publishToGithub } = require("../github");
  await publishToGithub({
    portfolioJson: { name: "x" },
    uploads: [{ path: "public/images/projects/a/cover.webp", base64: "abc" }],
    deletes: ["public/images/projects/a/old.webp"],
    expectedBaseSha: "current-sha",
  });

  const treeArg = impl.rest.git.createTree.mock.calls[0][0];
  const deleteEntry = treeArg.tree.find((entry) => entry.path === "public/images/projects/a/old.webp");
  expect(deleteEntry.sha).toBeNull();
  const addEntry = treeArg.tree.find((entry) => entry.path === "public/images/projects/a/cover.webp");
  expect(addEntry.sha).toBe("blob-sha");
});
