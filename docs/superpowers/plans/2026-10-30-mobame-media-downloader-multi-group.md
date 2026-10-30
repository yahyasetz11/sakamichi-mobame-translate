# Sakamichi Mobame Media Downloader Multi-Group Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `src/mobame-media-downloader.user.js` from a Sakurazaka46-only script into a modular Userscript supporting Sakurazaka46, Nogizaka46, and Hinatazaka46 message apps with group-based theming, CDN filtering, and network headers.

**Architecture:** Adopt the modular pattern from `sakamichi-mobame-translate.user.js`: `SK46_GROUPS` registry keyed by `location.hostname` supplying `id`, `label`, `origin`, `accent`, and `cdnDomain`. Dynamic CSS injection via `--sk46-accent`, top-level frame guards, multi-CDN detection with fallback, and group-aware headers for `GM_xmlhttpRequest`.

**Tech Stack:** JavaScript (ES6+ Userscript, Tampermonkey/Violentmonkey APIs: `GM_xmlhttpRequest`, `GM_addStyle`, PerformanceObserver).

---

### Task 1: Create Unit Test Harness for Media Downloader

**Files:**
- Create: `tests/test-mobame-media-downloader.js`
- Test: `tests/test-mobame-media-downloader.js`

- [ ] **Step 1: Write the unit test script**

Create `tests/test-mobame-media-downloader.js` that tests script metadata, group resolution, URL validation, and theme variables across all three groups:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails on unmodified script**

Run: `node tests/test-mobame-media-downloader.js`
Expected: FAIL with assertion error on `@name` or `@match`.

- [ ] **Step 3: Commit test harness**

```bash
git add -f tests/test-mobame-media-downloader.js
git commit -m "test: add test harness for mobame media downloader multi-group modularity"
```

---

### Task 2: Refactor Metadata, Group Registry, and Top-Frame Guard

**Files:**
- Modify: `src/mobame-media-downloader.user.js:1-25`
- Test: `tests/test-mobame-media-downloader.js`

- [ ] **Step 1: Update Userscript metadata and add SK46_GROUPS**

Replace lines 1-24 of `src/mobame-media-downloader.user.js` with:

```javascript
// ==UserScript==
// @name         Sakamichi Mobame Media Downloader
// @namespace    https://github.com/zeem12/sakamichi-mobame-translate
// @version      1.0.0
// @description  Download images, videos, and audio via PerformanceObserver with cache-first strategy for Sakurazaka46, Nogizaka46, and Hinatazaka46 message web apps.
// @author       Skipper1407 (Original) & Zeem12 (Refactored)
// @match        https://message.sakurazaka46.com/*
// @match        https://message.nogizaka46.com/*
// @match        https://message.hinatazaka46.com/*
// @noframes
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      dmu54xlwnhgck.cloudfront.net
// @connect      djznowbmqickg.cloudfront.net
// @connect      d3ux740zhdvrpf.cloudfront.net
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self) return;

  // ===================== GROUP REGISTRY =====================
  const SK46_GROUPS = Object.freeze({
    "message.sakurazaka46.com": Object.freeze({
      id: "sakura",
      label: "Sakurazaka46",
      origin: "https://message.sakurazaka46.com",
      accent: "#E395B0",
      cdnDomain: "dmu54xlwnhgck.cloudfront.net",
    }),
    "message.nogizaka46.com": Object.freeze({
      id: "nogi",
      label: "Nogizaka46",
      origin: "https://message.nogizaka46.com",
      accent: "#8F34B4",
      cdnDomain: "djznowbmqickg.cloudfront.net",
    }),
    "message.hinatazaka46.com": Object.freeze({
      id: "hinata",
      label: "Hinatazaka46",
      origin: "https://message.hinatazaka46.com",
      accent: "#75BCE1",
      cdnDomain: "d3ux740zhdvrpf.cloudfront.net",
    }),
  });

  const SK46_GROUP = SK46_GROUPS[location.hostname];
  if (!SK46_GROUP) return;
```

- [ ] **Step 2: Run test to observe partial progress**

Run: `node tests/test-mobame-media-downloader.js`
Expected: Section 1 passes; fails in Section 2 (accent colors / logging prefix not yet updated).

