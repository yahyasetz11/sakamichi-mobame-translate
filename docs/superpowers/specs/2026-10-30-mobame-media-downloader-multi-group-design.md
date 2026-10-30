# Design Spec: Sakamichi Mobame Media Downloader Multi-Group Modularity

- **Date:** 2026-10-30
- **Status:** Approved
- **Target File:** `src/mobame-media-downloader.user.js`

## 1. Overview
Extend the `mobame-media-downloader` userscript from only supporting Sakurazaka46 to supporting all three Sakamichi groups (Sakurazaka46, Nogizaka46, and Hinatazaka46) web messaging applications. The script adopts the modular architecture, branding accents, metadata, and origin handling established in `sakamichi-mobame-translate.user.js`.

---

## 2. Goals & Non-Goals

### Goals
- **Multi-Group Support:** Seamlessly run on `message.sakurazaka46.com`, `message.nogizaka46.com`, and `message.hinatazaka46.com`.
- **Consistent Modularity:** Use a structured registry (`SK46_GROUPS`) keyed by hostname containing group metadata (group id, label, origin, accent color, and CDN domain).
- **Dynamic Theming:** Adapt UI components (buttons, badges, toast borders) to each group's official accent color.
- **Robust Network Requests:** Use `Referer` and `Origin` headers matching the active group in `GM_xmlhttpRequest` fallbacks.
- **CDN Domain Detection:** Match media resources using the active group's CloudFront domain, with fallback to any known Sakamichi CloudFront CDN domain or CloudFront pattern.
- **Top-Frame Execution:** Guard against running inside sub-iframes with `window.top !== window.self`.

### Non-Goals
- Altering the core download algorithm (cache-first via `fetch`, fallback via `GM_xmlhttpRequest`).
- Adding external settings sheets or modifying `sakamichi-mobame-translate.user.js`.

---

## 3. Metadata & Architecture

### 3.1 Userscript Metadata Block
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
```

### 3.2 Group Registry (`SK46_GROUPS`)
```javascript
if (window.top !== window.self) return;

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

---

## 4. Media Capture & Download Logic

### 4.1 URL Filtering
- `PATH_PATTERN`: `/\/private\/messages\//`
- `THUMBNAIL_FILTER`: `/\/thumbnails\//`
- `VIDEO_THUMBNAIL_PATTERN`: `/\.\d{7}\./`
- `KNOWN_CDN_DOMAINS`:
  - `SK46_GROUP.cdnDomain`
  - `dmu54xlwnhgck.cloudfront.net`
  - `djznowbmqickg.cloudfront.net`
  - `d3ux740zhdvrpf.cloudfront.net`
- Media filtering predicate:
  1. URL must not match `THUMBNAIL_FILTER` or `VIDEO_THUMBNAIL_PATTERN`.
  2. URL must match `PATH_PATTERN`.
  3. URL host must match any domain in `KNOWN_CDN_DOMAINS` or match `\.cloudfront\.net$`.
  4. URL must not be expired per `isUrlValid(url)`.
  5. URL must not already exist in `mediaQueue`.

### 4.2 Download Fallback Headers
In `handleDownload`:
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
  // ...
});
```

---

## 5. UI Theming & User Feedback

### 5.1 CSS Custom Property Theming
The UI style will define `--sk46-accent: ${SK46_GROUP.accent};`:
- Header badge: `background: var(--sk46-accent);`
- Download button: `background: var(--sk46-accent);`
- Download button hover: `filter: brightness(0.9);`
- Toast notification left border: `border-left-color: var(--sk46-accent);` (for info toasts)

### 5.2 Header and Scoped Logging
- Header queue label: `📦 ${SK46_GROUP.label} Media <span class="badge">0</span>`
- Console logging: `console.log(\`[${SK46_GROUP.label}]\`, ...args)`
- Startup notification: `showToast(\`🟢 ${SK46_GROUP.label} Downloader ready! Media will appear in queue.\`, "success")`

---

## 6. Verification Plan

1. **Syntax & Runtime Integrity Check:** Run a node script or linter checking for syntax errors or unresolved variables in `mobame-media-downloader.user.js`.
2. **Metadata Validation:** Ensure all three `@match` domains and `@connect` directives are present.
3. **Registry Check:** Confirm `SK46_GROUPS` contains entries for Sakurazaka46, Nogizaka46, and Hinatazaka46 with accurate colors and origins.
4. **Offline Mock Test:** Run a test simulating `location.hostname` across `message.sakurazaka46.com`, `message.nogizaka46.com`, and `message.hinatazaka46.com` to verify initialization, CSS variables, and URL filtering.
