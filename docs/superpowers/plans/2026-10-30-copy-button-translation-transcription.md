# Translation & Transcription Copy Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a copy button for translation on message bubbles (positioned to the left of the reload button) and a copy button in the audio voice message popup tab bar (top-right corner, copying either transcription or translation depending on active tab).

**Architecture:** 
- Shared SVG icons for copy and checkmark.
- Shared clipboard helper with `navigator.clipboard.writeText` and `document.execCommand` fallback.
- Per-bubble `copyEl` attached to `sk46TextEntries` and rendered in `sk46RefreshLayer`, visible when translation exists.
- Dedicated `#popup-copy-btn` inside `#popup-tabs` with `margin-left: auto;` in `sk46PopupShadow`, conditionally copying `entry.transcript` or `entry.translated`.

**Tech Stack:** JavaScript (ES6+ Userscript, DOM APIs, Shadow DOM, Clipboard API).

---

### Task 1: Create Unit Test Harness for Copy Button Feature

**Files:**
- Create: `tests/test-copy-button.js`
- Test: `tests/test-copy-button.js`

- [ ] **Step 1: Write the test harness**

Create `tests/test-copy-button.js` to verify icons, button elements, positioning, and popup copy behavior:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test-copy-button.js`
Expected: FAIL with "AssertionError: Should define SK46_ICON_COPY"

- [ ] **Step 3: Commit test harness**

```bash
git add -f tests/test-copy-button.js
git commit -m "test: add test harness for translation and transcription copy buttons"
```

---

### Task 2: Implement SVG Icons and Clipboard Helper

**Files:**
- Modify: `src/sakamichi-mobame-translate.user.js` (~lines 930-935)
- Test: `tests/test-copy-button.js`

- [ ] **Step 1: Add SVG icons and clipboard function**

In `src/sakamichi-mobame-translate.user.js`, define `SK46_ICON_COPY` and `SK46_ICON_CHECK`:

```javascript
  const SK46_ICON_COPY = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true"><path d="M360-240q-29.7 0-50.85-21.15Q288-282.3 288-312v-480q0-29.7 21.15-50.85Q330.3-864 360-864h384q29.7 0 50.85 21.15Q816-821.7 816-792v480q0-29.7-21.15 50.85Q773.7-240 744-240H360Zm0-72h384v-480H360v480ZM216-96q-29.7 0-50.85-21.15Q144-138.3 144-168v-552h72v552h456v72H216Zm144-216v-480 480Z"/></svg>`;
  const SK46_ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;
```

Add the clipboard utility function:

```javascript
  async function sk46CopyToClipboard(text) {
    if (!text) return false;
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText =
        "position:fixed;opacity:0;top:0;left:0;pointer-events:none;z-index:-1;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch {
      return false;
    }
  }
