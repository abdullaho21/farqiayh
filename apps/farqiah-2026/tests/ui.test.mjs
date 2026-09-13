import test, { before, beforeEach, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://farqiah.test/polls/preview-poll",
  pretendToBeVisual: true,
});
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "Node",
  "NodeFilter",
  "CustomEvent",
  "Event",
  "MouseEvent",
  "MutationObserver",
  "getComputedStyle",
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: dom.window[key],
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({
  matches: true,
  addEventListener() {},
  removeEventListener() {},
});
window.HTMLElement.prototype.scrollIntoView = function () {};
const { createElement: h, act } = await import("react");
const { createRoot } = await import("react-dom/client");
const cache = path.resolve("node_modules/.cache/farqiah-ui");
let ui, fixture, root, host;
before(async () => {
  await mkdir(cache, { recursive: true });
  const result = await build({
    stdin: {
      contents: `export { VoteWorkspace } from './src/components/vote-workspace'; export { PollDirectory } from './src/components/poll-directory'; export { SiteHeader } from './src/components/site-header'; export { SharePoll } from './src/components/share-poll'; export { Media, Loading } from './src/components/common'; export { PollEditor } from './src/components/poll-editor'; export * as fixture from './tests/ui/provider';`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    jsx: "automatic",
    write: false,
    plugins: [
      {
        name: "ui-fixtures",
        setup(plugin) {
          plugin.onResolve({ filter: /app-provider$/ }, () => ({
            path: path.resolve("tests/ui/provider.ts"),
          }));
          plugin.onResolve({ filter: /^next\/(link|navigation)$/ }, (args) => ({
            path: args.path,
            namespace: "next-test",
          }));
          plugin.onLoad({ filter: /.*/, namespace: "next-test" }, (args) => ({
            loader: "js",
            resolveDir: process.cwd(),
            contents: args.path.endsWith("link")
              ? `import {createElement} from 'react'; export default function Link(props){ return createElement('a',props); }`
              : `export function usePathname(){return '/';} export function useRouter(){return {push(){},replace(){}};}`,
          }));
        },
      },
    ],
  });
  const outfile = path.join(cache, "components.mjs");
  await writeFile(outfile, result.outputFiles[0].text);
  ui = await import(pathToFileURL(outfile));
  fixture = ui.fixture;
});
beforeEach(() => {
  fixture.reset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
after(async () => {
  if (process.env.UI_SNAPSHOT_DIR) {
    const { default: postcss } = await import("postcss");
    const { default: tailwindcss } = await import("@tailwindcss/postcss");
    const { readFile } = await import("node:fs/promises");
    const source = "src/app/globals.css";
    const css = (
      await postcss([tailwindcss()]).process(await readFile(source, "utf8"), {
        from: source,
      })
    ).css;
    await mkdir(process.env.UI_SNAPSHOT_DIR, { recursive: true });
    for (const [name, component, props] of [
      ["home", "PollDirectory", {}],
      ["ballot", "VoteWorkspace", { id: "preview-poll" }],
      ["editor", "PollEditor", { saved() {} }],
      ["loading", "Loading", {}],
    ]) {
      fixture.reset();
      fixture.state.admin = name === "editor";
      const previewHost = document.createElement("div");
      document.body.append(previewHost);
      const previewRoot = createRoot(previewHost);
      await act(async () =>
        previewRoot.render(
          h(
            "div",
            null,
            h(ui.SiteHeader),
            h("main", { className: "main-shell" }, h(ui[component], props)),
          ),
        ),
      );
      const html =
        '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Farqiah UI fixture: ' +
        name +
        "</title><style>" +
        css +
        "</style></head><body>" +
        previewHost.innerHTML +
        "</body></html>";
      await writeFile(
        path.join(process.env.UI_SNAPSHOT_DIR, name + ".html"),
        html,
      );
      await act(async () => previewRoot.unmount());
      previewHost.remove();
    }
  }
  dom.window.close();
  await rm(cache, { recursive: true, force: true });
});
const render = async (name, props = {}) =>
  act(async () => root.render(h(ui[name], props)));
const click = async (element) => {
  assert.ok(element, "Clickable element exists");
  await act(async () => element.click());
};
const button = (name) =>
  [...document.querySelectorAll("button")].find(
    (el) =>
      el.textContent.trim() === name || el.getAttribute("aria-label") === name,
  );
const option = (label) =>
  [...document.querySelectorAll(".vote-option")]
    .find((el) => el.querySelector(".option-label").textContent === label)
    ?.querySelector("input");
const input = async (el, value) => {
  const setter = Object.getOwnPropertyDescriptor(
    el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype,
    "value",
  ).set;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const submit = async () =>
  act(async () =>
    document
      .querySelector(".ballot-panel form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );

test("ballot drafts survive question switches, including free text, and restore keyboard focus", async () => {
  await render("VoteWorkspace", { id: "preview-poll" });
  await click(option("Something else"));
  await input(document.querySelector("textarea"), "A cooperative game");
  await click(button("Next"));
  assert.equal(
    document.activeElement.textContent,
    "What’s on the snack table?",
  );
  await click(option("Pizza"));
  await click(button("Previous"));
  assert.equal(option("Something else").checked, true);
  assert.equal(document.querySelector("textarea").value, "A cooperative game");
  await click(button("Next"));
  assert.equal(option("Pizza").checked, true);
  assert.equal(fixture.requests.length, 0, "Navigating never submits a vote");
});
test("single choice replaces its selection and multiple choice enforces its maximum", async () => {
  await render("VoteWorkspace", { id: "preview-poll" });
  await click(option("Rocket League"));
  await click(option("Minecraft"));
  assert.equal(
    document.querySelectorAll(".vote-option input:checked").length,
    1,
  );
  await click(button("Next"));
  await click(option("Pizza"));
  await click(option("Shawarma"));
  await click(option("Chips"));
  assert.equal(option("Chips").checked, false);
  assert.match(document.querySelector('[role="alert"]').textContent, /up to 2/);
  await click(option("Pizza"));
  await click(option("Chips"));
  assert.equal(option("Chips").checked, true);
});
test("successful submission updates progress immediately and uses stable option IDs", async () => {
  await render("VoteWorkspace", { id: "preview-poll" });
  await click(option("Rocket League"));
  await submit();
  assert.deepEqual(fixture.requests[0].data.optionIds, ["game-0"]);
  assert.equal(
    document
      .querySelector('[role="progressbar"]')
      .getAttribute("aria-valuenow"),
    "1",
  );
  assert.equal(option("Rocket League").checked, true);
  assert.equal(document.querySelector("fieldset").disabled, true);
  await click(button("Next question"));
  await click(option("Pizza"));
  await submit();
  assert.equal(
    document
      .querySelector('[role="progressbar"]')
      .getAttribute("aria-valuenow"),
    "2",
  );
  await click(button("See all results"));
  assert.ok(document.querySelector(".result-list"));
  assert.equal(document.querySelector(".ballot-panel"), null);
});
test("live option removal cannot submit an obsolete draft selection", async () => {
  await render("VoteWorkspace", { id: "preview-poll" });
  await click(option("Rocket League"));
  await act(async () => {
    fixture.state.poll.rounds[0].questions[0].options.shift();
    fixture.refresh();
  });
  assert.equal(button("Submit vote").disabled, true);
  assert.equal(
    document.querySelectorAll(".vote-option input:checked").length,
    0,
  );
});
test("directory search, clear, and results filters show honest empty states", async () => {
  await render("PollDirectory");
  await input(document.querySelector('input[type="search"]'), "missing");
  assert.match(document.body.textContent, /No polls match/);
  await click(button("Clear search"));
  assert.equal(document.querySelectorAll(".poll-card").length, 1);
  await click(
    [...document.querySelectorAll('[aria-label="Filter polls"] button')].find(
      (el) => el.textContent.startsWith("Results"),
    ),
  );
  assert.match(document.body.textContent, /results are still in the making/);
});
test("sharing supports copy confirmation and a readable fallback after clipboard denial", async () => {
  let copied;
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text) => {
        copied = text;
      },
    },
  });
  await render("SharePoll", { title: "Game night" });
  await click(button("Share poll"));
  await click(button("Copy link"));
  assert.equal(copied, "https://farqiah.test/polls/preview-poll");
  assert.match(
    document.querySelector('[role="status"]').textContent,
    /Link copied/,
  );
  await click(button("Close dialog"));
  navigator.clipboard.writeText = async () => {
    throw new Error("Denied");
  };
  await click(button("Share poll"));
  await click(button("Copy link"));
  assert.match(
    document.querySelector('[role="status"]').textContent,
    /device’s Copy/,
  );
});
test("media errors retain an accessible fallback and recover after the URL changes", async () => {
  await render("Media", {
    src: "https://example.com/broken.gif",
    alt: "A game",
    className: "option-media",
  });
  await act(async () =>
    document.querySelector("img").dispatchEvent(new Event("error")),
  );
  assert.equal(
    document.querySelector('[role="img"]').getAttribute("aria-label"),
    "A game: image unavailable",
  );
  await render("Media", {
    src: "https://example.com/new.gif",
    alt: "A game",
    className: "option-media",
  });
  assert.equal(document.querySelector("img").getAttribute("loading"), "lazy");
});
test("admin header and loading skeleton expose accessible state", async () => {
  fixture.state.admin = true;
  await render("SiteHeader");
  assert.ok(document.querySelector(".site-header.is-admin"));
  assert.match(
    document.querySelector(".admin-nav-link").textContent,
    /Admin Dashboard/,
  );
  assert.ok(button("Logout"));
  await render("Loading");
  assert.equal(
    document.querySelector('[role="status"]').getAttribute("aria-label"),
    "Loading your polls",
  );
});
test("password visibility has explicit accessible controls without changing its value", async () => {
  await render("SiteHeader");
  await click(button("Login"));
  assert.equal(
    document.querySelector('[name="username"]').getAttribute("autocapitalize"),
    "none",
  );
  const password = document.querySelector("#admin-password");
  assert.equal(password.type, "password");
  await click(button("Show password"));
  assert.equal(password.type, "text");
  assert.equal(button("Hide password").getAttribute("aria-pressed"), "true");
  await click(button("Hide password"));
  assert.equal(password.type, "password");
  assert.equal(fixture.requests.length, 0);
});
test("cancelling native sharing restores the button without opening a fallback dialog", async () => {
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async () => {
      throw new DOMException("Cancelled", "AbortError");
    },
  });
  try {
    await render("SharePoll", { title: "Game night" });
    await click(button("Share poll"));
    assert.equal(button("Share poll").disabled, false);
    assert.equal(document.querySelector('[role="dialog"]'), null);
  } finally {
    delete navigator.share;
  }
});
test("a live selection-limit change reconciles an unsubmitted ballot", async () => {
  await render("VoteWorkspace", { id: "preview-poll" });
  await click(button("Next"));
  await click(option("Pizza"));
  await click(option("Shawarma"));
  await act(async () => {
    fixture.state.poll.rounds[0].questions[1].maxSelections = 1;
    fixture.refresh();
  });
  assert.equal(
    document.querySelectorAll(".vote-option input:checked").length,
    1,
  );
  await submit();
  assert.equal(fixture.requests[0].data.optionIds.length, 1);
});
