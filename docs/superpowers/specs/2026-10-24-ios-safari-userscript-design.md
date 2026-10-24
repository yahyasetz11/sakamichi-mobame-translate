# Design Spec: iOS Safari Support via Dedicated Userscript

- **Date:** 2026-10-24
- **Status:** Approved
- **Target File:** `src/sakamichi-mobame-translate-ios.user.js`

---

## 1. Context & Motivation

The Sakamichi Mobame web apps (`message.sakurazaka46.com`, `message.nogizaka46.com`, and `message.hinatazaka46.com`) are built with Flutter Web. The desktop userscript (`src/sakamichi-mobame-translate.user.js`) successfully translates messages and transcribes audio on desktop browsers (Chrome, Edge, Firefox).

However, attempting to run this userscript on mobile Safari in iOS (e.g., using the Stay userscript manager) fails completely because:
1. **Disabled Semantics on Mobile:** Flutter Web checks for mobile touch devices and skips rendering the accessibility placeholder button (`flt-semantics-placeholder`). As a result, the `<flt-semantics>` DOM tree is never generated unless an OS screen reader (VoiceOver) is active.
2. **Desktop Viewport Ratio Lock:** The desktop script explicitly rejects containers that take up $\ge 98\%$ of the screen width (`SK46_VIEWPORT_FILL_RATIO = 0.98`), assuming the app runs in a desktop window with surrounding padding. On mobile phones, the app fills 100% of the screen width, causing layout and bubble detection to fail.
3. **Hidden Translate Button:** On narrow mobile headers, right-aligned header icons (such as the fan mail envelope) have differing bounds or are omitted, causing `sk46PositionTranslateBtn` to hide the translate button entirely (`display: none`), leaving users unable to open the settings sheet.
4. **Lifecycle & Sandbox Incompatibilities:** Stay on iOS Safari may inject at `document-start` or before `document.body` is available, leading to immediate unhandled exceptions when elements are appended to `document.body`. Furthermore, WebKit extension sandboxing restricts `unsafeWindow` prototype modifications.

To ensure zero risk of regressions to the stable desktop script, a dedicated userscript file `src/sakamichi-mobame-translate-ios.user.js` will be created with mobile-first adaptations.

---

## 2. Goals & Non-Goals

### Goals
- **Full Feature Parity on iOS:** Provide real-time message bubble translation overlays, voice message transcription, and karaoke audio tracking on iOS Safari.
- **Dedicated Script Isolation:** Keep `src/sakamichi-mobame-translate.user.js` untouched. All mobile-specific code resides in `src/sakamichi-mobame-translate-ios.user.js`.
- **Automatic Semantics Activation:** Guarantee that Flutter Web's semantic DOM tree (`<flt-semantics-host>`) activates on iOS touch devices without requiring the user to turn on VoiceOver.
- **Responsive Header & Floating Action Button (FAB):** Dock into the header if space permits; otherwise smoothly fall back to a non-intrusive 44×44px Floating Action Button anchored to the bottom-right safe area.
- **Stay & Safari WebExtension Resilience:** Handle `document-start` execution cleanly without crashing, capture media play events via multi-layer listeners, and report actionable configuration guidance if extension permissions are blocked.

### Non-Goals
- Native iOS application or App Store packaging (this remains a client-side userscript).
- Modifying or altering the desktop userscript.
- Supporting legacy iOS versions below iOS 15.

---

## 3. Detailed Architecture & Technical Solutions

### 3.1. Userscript Metadata
```javascript
// ==UserScript==
// @name         Sakamichi Mobame Translate (iOS)
// @namespace    https://github.com/zeem12/sakamichi-mobame-translate
// @version      1.1.0-ios
// @description  iOS Safari & mobile translation overlay and voice transcription for Sakamichi message apps.
// @author       Zeem12
// @match        https://message.sakurazaka46.com/*
// @match        https://message.nogizaka46.com/*
// @match        https://message.hinatazaka46.com/*
// @noframes
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @run-at       document-start
// @license      MIT
// ==/UserScript==
```

Key difference: `@run-at document-start` allows the script to register early hooks before Flutter's `flutter_bootstrap.js` executes.

---

### 3.2. Early Flutter Semantics & Startup Lifecycle
1. **Early Flutter Configuration:**
   At evaluation time, set:
   ```javascript
   const pageWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
   pageWin.flutterConfiguration = pageWin.flutterConfiguration || {};
   pageWin.flutterConfiguration.enableSemantics = true;
   ```