- [ ] **Step 3: Commit Task 2 changes**

```bash
git add src/mobame-media-downloader.user.js
git commit -m "feat: add multi-group metadata and registry to mobame media downloader"
```

---

### Task 3: Refactor URL Filtering & Download Headers

**Files:**
- Modify: `src/mobame-media-downloader.user.js` (constants, `handleCapturedUrl`, `handleDownload`)
- Test: `tests/test-mobame-media-downloader.js`

- [ ] **Step 1: Update CDN constants and filtering logic**

Define `KNOWN_CDN_DOMAINS` and update `handleCapturedUrl`:

```javascript
  // ===================== CONSTANTS =====================
  const KNOWN_CDN_DOMAINS = Object.freeze([
    SK46_GROUP.cdnDomain,
    "dmu54xlwnhgck.cloudfront.net",
    "djznowbmqickg.cloudfront.net",
    "d3ux740zhdvrpf.cloudfront.net",
  ]);
  const PATH_PATTERN = /\/private\/messages\//;
  const THUMBNAIL_FILTER = /\/thumbnails\//;
  const VIDEO_THUMBNAIL_PATTERN = /\.\d{7}\./;

  const mediaQueue = new Map();
  let panelOpen = false;
```

In `handleCapturedUrl(url)`:
```javascript
  function handleCapturedUrl(url) {
    if (!url) return;

    if (THUMBNAIL_FILTER.test(url) || VIDEO_THUMBNAIL_PATTERN.test(url)) {
      return;
    }

    if (!PATH_PATTERN.test(url)) {
      return;
    }

    const matchesCdn =
      KNOWN_CDN_DOMAINS.some((domain) => url.includes(domain)) ||
      /\.cloudfront\.net\//.test(url);
    if (!matchesCdn) {
      return;
    }

    const status = isUrlValid(url);
    if (!status.valid) {
      log("Skipping expired URL:", url.slice(0, 80));
      return;
    }

    if (mediaQueue.has(url)) return;

    const filename = getFilename(url);
    const type = getMediaType(filename);
    const icon = getIcon(type);

    mediaQueue.set(url, { url, filename, type, icon });
    log("Captured:", filename, "|", type);
    updateUI();

    if (mediaQueue.size === 1) togglePanel(true);
  }
```

- [ ] **Step 2: Add group origin headers to `GM_xmlhttpRequest` in `handleDownload`**

Update `GM_xmlhttpRequest` call in `handleDownload`:
```javascript
        GM_xmlhttpRequest({
          method: "GET",
          url: url,
          responseType: "blob",
          headers: {
            Referer: `${SK46_GROUP.origin}/`,
            Origin: SK46_GROUP.origin,
            Accept: "*/*",
          },
          onload: (res) => {
            // ...
```

- [ ] **Step 3: Run test to verify syntax and progress**

Run: `node tests/test-mobame-media-downloader.js`
Expected: Passes up to section 2.

- [ ] **Step 4: Commit Task 3 changes**

```bash
git add src/mobame-media-downloader.user.js
git commit -m "feat: update cdn matching and origin headers for multi-group support"
```

---

### Task 4: Refactor UI Dynamic Accent Theming, Header & Logging

**Files:**
- Modify: `src/mobame-media-downloader.user.js` (logging, styles, UI rendering, init)
- Test: `tests/test-mobame-media-downloader.js`

- [ ] **Step 1: Update logging, styles, and headers**

1. Update `log`:
```javascript
  function log(...args) {
    console.log(`[${SK46_GROUP.label}]`, ...args);
  }
```

