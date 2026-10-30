const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const scriptPath = path.join(__dirname, "../src/sakamichi-mobame-translate.user.js");
const content = fs.readFileSync(scriptPath, "utf8");

console.log("--- 1. Testing Copy Icons & Helpers Presence ---");
assert.ok(content.includes("SK46_ICON_COPY"), "Should define SK46_ICON_COPY");
assert.ok(content.includes("SK46_ICON_CHECK"), "Should define SK46_ICON_CHECK");
assert.ok(content.includes("sk46CopyToClipboard"), "Should define sk46CopyToClipboard helper");
assert.ok(content.includes("sk46BuildCopyBtn"), "Should define sk46BuildCopyBtn");
assert.ok(content.includes("popup-copy-btn"), "Should define popup-copy-btn in popup shadow DOM");

console.log("--- 2. Testing Positioning & Logic ---");
assert.ok(content.includes("sk46CopyBtnGapPx"), "Should define sk46CopyBtnGapPx");
assert.ok(content.includes("sk46UpdateCopyBtnPosition"), "Should define sk46UpdateCopyBtnPosition");

console.log("All copy button static checks passed!");
