# Design Spec: Translation and Transcription Copy Buttons

- **Date:** 2026-10-30
- **Status:** Approved
- **Target File:** `src/sakamichi-mobame-translate.user.js`

## 1. Overview
Add copy button functionality to `sakamichi-mobame-translate`:
1. **Message Bubble (Text & Image):** A dedicated copy button placed to the left of the existing reload/refresh button above each translated message bubble, allowing one-click copying of the translated text.
2. **Audio Voice Message (Popup):** A copy button located at the top-right corner of the audio transcript popup card (aligned horizontally with the "Original" and "Translation" tabs) that dynamically copies the transcript or translation depending on which tab is active.

---

## 2. Goals & Non-Goals

### Goals
- **One-Click Text Copy:** Quick copying of translations from chat bubbles and transcripts/translations from audio voice message popups.
- **Accurate Tab Synchronization:** For audio voice messages, copy the Japanese transcription when the "Original" tab is open, and copy the translated text when the "Translation" tab is open.
- **Clean Plain-Text Extraction:** Strip any karaoke span formatting or HTML tags so only pure text with original line breaks is copied to the clipboard.
- **Harmonious UI:** Match existing icons, sender colors, hover transitions, and tooltips of the reload button (`sk46-refresh-btn`) and popup card header.
- **Dynamic Visibility & States:** Only show/enable copy actions when text is available; show clear visual feedback (`✓` checkmark and "Copied!" tooltip) upon copying.
- **Robust Clipboard Support:** Primary asynchronous `navigator.clipboard.writeText` with fallback to `document.execCommand('copy')`.

### Non-Goals
- Adding copy buttons to untranslated messages (unless viewing the original tab in the audio transcript popup).
- Modifying the underlying translation/transcription storage models.

---

## 3. Architecture & UI Details

### 3.1 Icons
Add SVG icons for Copy and Checkmark:
- `SK46_ICON_COPY`: Clean outline clipboard / document icon.
- `SK46_ICON_CHECK`: Checkmark icon indicating successful copy.

### 3.2 Message Bubble Copy Button
- **DOM Integration:** Each `entry` in `sk46TextEntries` gains `copyEl: HTMLButtonElement | null`.
- **Creation (`sk46BuildCopyBtn`):**
  - Class: `sk46-refresh-btn sk46-copy-btn`
  - SVG: `SK46_ICON_COPY`
  - Tooltip: Child `.sk46-refresh-tip` showing `"Copy translation"` on hover, switching to `"Copied!"` on success.
  - Layer: Appended to `sk46RefreshLayer`.
- **Positioning (`sk46UpdateCopyBtnPosition`):**
  - Dimensions: `sk46RefreshBtnSizePx = 24px`
  - Gap: `sk46CopyBtnGapPx = 4px`
  - `left`: `rect.right - (sz * 2) - sk46RefreshBtnOffsetXPx - sk46CopyBtnGapPx`
  - `top`: `rect.top + sk46RefreshBtnOffsetYPx` (identical Y-coordinate to the reload button)
- **Visibility:**
  - Displayed if and only if:
    1. The message bubble is visible and within scroll/boundary limits.
    2. A successful translation exists in `sk46TranslationCache` for `entry.translationKey` with non-empty translated text.

### 3.3 Audio Voice Message Popup Copy Button
- **DOM Integration:** Located inside `#popup-tabs` in `sk46PopupShadow`:
  ```html
  <div id="popup-tabs">
      <div class="tab active" data-tab="original">Original</div>
      <div class="tab" data-tab="translated">Translation</div>
      <button id="popup-copy-btn" class="popup-copy-btn" type="button" aria-label="Copy" title="Copy">
          <span class="icon">${SK46_ICON_COPY}</span>
          <span id="popup-copy-tip" class="popup-tip">Copied!</span>
      </button>
  </div>
  ```
- **Styling:**
  - `margin-left: auto;`: Pins the button to the far top-right corner of the tab bar.
  - Size: 24×24px with flex centering and subtle opacity transitions matching tabs.
- **Copy Logic:**
  - If `sk46PopupTab === 'original'`: copies `sk46PopupEntry.transcript`.
  - If `sk46PopupTab === 'translated'`: copies `sk46PopupEntry.translated`.
  - If the active tab's content is missing or in progress, the button is disabled (`opacity: 0.35; pointer-events: none;`).

### 3.4 Clipboard Helper (`sk46CopyToClipboard`)
- Asynchronous function accepting `text`:
  1. Checks if `navigator.clipboard && navigator.clipboard.writeText` is available and resolves.
  2. If permission is denied or in an isolated context, creates a temporary off-screen `<textarea>`, selects content, executes `document.execCommand('copy')`, and removes the element.
- Returns boolean `true` on success, `false` on failure.

---

## 4. User Interaction & Feedback

1. **Click Action:**
   - On click, prevents default and stops propagation to avoid triggering chat or popup background clicks.
   - Triggers `sk46CopyToClipboard(text)`.
2. **Success Feedback:**
   - Swaps button inner SVG to `SK46_ICON_CHECK`.
   - Tooltip text updates to `"Copied!"` with visibility active.
   - Sets a 1500ms timeout to restore `SK46_ICON_COPY` and reset tooltip text.

---

## 5. Verification Plan

1. **Unit / Mock Verification:**
   - Verify `sk46BuildCopyBtn` creates element with proper classes, aria labels, and tooltips.
   - Verify `sk46UpdateCopyBtnPosition` positions the copy button exactly `sz + gap` to the left of the reload button.
   - Verify `popup-copy-btn` copies `transcript` when on original tab, and `translated` when on translation tab.
   - Verify clipboard fallback executes without throwing in non-clipboard environments.
2. **Syntax & Runtime Check:**
   - Run `node -c src/sakamichi-mobame-translate.user.js` to ensure clean syntax.
