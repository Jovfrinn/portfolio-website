/**
 * @jest-environment jsdom
 */
const { validateImageFile, publicUrlToRepoPath } = require("../imageProcessing");

function makeFile({ type, size }) {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], "photo.jpg", { type });
}

test("rejects a disallowed file type", () => {
  const file = makeFile({ type: "image/gif", size: 1000 });
  expect(validateImageFile(file)).toMatch(/jpg, png, atau webp/);
});

test("rejects a file over 10MB", () => {
  const file = makeFile({ type: "image/jpeg", size: 11 * 1024 * 1024 });
  expect(validateImageFile(file)).toMatch(/10MB/);
});

test("accepts a valid jpeg under the size limit", () => {
  const file = makeFile({ type: "image/jpeg", size: 2 * 1024 * 1024 });
  expect(validateImageFile(file)).toBeNull();
});

test("publicUrlToRepoPath prefixes the public path with public/", () => {
  expect(publicUrlToRepoPath("/images/projects/field-sales-crm/cover.webp")).toBe(
    "public/images/projects/field-sales-crm/cover.webp"
  );
});