2. **Synthetic Semantics Fallback Trigger:**
   If Flutter initializes without reading `enableSemantics`, monitor for `<flt-glass-pane>` / `<flutter-view>`. On the first interaction (`touchstart` or `pointerdown`), verify if `<flt-semantics-host>` has children. If empty, dispatch an activation sequence or trigger the semantics engine.
3. **Safe DOM Bootstrap:**
   ```javascript
   function sk46Bootstrap() {
       if (document.body) {
           sk46Init();
       } else {
           document.addEventListener('DOMContentLoaded', sk46Init, { once: true });
       }
   }
   ```
   Ensures `document.body.appendChild` is never invoked on a `null` object regardless of extension injection timing.

---

### 3.3. Viewport & Boundary Recognition for Mobile Screens
1. **Ratio Filter Removal:**
   In desktop:
   `if (r.width >= window.innerWidth * SK46_VIEWPORT_FILL_RATIO) continue;`
   In iOS mobile:
   Remove the `< 0.98` restriction or set `SK46_VIEWPORT_FILL_RATIO = 1.05`.
   Allow `sk46GetAppViewportRect()` to recognize containers spanning full mobile screen width (`innerWidth`).
2. **Safe Area & Dynamic Height Support:**
   Incorporate CSS `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to properly constrain the chat scroll boundary against Safari's collapsing navigation bar and bottom tab bar.

---

### 3.4. UI: Header Placement with Floating Action Button (FAB) Fallback
1. **Header Detection Attempt:**
   Attempt to place `#sk46-translate-btn` in the header adjacent to any right-aligned icons.
2. **FAB Fallback State:**
   If `sk46FindHeaderRightButtons()` returns empty or the header row cannot be confirmed:
   - Apply `.sk46-fab-fallback` CSS class to `#sk46-translate-btn`.
   - Style as a circular 44×44px elevated button:
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
         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18) !important;
         z-index: 2147483450 !important;
         align-items: center;
         justify-content: center;
         pointer-events: auto !important;
     }
     ```
   - Clicking the FAB opens the existing full settings sheet (`sk46OpenSheet()`).
3. **Settings Sheet Mobile Adaptation:**
   - Width: `100%` on screens $< 600\text{px}$.
   - Max height: `calc(100dvh - 40px)`.
   - Bottom padding: `calc(16px + env(safe-area-inset-bottom, 16px))`.

---

### 3.5. Multi-Layer Audio Interception
1. Hook `unsafeWindow.HTMLMediaElement.prototype.play` as primary.
2. In addition, register a document-level capture listener:
   ```javascript
   document.addEventListener('play', (e) => {
       if (e.target && e.target.tagName === 'AUDIO') {
           sk46LastMediaEl = e.target;
       }
   }, true);
   ```
   This guarantees media element capture even when prototype modifications are restricted by Safari's content script sandbox.

---

### 3.6. Network Error Guidance in Settings
When `GM_xmlhttpRequest` fails or rejects during connection test:
- Detect if running on mobile WebKit/Safari.
- If error status is `0` or network failure, provide an explicit tip in the error message:
  `"Network failed. In iOS Settings > Safari > Extensions > Stay, ensure 'Always Allow' is granted for API domains."`

---

## 4. Verification & Testing Strategy

1. **Syntax & Unit Sanity Testing:**
   - Verify script parsing without syntax errors under Node/headless environments.
   - Run existing prompt and member context unit test suites (`tests/test_prompt_context.js`, `tests/test_member_context.js`, `tests/test_indonesian_casual.js`, `tests/test_e2e_prompt.js`) against the shared core logic.
2. **Mobile Layout Checks:**
   - Test viewport rect calculations with simulated mobile dimensions (390×844px, 430×932px).
   - Test FAB activation when `sk46FindHeaderRightButtons()` returns `[]`.
   - Test `DOMContentLoaded` delayed bootstrap simulation.
3. **Manual Validation on iOS Safari with Stay:**
   - Install script via Stay extension on iOS Safari.
   - Verify that `<flt-semantics-host>` populates.
   - Confirm translate button / FAB appears and settings sheet can be opened.
   - Confirm real-time translation overlay renders over message bubbles.
