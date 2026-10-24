# iOS Safari Userscript Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone, mobile-adapted userscript (`src/sakamichi-mobame-translate-ios.user.js`) that enables real-time message bubble translation and voice transcription on iOS Safari via the Stay extension, without affecting the existing desktop userscript.

**Architecture:** Port the desktop userscript into a separate file; add early Flutter semantics initialization (`window.flutterConfiguration.enableSemantics = true`) and a safe DOM bootstrap; relax desktop viewport width constraints for 100% width mobile displays; implement a header translate button with an automatic Floating Action Button (FAB) fallback; and add multi-layer audio element capture and network error tips for iOS Stay permissions.

**Tech Stack:** JavaScript (ES2020), Userscript API (Tampermonkey / Stay / WebExtensions), Node.js (for headless assertions and behavioral tests).

---

### Task 1: Create Test Suite for iOS Userscript

**Files:**
- Create: `tests/test_ios_userscript.js`

- [ ] **Step 1: Write the failing test**

```javascript
const assert = require('assert');
const fs = require('fs');

// Check that the iOS userscript exists
assert(fs.existsSync('src/sakamichi-mobame-translate-ios.user.js'), 'src/sakamichi-mobame-translate-ios.user.js must exist');

const src = fs.readFileSync('src/sakamichi-mobame-translate-ios.user.js', 'utf8');

// 1. Metadata checks
assert(src.includes('// @name           Sakamichi Mobame Translate (iOS)'), 'Must have iOS specific name');
assert(src.includes('// @run-at         document-start'), 'Must run at document-start for early semantics');
assert(src.includes('// @version        1.1.0-ios'), 'Must have iOS version string');

// 2. Early semantics initialization
assert(src.includes('flutterConfiguration.enableSemantics = true'), 'Must enable semantics on flutterConfiguration');

// 3. Safe DOM bootstrap
assert(src.includes('function sk46Bootstrap()'), 'Must contain safe bootstrap function');
assert(src.includes('DOMContentLoaded'), 'Must listen to DOMContentLoaded if body is not ready');

// 4. Viewport ratio support for full-width mobile screens
assert(!src.includes('SK46_VIEWPORT_FILL_RATIO = 0.98'), 'Must not restrict viewport to desktop < 0.98 ratio');

// 5. FAB fallback class and styling
assert(src.includes('sk46-fab-fallback'), 'Must include FAB fallback class');
assert(src.includes('env(safe-area-inset-bottom'), 'Must support safe area inset for iOS home indicator');

// 6. Multi-layer audio element capture
assert(src.includes("addEventListener('play'"), 'Must include document play event listener for audio capture');

// 7. Stay permissions error hint
assert(src.includes('Stay'), 'Must include Stay permission guidance on connection failure');

console.log('iOS userscript test passed.');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_ios_userscript.js`
Expected: FAIL with `"src/sakamichi-mobame-translate-ios.user.js must exist"`

- [ ] **Step 3: Commit test file**

```bash
git add tests/test_ios_userscript.js
git commit -m "test: add test suite for iOS Safari userscript"
```

---

### Task 2: Scaffold `src/sakamichi-mobame-translate-ios.user.js` with Metadata, Semantics & Safe Bootstrap

**Files:**
- Create: `src/sakamichi-mobame-translate-ios.user.js`
- Test: `tests/test_ios_userscript.js`

- [ ] **Step 1: Create the iOS userscript file based on desktop script**

Port `src/sakamichi-mobame-translate.user.js` to `src/sakamichi-mobame-translate-ios.user.js` with the following changes:
1. Update Userscript header metadata:
   ```javascript
   // @name           Sakamichi Mobame Translate (iOS)
   // @namespace      https://github.com/zeem12/sakamichi-mobame-translate
   // @version        1.1.0-ios
   // @description    Per-bubble translation overlay and voice message transcription for Sakurazaka46, Nogizaka46, and Hinatazaka46 Message on iOS Safari.
   // @author         Zeem12
   // @match          https://message.sakurazaka46.com/*
   // @match          https://message.nogizaka46.com/*
   // @match          https://message.hinatazaka46.com/*
   // @noframes
   // @grant          unsafeWindow
   // @grant          GM_getValue
   // @grant          GM_setValue
   // @grant          GM_xmlhttpRequest
   // @grant          GM_info
   // @run-at         document-start
   ```
2. Immediately inside the IIFE (before group check or at the top), set early Flutter semantics:
   ```javascript
   const pageWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
   try {
       pageWin.flutterConfiguration = pageWin.flutterConfiguration || {};
       pageWin.flutterConfiguration.enableSemantics = true;
   } catch (e) {}
   ```