2. Update `GM_addStyle`:
```javascript
  GM_addStyle(`
        #s46-panel {
            --sk46-accent: ${SK46_GROUP.accent};
            position: fixed; bottom: 30px; right: 30px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: rgba(20,20,30,0.95);
            backdrop-filter: blur(8px);
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.6);
            min-width: 300px;
            max-width: 380px;
            color: #eee;
            border: 1px solid rgba(255,255,255,0.1);
            overflow: hidden;
        }
        #s46-header {
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(40,45,60,0.9);
            font-weight: 600;
            font-size: 14px;
            user-select: none;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        #s46-header .badge {
            background: var(--sk46-accent);
            color: white;
            border-radius: 20px;
            padding: 2px 10px;
            font-size: 12px;
            margin-left: 8px;
        }
        #s46-header .arrow {
            transition: transform 0.3s ease;
            font-size: 12px;
        }
        #s46-header .arrow.open {
            transform: rotate(180deg);
        }

        #s46-body {
            max-height: 0;
            overflow-y: auto;
            transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1);
            background: rgba(15,15,25,0.95);
        }
        #s46-body.open {
            max-height: 400px;
        }
        #s46-body::-webkit-scrollbar { width: 4px; }
        #s46-body::-webkit-scrollbar-thumb { background: #555; border-radius: 10px; }

        .s46-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            gap: 10px;
        }
        .s46-item:hover { background: rgba(255,255,255,0.05); }

        .s46-thumb {
            width: 44px; height: 44px;
            flex-shrink: 0;
            border-radius: 6px;
            overflow: hidden;
            background: #1a1a2e;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            border: 1px solid rgba(255,255,255,0.08);
        }
        .s46-thumb img {
            width: 100%; height: 100%;
            object-fit: cover;
            display: block;
        }
        .s46-thumb .fallback-icon { font-size: 24px; opacity: 0.7; }

        .s46-item .info { flex: 1; min-width: 0; }
        .s46-item .fname {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 13px;
            font-weight: 500;
        }
        .s46-item .type-badge {
            display: inline-block;
            font-size: 9px;
            background: rgba(255,255,255,0.1);
            padding: 1px 6px;
            border-radius: 4px;
            color: #aaa;
            margin-top: 2px;
            text-transform: uppercase;
        }

        .s46-item .dl-btn {
            background: var(--sk46-accent);
            border: none;
            color: white;
            border-radius: 6px;
            padding: 5px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
            white-space: nowrap;
        }
        .s46-item .dl-btn:hover { filter: brightness(0.9); transform: scale(1.05); }
        .s46-item .dl-btn:disabled { background: #555; cursor: not-allowed; transform: none; }
        .s46-item .dl-btn.success { background: #2ecc71; }
        .s46-item .dl-btn.error { background: #7f8c8d; }

        .s46-empty { padding: 20px; text-align: center; color: #666; font-size: 13px; }

        .s46-toast {
            position: fixed; bottom: 100px; right: 30px;
            padding: 12px 18px; background: rgba(0,0,0,0.85);
            color: white; border-radius: 10px; font-size: 13px;
            z-index: 1000001; animation: s46-fadeIn 0.25s ease;
            border-left: 4px solid var(--sk46-accent);
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .s46-toast.success { border-left-color: #2ecc71; }
        .s46-toast.error { border-left-color: #e74c3c; }
        @keyframes s46-fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
  `);
```

3. Update `buildPanel` header title:
```javascript
    header.innerHTML = `
            <span>📦 ${SK46_GROUP.label} Media <span class="badge">0</span></span>
            <span class="arrow">▾</span>
        `;
```

4. Update initialization toasts and logs:
```javascript
  // ===================== INIT =====================
  log(`${SK46_GROUP.label} Downloader loaded.`);
  buildPanel();
  showToast(`🟢 ${SK46_GROUP.label} Downloader ready! Media will appear in queue.`, "success");

  window.addEventListener("flutter-first-frame", () =>
    log("Flutter frame rendered."),
  );
```

- [ ] **Step 2: Run test suite**

Run: `node tests/test-mobame-media-downloader.js`
Expected: PASS with "All tests passed successfully!"

- [ ] **Step 3: Commit Task 4 changes**

```bash
git add src/mobame-media-downloader.user.js
git commit -m "feat: implement dynamic group accent theming, header, and logging"
```

---

### Task 5: Final Review & Verification

**Files:**
- `src/mobame-media-downloader.user.js`
- `tests/test-mobame-media-downloader.js`

- [ ] **Step 1: Execute test verification command**

Run: `node tests/test-mobame-media-downloader.js`
Verify: All assertions pass cleanly.

- [ ] **Step 2: Inspect git status and diff**

Run: `git status`
Verify: All modified and new files are properly staged/committed.
