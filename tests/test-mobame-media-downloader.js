const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const scriptPath = path.join(__dirname, "../src/mobame-media-downloader.user.js");
const content = fs.readFileSync(scriptPath, "utf8");

console.log("--- 1. Testing Userscript Metadata ---");
assert.ok(content.includes("// @name         Sakamichi Mobame Media Downloader"), "Header should have updated name");
assert.ok(content.includes("// @match        https://message.sakurazaka46.com/*"), "Should match Sakura");
assert.ok(content.includes("// @match        https://message.nogizaka46.com/*"), "Should match Nogi");
assert.ok(content.includes("// @match        https://message.hinatazaka46.com/*"), "Should match Hinata");
assert.ok(content.includes("// @noframes"), "Should have @noframes directive");
assert.ok(content.includes("// @connect      dmu54xlwnhgck.cloudfront.net"), "Should connect to Sakura CDN");
assert.ok(content.includes("// @connect      djznowbmqickg.cloudfront.net"), "Should connect to Nogi CDN");
assert.ok(content.includes("// @connect      d3ux740zhdvrpf.cloudfront.net"), "Should connect to Hinata CDN");

console.log("--- 2. Testing Group Resolution & Theming ---");
function runInMockEnv(hostname, isIframe = false) {
  let addedStyles = [];
  let appendedElements = [];
  let toastMessages = [];
  let loggedMessages = [];
  let xmlHttpRequests = [];

  const mockWindow = {
    top: isIframe ? {} : null,
    self: isIframe ? { diff: true } : null,
    location: { hostname },
    PerformanceObserver: function (cb) {
      this.observe = () => {};
    },
    addEventListener: () => {},
  };
  mockWindow.top = isIframe ? {} : mockWindow;
  mockWindow.self = mockWindow;

  const mockDoc = {
    body: {
      appendChild: (el) => appendedElements.push(el),
    },
    createElement: (tag) => {
      return {
        tagName: tag,
        style: {},
        classList: { toggle: () => {}, add: () => {}, remove: () => {} },
        setAttribute: () => {},
        appendChild: () => {},
        append: () => {},
        addEventListener: () => {},
        dataset: {},
      };
    },
    querySelector: () => null,
  };

  const context = {
    window: mockWindow,
    document: mockDoc,
    location: mockWindow.location,
    console: {
      log: (...args) => loggedMessages.push(args.join(" ")),
    },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    URL: {
      createObjectURL: () => "blob:mock",
      revokeObjectURL: () => {},
    },
    GM_addStyle: (css) => addedStyles.push(css),
    GM_xmlhttpRequest: (opts) => xmlHttpRequests.push(opts),
  };

  vm.createContext(context);
  vm.runInContext(content, context);

  return { addedStyles, appendedElements, loggedMessages, xmlHttpRequests };
}

// Sakura verification
const sakuraEnv = runInMockEnv("message.sakurazaka46.com");
assert.ok(sakuraEnv.loggedMessages.some((m) => m.includes("[Sakurazaka46]")), "Should log with [Sakurazaka46]");
assert.ok(sakuraEnv.addedStyles.some((css) => css.includes("#E395B0")), "Sakura should use pink accent #E395B0");

// Nogi verification
const nogiEnv = runInMockEnv("message.nogizaka46.com");
assert.ok(nogiEnv.loggedMessages.some((m) => m.includes("[Nogizaka46]")), "Should log with [Nogizaka46]");
assert.ok(nogiEnv.addedStyles.some((css) => css.includes("#8F34B4")), "Nogi should use purple accent #8F34B4");

// Hinata verification
const hinataEnv = runInMockEnv("message.hinatazaka46.com");
assert.ok(hinataEnv.loggedMessages.some((m) => m.includes("[Hinatazaka46]")), "Should log with [Hinatazaka46]");
assert.ok(hinataEnv.addedStyles.some((css) => css.includes("#75BCE1")), "Hinata should use blue accent #75BCE1");

// Unknown domain verification
const unknownEnv = runInMockEnv("example.com");
assert.strictEqual(unknownEnv.loggedMessages.length, 0, "Unknown domain should exit early");
assert.strictEqual(unknownEnv.addedStyles.length, 0, "Unknown domain should not add styles");

// Iframe verification
const iframeEnv = runInMockEnv("message.sakurazaka46.com", true);
assert.strictEqual(iframeEnv.loggedMessages.length, 0, "Iframe should exit early");

console.log("All tests passed successfully!");