3. Wrap the entry call `sk46Init()` at the bottom in `sk46Bootstrap()`:
   ```javascript
   function sk46Bootstrap() {
       if (document.body) {
           sk46Init();
       } else {
           document.addEventListener('DOMContentLoaded', () => sk46Init(), { once: true });
       }
   }
   sk46Bootstrap();
   ```

- [ ] **Step 2: Run test to check progress**

Run: `node tests/test_ios_userscript.js`
Expected: Next failure on viewport ratio check.

- [ ] **Step 3: Commit Task 2 changes**

```bash
git add src/sakamichi-mobame-translate-ios.user.js
git commit -m "feat(ios): scaffold iOS userscript with early semantics and safe bootstrap"
```

---

### Task 3: Adapt Viewport & Scroll Boundary Recognition for Mobile Screens

**Files:**
- Modify: `src/sakamichi-mobame-translate-ios.user.js`
- Test: `tests/test_ios_userscript.js`

- [ ] **Step 1: Relax `SK46_VIEWPORT_FILL_RATIO` and adapt container detection**

In `src/sakamichi-mobame-translate-ios.user.js`:
1. Change `SK46_VIEWPORT_FILL_RATIO`:
   ```javascript
   const SK46_VIEWPORT_FILL_RATIO = 1.05;
   ```
2. Update `sk46AcceptScrollContainer`:
   ```javascript
   function sk46AcceptScrollContainer(el) {
       if (!el || !el.isConnected) return null;
       let r;
       try { r = el.getBoundingClientRect(); } catch { return null; }
       if (!r) return null;
       if (r.width <= 0 || r.height <= 0) return null;
       if (r.height < 120) return null;
       // On mobile screens, accept full-width elements up to innerWidth
       if (r.width > window.innerWidth * SK46_VIEWPORT_FILL_RATIO) return null;
       return r;
   }
   ```
3. Update `sk46GetAppViewportRect`:
   ```javascript
   function sk46GetAppViewportRect() {
       const host = document.querySelector(SK46_FLUTTER_HOST);
       if (!host) return null;
       const iw = window.innerWidth, ih = window.innerHeight;
       let best = null, bestArea = 0;
       for (const child of host.children) {
           const tag = child.tagName.toLowerCase();
           if (tag !== 'flt-semantics' && tag !== 'flt-semantics-container') continue;
           const r = child.getBoundingClientRect();
           if (r.width < 150) continue;
           if (r.height < ih * 0.3) continue;
           const area = r.width * r.height;
           if (area > bestArea) { best = r; bestArea = area; }
       }
       if (best) return best;
       // Fallback to flutter-view or viewport rect
       const fv = document.querySelector('flutter-view');
       if (fv) {
           const r = fv.getBoundingClientRect();
           if (r.width > 0 && r.height > 0) return r;
       }
       return { left: 0, top: 0, right: iw, bottom: ih, width: iw, height: ih };
   }
   ```

- [ ] **Step 2: Run test to verify progress**

Run: `node tests/test_ios_userscript.js`
Expected: Next failure on FAB fallback check.

- [ ] **Step 3: Commit Task 3 changes**

```bash
git add src/sakamichi-mobame-translate-ios.user.js
git commit -m "feat(ios): adapt viewport and container detection for mobile displays"
```

---

### Task 4: Implement Header Button with FAB Fallback and Mobile Sheet Styles

**Files:**
- Modify: `src/sakamichi-mobame-translate-ios.user.js`
- Test: `tests/test_ios_userscript.js`

- [ ] **Step 1: Add FAB fallback CSS and responsive sheet styles**

In the CSS template `sk46OverlayStyle.textContent`:
1. Add `.sk46-fab-fallback` rule:
   ```css
   .sk46-fab-fallback {
       position: fixed !important;
       display: flex !important;
       right: 16px !important;
       bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
       width: 44px !important;
       height: 44px !important;
       border-radius: 50% !important;
       background: #FFFFFF !important;
       box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22) !important;
       z-index: 2147483450 !important;
       align-items: center !important;
       justify-content: center !important;
       pointer-events: auto !important;
       border: 1px solid rgba(0, 0, 0, 0.08) !important;
   }
   .sk46-fab-fallback svg {
       width: 22px !important;
       height: 22px !important;
   }
   ```
2. Update `#sheet` styles to respect mobile screen width and safe area:
   ```css
   @media (max-width: 600px) {
       #sheet {
           width: 100% !important;
           max-width: 100% !important;
           border-radius: 16px 16px 0 0 !important;
           max-height: calc(100dvh - 30px) !important;
           padding-bottom: env(safe-area-inset-bottom, 16px) !important;
       }
   }
   ```

- [ ] **Step 2: Update `sk46PositionTranslateBtn` to use FAB fallback**