```

- [ ] **Step 2: Run syntax verification**

Run: `node -c src/sakamichi-mobame-translate.user.js`
Expected: 0 syntax errors.

- [ ] **Step 3: Commit Task 2 changes**

```bash
git add src/sakamichi-mobame-translate.user.js
git commit -m "feat: add copy and checkmark icons and clipboard helper"
```

---

### Task 3: Implement Message Bubble Copy Button

**Files:**
- Modify: `src/sakamichi-mobame-translate.user.js` (CSS, `sk46BuildCopyBtn`, `sk46UpdateCopyBtnPosition`, `sk46BuildTextEntry`, `sk46RepositionLoop`)
- Test: `tests/test-copy-button.js`

- [ ] **Step 1: Add CSS styles for `.sk46-copy-btn`**

Add style definitions for `.sk46-copy-btn` in `sk46OverlayStyle`:

```css
        .sk46-copy-btn {
            position: fixed;
            display: flex; align-items: center; justify-content: center;
            padding: 0; margin: 0; border: none; background: transparent;
            color: var(--sk46-sender-color, #888);
            cursor: pointer;
            pointer-events: auto;
            overflow: visible;
            -webkit-tap-highlight-color: transparent;
            opacity: 0.85;
            transition: opacity 0.15s ease, color 0.15s ease;
        }
        .sk46-copy-btn:hover { opacity: 1; }
        .sk46-copy-btn:active { opacity: 0.5; }
        .sk46-copy-btn svg { width: 100%; height: 100%; display: block; }
        .sk46-copy-btn.copied { color: #2ecc71; }
        .sk46-copy-btn:hover .sk46-refresh-tip:not(:empty),
        .sk46-copy-btn:focus .sk46-refresh-tip:not(:empty),
        .sk46-copy-btn.copied .sk46-refresh-tip:not(:empty) {
            opacity: 1;
            visibility: visible;
        }
```

- [ ] **Step 2: Add `sk46BuildCopyBtn` and `sk46UpdateCopyBtnPosition`**

Add constants:
```javascript
  const sk46CopyBtnGapPx = 4;
```

Add builder and positioning functions:
```javascript
  function sk46BuildCopyBtn(entry) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sk46-copy-btn";
    btn.setAttribute("aria-label", "Copy translation");
    btn.innerHTML = SK46_ICON_COPY;
    const tip = document.createElement("span");
    tip.className = "sk46-refresh-tip";
    tip.setAttribute("aria-hidden", "true");
    tip.textContent = "Copy translation";
    btn.appendChild(tip);
    btn._sk46Tip = tip;
    btn._sk46ResetTimer = null;

    btn.addEventListener("mouseenter", () => sk46PlaceRefreshErrorTip(btn));
    btn.addEventListener("focus", () => sk46PlaceRefreshErrorTip(btn));
    btn.style.width = sk46RefreshBtnSizePx + "px";
    btn.style.height = sk46RefreshBtnSizePx + "px";
    btn.style.display = "none";

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = entry && entry.node && entry.node.text;
      if (!text) return;
      const key = sk46TranslationCacheKey(text);
      const cached = sk46TranslationCache.get(key);
      const translated = cached && cached.status === "ok" ? cached.translated : "";
      if (!translated) return;

      const ok = await sk46CopyToClipboard(translated);
      if (ok) {
        btn.classList.add("copied");
        btn.innerHTML = SK46_ICON_CHECK;
        tip.textContent = "Copied!";
        btn.appendChild(tip);
        sk46PlaceRefreshErrorTip(btn);
        if (btn._sk46ResetTimer) clearTimeout(btn._sk46ResetTimer);
        btn._sk46ResetTimer = setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = SK46_ICON_COPY;
          tip.textContent = "Copy translation";
          btn.appendChild(tip);
        }, 1500);
      }
    });

    btn.addEventListener("mousedown", (e) => e.stopPropagation());
    btn.addEventListener("pointerdown", (e) => e.stopPropagation());
    btn.addEventListener("contextmenu", (e) => e.stopPropagation());
    return btn;
  }

  function sk46UpdateCopyBtnPosition(entry, rect, visible) {
    const btn = entry.copyEl;
    if (!btn) return;
    if (!visible) {
      if (btn.style.display !== "none") btn.style.display = "none";
      return;
    }
    const sz = sk46RefreshBtnSizePx;
    const left = rect.right - (sz * 2) - sk46RefreshBtnOffsetXPx - sk46CopyBtnGapPx;
    const top = rect.top + sk46RefreshBtnOffsetYPx;
    btn.style.left = left + "px";
    btn.style.top = top + "px";
    btn.style.width = sz + "px";
    btn.style.height = sz + "px";
    if (btn.style.display !== "flex") btn.style.display = "flex";
  }
```

- [ ] **Step 3: Integrate `copyEl` into entry construction and repositioning loop**

In entry creation (around lines 4818–4836):
- Add `copyEl: null` to entry object.
- In `if (wantRefreshBtn && isRealText)`:
  ```javascript
  const copyEl = sk46BuildCopyBtn(entry);
  entry.copyEl = copyEl;
  sk46RefreshLayer.appendChild(copyEl);
  ```

In `sk46RepositionLoop` (around lines 5001–5015):
```javascript
      if (entry.copyEl) {
        const text = entry.node && entry.node.text;
        const key = text ? sk46TranslationCacheKey(text) : null;
        const cached = key ? sk46TranslationCache.get(key) : null;
        const hasTranslation = cached && cached.status === "ok" && !!cached.translated;
        const copyVisible = visible && hasTranslation;
        sk46UpdateCopyBtnPosition(entry, r, copyVisible);
      }
```

- [ ] **Step 4: Verify syntax & run tests**

Run: `node -c src/sakamichi-mobame-translate.user.js`
Run: `node tests/test-copy-button.js`

- [ ] **Step 5: Commit Task 3 changes**

```bash
git add src/sakamichi-mobame-translate.user.js
git commit -m "feat: implement message bubble copy translation button"
```

---

### Task 4: Implement Audio Message Popup Copy Button

**Files:**
- Modify: `src/sakamichi-mobame-translate.user.js` (`sk46PopupShadow` HTML/CSS, `sk46RenderPopup`, and event wiring)
- Test: `tests/test-copy-button.js`

- [ ] **Step 1: Add HTML and CSS for `#popup-copy-btn` in `sk46PopupShadow`**

