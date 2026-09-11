import test from "node:test";
import assert from "node:assert/strict";
import { pollInput, voteInput, mediaUrl } from "../src/lib/validation";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { detectImage } from "../src/lib/media";
const question = {
  title: "Choose",
  type: "MULTIPLE",
  maxSelections: 2,
  options: [{ label: "A" }, { label: "B" }],
};
test("multi-select and text-option rules reject invalid configurations", () => {
  const poll = { title: "Demo", questions: [question] };
  assert.equal(pollInput.safeParse(poll).success, true);
  for (const q of [
    { ...question, maxSelections: 3 },
    { ...question, type: "SINGLE" },
    {
      ...question,
      options: [
        { label: "A", isText: true },
        { label: "B", isText: true },
      ],
    },
    {
      ...question,
      options: [
        { id: "x", label: "A" },
        { id: "x", label: "B" },
      ],
    },
  ])
    assert.equal(
      pollInput.safeParse({ ...poll, questions: [q] }).success,
      false,
    );
});
test("media URLs exclude active content, unsafe protocols, and credentials", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:image/svg+xml,<svg>",
    "http://example.com/a.gif",
    "https://user:pass@example.com/a.gif",
    "//example.com/x",
  ])
    assert.equal(mediaUrl.safeParse(url).success, false);
  for (const url of [
    "https://media.giphy.com/media/abc/giphy.gif",
    "/api/media/abcdef123456",
    "",
    null,
  ])
    assert.equal(mediaUrl.safeParse(url).success, true);
  assert.equal(detectImage(Buffer.from('<svg onload="alert(1)">')), null);
  assert.equal(detectImage(Buffer.from("GIF89a")), "image/gif");
});
test("password hashing is salted and rejects invalid passwords and hashes", () => {
  const hash = hashPassword("engineer");
  assert.ok(verifyPassword("engineer", hash));
  assert.ok(!verifyPassword("wrong", hash));
  assert.notEqual(hashPassword("engineer"), hash);
  assert.ok(!verifyPassword("engineer", "bad"));
  assert.ok(!hash.includes("engineer"));
});
test("free text and optional names are bounded and trimmed", () => {
  const vote = voteInput.parse({
    pollId: "p",
    questionId: "q",
    optionIds: ["o"],
    text: "  hello  ",
    displayName: "  Guest  ",
  });
  assert.equal(vote.text, "hello");
  assert.equal(vote.displayName, "Guest");
  assert.equal(
    voteInput.safeParse({ ...vote, text: "x".repeat(1001) }).success,
    false,
  );
});