```javascript
function sk46PositionTranslateBtn() {
    if (!sk46State.showTranslateBtn) { sk46TranslateBtn.style.display = 'none'; return; }
    if (!sk46TranslateBtnAllowedHere()) { sk46TranslateBtn.style.display = 'none'; return; }

    const onHub = sk46IsTalkHubPage();
    const rightBtns = sk46FindHeaderRightButtons();

    // If header buttons found and positioned validly, dock into header
    if ((onHub || sk46GetHeaderRowBounds()) && rightBtns.length > 0) {
        const envelopeRect = rightBtns[0];
        const btnSize = envelopeRect.height;
        if (btnSize > 0) {
            sk46TranslateBtn.classList.remove('sk46-fab-fallback');
            sk46TranslateBtn.style.display = 'flex';
            sk46TranslateBtn.style.left = (envelopeRect.left - btnSize) + 'px';
            sk46TranslateBtn.style.top = envelopeRect.top + 'px';
            sk46TranslateBtn.style.width = btnSize + 'px';
            sk46TranslateBtn.style.height = btnSize + 'px';
            sk46TranslateBtn.style.right = '';
            sk46TranslateBtn.style.bottom = '';
            return;
        }
    }

    // Otherwise, fall back to FAB on mobile
    sk46TranslateBtn.classList.add('sk46-fab-fallback');
    sk46TranslateBtn.style.display = 'flex';
    sk46TranslateBtn.style.left = '';
    sk46TranslateBtn.style.top = '';
    sk46TranslateBtn.style.width = '';
    sk46TranslateBtn.style.height = '';
}
```

- [ ] **Step 3: Run test to check progress**

Run: `node tests/test_ios_userscript.js`
Expected: Next failure on audio capture or Stay guidance.

- [ ] **Step 4: Commit Task 4 changes**

```bash
git add src/sakamichi-mobame-translate-ios.user.js
git commit -m "feat(ios): implement FAB fallback button and mobile sheet styling"
```

---

### Task 5: Implement Multi-Layer Audio Capture & Stay Permission Hints

**Files:**
- Modify: `src/sakamichi-mobame-translate-ios.user.js`
- Test: `tests/test_ios_userscript.js`

- [ ] **Step 1: Add document-level capture listener in `sk46TrackMediaElement`**

```javascript
function sk46TrackMediaElement() {
    if (sk46MediaUrlHooked) return;
    const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const proto = pageWindow && pageWindow.HTMLMediaElement ? pageWindow.HTMLMediaElement.prototype : null;
    if (proto && typeof proto.play === 'function') {
        const origPlay = proto.play;
        sk46MediaUrlHooked = true;
        sk46MediaUrlRestores.push(() => { proto.play = origPlay; });
        proto.play = function () {
            try { sk46LastMediaEl = this; } catch {}
            return origPlay.call(this);
        };
    }
    // Secondary layer: capture-phase event listener for iOS Safari WebExtension sandbox
    document.addEventListener('play', (e) => {
        if (e.target && (e.target instanceof HTMLMediaElement || e.target.tagName === 'AUDIO')) {
            sk46LastMediaEl = e.target;
        }
    }, true);
    sk46MediaUrlHooked = true;
}
```

- [ ] **Step 2: Add Stay permission guidance on connection test failure**

In `sk46RunConnectionTest`:
```javascript
// If network call fails with status 0 or generic error on iOS:
const stayHint = ' (If using Stay on iOS Safari, verify Settings > Safari > Extensions > Stay has "Always Allow" enabled for API domains)';
```

- [ ] **Step 3: Run test to verify all assertions pass**

Run: `node tests/test_ios_userscript.js`
Expected: PASS `"iOS userscript test passed."`

- [ ] **Step 4: Commit Task 5 changes**

```bash
git add src/sakamichi-mobame-translate-ios.user.js
git commit -m "feat(ios): add multi-layer audio capture and Stay permission guidance"
```

---

### Task 6: Run Full Test Suite and Document iOS Installation in README

**Files:**
- Modify: `README.md`
- Test: `tests/*.js`

- [ ] **Step 1: Run all test suites**

Run:
```bash
node tests/test_ios_userscript.js; node tests/test_prompt_context.js; node tests/test_member_context.js; node tests/test_indonesian_casual.js; node tests/test_e2e_prompt.js
```
Expected: All suites PASS.

- [ ] **Step 2: Document iOS Safari installation in `README.md`**

Add an "iOS Safari (Mobile)" subsection under Installation in `README.md` explaining:
- Using the Stay extension on iOS Safari.
- Granting "Always Allow" permissions for `message.*.com` and your AI provider.
- Installing `sakamichi-mobame-translate-ios.user.js`.
- Using the Floating Action Button (FAB) at the bottom-right to open settings.

- [ ] **Step 3: Commit Task 6 changes**

```bash
git add README.md
git commit -m "docs: add iOS Safari installation instructions for the mobile userscript"
```

---