In `sk46PopupShadow.innerHTML`:
Add CSS:
```css
            #popup-copy-btn {
                all: unset;
                margin-left: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                cursor: pointer;
                color: #8e8e8e;
                position: relative;
                transition: color .15s ease, background .15s ease, opacity .15s ease;
                -webkit-tap-highlight-color: transparent;
            }
            #popup-copy-btn:hover { background: rgba(0,0,0,0.06); color: #1a1a1a; }
            #popup-copy-btn:active { background: rgba(0,0,0,0.12); }
            #popup-copy-btn.disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
            #popup-copy-btn.copied { color: #2ecc71; }
            #popup-copy-btn svg { width: 18px; height: 18px; display: block; }
            #popup-copy-tip {
                position: absolute;
                bottom: calc(100% + 6px);
                right: 0;
                padding: 4px 8px;
                border-radius: 6px;
                background: #1a1a1a;
                color: #fff;
                font-size: 11px;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transition: opacity 0.12s ease, visibility 0.12s ease;
            }
            #popup-copy-tip.visible { opacity: 1; visibility: visible; }
```

In `#popup-tabs`:
```html
            <div id="popup-tabs">
                <div class="tab active" data-tab="original">Original</div>
                <div class="tab" data-tab="translated">Translation</div>
                <button id="popup-copy-btn" type="button" aria-label="Copy" title="Copy">
                    <span id="popup-copy-icon">${SK46_ICON_COPY}</span>
                    <span id="popup-copy-tip">Copied!</span>
                </button>
            </div>
```

- [ ] **Step 2: Wire copy action and update button state in `sk46RenderPopup`**

In popup script setup:
```javascript
  const sk46PopupCopyBtn = sk46PopupShadow.getElementById("popup-copy-btn");
  const sk46PopupCopyIcon = sk46PopupShadow.getElementById("popup-copy-icon");
  const sk46PopupCopyTip = sk46PopupShadow.getElementById("popup-copy-tip");
  let sk46PopupCopyResetTimer = null;

  if (sk46PopupCopyBtn) {
    sk46PopupCopyBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!sk46PopupEntry) return;
      const targetText =
        sk46PopupTab === "original"
          ? (sk46PopupEntry.transcript || "")
          : (sk46PopupEntry.translated || "");
      if (!targetText.trim()) return;

      const ok = await sk46CopyToClipboard(targetText.trim());
      if (ok) {
        sk46PopupCopyBtn.classList.add("copied");
        if (sk46PopupCopyIcon) sk46PopupCopyIcon.innerHTML = SK46_ICON_CHECK;
        if (sk46PopupCopyTip) sk46PopupCopyTip.classList.add("visible");
        if (sk46PopupCopyResetTimer) clearTimeout(sk46PopupCopyResetTimer);
        sk46PopupCopyResetTimer = setTimeout(() => {
          sk46PopupCopyBtn.classList.remove("copied");
          if (sk46PopupCopyIcon) sk46PopupCopyIcon.innerHTML = SK46_ICON_COPY;
          if (sk46PopupCopyTip) sk46PopupCopyTip.classList.remove("visible");
        }, 1500);
      }
    });
  }
```

In `sk46RenderPopup(entry)`:
Update `#popup-copy-btn` state depending on whether `targetText` is present:
```javascript
    if (sk46PopupCopyBtn) {
      const hasContent =
        sk46PopupTab === "original"
          ? !!(entry && entry.transcript && entry.transcript.trim())
          : !!(entry && entry.translated && entry.translated.trim());
      sk46PopupCopyBtn.classList.toggle("disabled", !hasContent);
      sk46PopupCopyBtn.setAttribute("aria-disabled", String(!hasContent));
    }
```

- [ ] **Step 3: Run test suite**

Run: `node tests/test-copy-button.js`
Expected: PASS with "All copy button static checks passed!"

- [ ] **Step 4: Commit Task 4 changes**

```bash
git add src/sakamichi-mobame-translate.user.js
git commit -m "feat: implement audio voice message popup copy button"
```

---

### Task 5: Final Verification

**Files:**
- `src/sakamichi-mobame-translate.user.js`
- `tests/test-copy-button.js`
- `tests/test-mobame-media-downloader.js`

- [ ] **Step 1: Run all test suites**

Run: `node tests/test-copy-button.js`
Run: `node tests/test-mobame-media-downloader.js`
Verify: All tests pass cleanly.

- [ ] **Step 2: Syntax and Git status check**

Run: `node -c src/sakamichi-mobame-translate.user.js`
Run: `git status`
Verify: No untracked errors, clean working directory.
