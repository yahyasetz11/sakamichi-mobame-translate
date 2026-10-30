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

  // ===================== CONSTANTS =====================
  const CLOUDFRONT_DOMAIN = "dmu54xlwnhgck.cloudfront.net";
  const PATH_PATTERN = /\/private\/messages\//;
  const THUMBNAIL_FILTER = /\/thumbnails\//;
  const VIDEO_THUMBNAIL_PATTERN = /\.\d{7}\./;

  const mediaQueue = new Map();
  let panelOpen = false;

  // ===================== UTILITIES =====================
  function log(...args) {
    console.log("[S46]", ...args);
  }

  function showToast(msg, type = "info") {
    const old = document.querySelector(".s46-toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.className = "s46-toast " + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 200);
    }, 4000);
  }

  function getFilename(url) {
    try {
      const parts = new URL(url).pathname.split("/");
      return decodeURIComponent(parts.pop().split("?")[0]);
    } catch {
      return "media_" + Date.now();
    }
  }

  function getMediaType(filename) {
    if (/\.(jpe?g|png|gif|webp|bmp|svg|ico)$/i.test(filename)) return "image";
    if (/\.(mp4|mov|webm|avi|mkv|flv|wmv)$/i.test(filename)) return "video";
    if (/\.(mp3|aac|wav|m4a|flac|ogg|wma)$/i.test(filename)) return "audio";
    return "file";
  }

  function getIcon(type) {
    return type === "image"
      ? "🖼️"
      : type === "video"
        ? "🎬"
        : type === "audio"
          ? "🎵"
          : "📄";
  }

  function isUrlValid(url) {
    try {
      const expires = new URL(url).searchParams.get("Expires");
      if (expires) {
        const remaining = parseInt(expires) - Math.floor(Date.now() / 1000);
        return { valid: remaining > 0, remaining };
      }
    } catch {}
    return { valid: true, remaining: Infinity };
  }

  // ===================== STYLES =====================
  GM_addStyle(`
        #s46-panel {
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
            background: #e74c3c;
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
            background: #e74c3c;
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
        .s46-item .dl-btn:hover { background: #c0392b; transform: scale(1.05); }
        .s46-item .dl-btn:disabled { background: #555; cursor: not-allowed; transform: none; }
        .s46-item .dl-btn.success { background: #2ecc71; }
        .s46-item .dl-btn.error { background: #7f8c8d; }

        .s46-empty { padding: 20px; text-align: center; color: #666; font-size: 13px; }

        .s46-toast {
            position: fixed; bottom: 100px; right: 30px;
            padding: 12px 18px; background: rgba(0,0,0,0.85);
            color: white; border-radius: 10px; font-size: 13px;
            z-index: 1000001; animation: s46-fadeIn 0.25s ease;
            border-left: 4px solid #3498db;
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

  // ===================== CAPTURE MEDIA =====================
  function handleCapturedUrl(url) {
    if (!url) return;

    if (THUMBNAIL_FILTER.test(url) || VIDEO_THUMBNAIL_PATTERN.test(url)) {
      return;
    }

    if (!url.includes(CLOUDFRONT_DOMAIN) || !PATH_PATTERN.test(url)) {
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

  if (window.PerformanceObserver) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "resource") {
          handleCapturedUrl(entry.name);
        }
      }
    });
    observer.observe({ entryTypes: ["resource"] });
    log("PerformanceObserver active.");
  } else {
    showToast("PerformanceObserver not supported!", "error");
  }

  // ===================== UI =====================
  function togglePanel(forceState) {
    const body = document.querySelector("#s46-body");
    const arrow = document.querySelector("#s46-header .arrow");
    if (!body) return;
    const isOpen = forceState !== undefined ? forceState : !panelOpen;
    panelOpen = isOpen;
    body.classList.toggle("open", panelOpen);
    if (arrow) arrow.classList.toggle("open", panelOpen);
  }

  function updateUI() {
    const body = document.querySelector("#s46-body");
    const badge = document.querySelector("#s46-header .badge");
    if (!body) return;

    if (badge) badge.textContent = mediaQueue.size;

    body.innerHTML = "";
    if (mediaQueue.size === 0) {
      body.innerHTML =
        '<div class="s46-empty">📭 No media detected.<br>Open a photo, video, or audio.</div>';
      return;
    }

    for (const item of mediaQueue.values()) {
      const div = document.createElement("div");
      div.className = "s46-item";

      const thumb = document.createElement("div");
      thumb.className = "s46-thumb";
      if (item.type === "image") {
        const img = document.createElement("img");
        img.src = item.url;
        img.loading = "lazy";
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => {
          thumb.innerHTML = `<span class="fallback-icon">🖼️</span>`;
        };
        thumb.appendChild(img);
      } else {
        thumb.innerHTML = `<span class="fallback-icon">${item.icon}</span>`;
      }

      const info = document.createElement("div");
      info.className = "info";
      info.innerHTML = `
                <span class="fname">${item.filename}</span>
                <span class="type-badge">${item.type}</span>
            `;

      const btn = document.createElement("button");
      btn.className = "dl-btn";
      btn.textContent = "⬇ Download";
      btn.dataset.url = item.url;
      btn.dataset.filename = item.filename;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleDownload(item.url, item.filename, btn);
      });

      div.append(thumb, info, btn);
      body.appendChild(div);
    }
  }

  // ===================== DOWNLOAD =====================
  function handleDownload(url, filename, btn) {
    const status = isUrlValid(url);
    if (!status.valid) {
      showToast("URL expired! Reopen the media.", "error");
      btn.textContent = "⛔ Expired";
      btn.className = "dl-btn error";
      btn.disabled = true;
      return;
    }

    btn.textContent = "⏳ Loading...";
    btn.disabled = true;
    btn.className = "dl-btn";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    fetch(url, {
      cache: "force-cache",
      mode: "cors",
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeout);
        if (!res.ok) throw new Error("Cache miss or HTTP " + res.status);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        btn.textContent = "✅ Done!";
        btn.className = "dl-btn success";
        showToast("Downloaded from cache: " + filename, "success");
        setTimeout(() => {
          if (mediaQueue.has(url)) {
            btn.textContent = "⬇ Download";
            btn.className = "dl-btn";
            btn.disabled = false;
          }
        }, 3000);
      })
      .catch((err) => {
        clearTimeout(timeout);
        log("Cache failed, using fallback for", filename);
        showToast("Fetching directly...", "info");

        GM_xmlhttpRequest({
          method: "GET",
          url: url,
          responseType: "blob",
          onload: (res) => {
            if (res.status === 200) {
              const blob = URL.createObjectURL(res.response);
              const a = document.createElement("a");
              a.href = blob;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(blob), 5000);
              btn.textContent = "✅ Done!";
              btn.className = "dl-btn success";
              showToast("Downloaded: " + filename, "success");
              setTimeout(() => {
                if (mediaQueue.has(url)) {
                  btn.textContent = "⬇ Download";
                  btn.className = "dl-btn";
                  btn.disabled = false;
                }
              }, 3000);
            } else {
              btn.textContent = "❌ Failed";
              btn.className = "dl-btn error";
              showToast("HTTP " + res.status, "error");
              btn.disabled = false;
            }
          },
          onerror: () => {
            btn.textContent = "❌ Error";
            btn.className = "dl-btn error";
            showToast("Network error", "error");
            btn.disabled = false;
          },
          ontimeout: () => {
            btn.textContent = "⏱ Timeout";
            btn.className = "dl-btn error";
            showToast("Timeout", "error");
            btn.disabled = false;
          },
        });
      });
  }

  // ===================== BUILD PANEL =====================
  function buildPanel() {
    const panel = document.createElement("div");
    panel.id = "s46-panel";

    const header = document.createElement("div");
    header.id = "s46-header";
    header.innerHTML = `
            <span>📦 Media Queue <span class="badge">0</span></span>
            <span class="arrow">▾</span>
        `;
    header.addEventListener("click", () => togglePanel());

    const body = document.createElement("div");
    body.id = "s46-body";
    body.innerHTML =
      '<div class="s46-empty">📭 No media detected.<br>Open a photo, video, or audio.</div>';

    panel.append(header, body);
    document.body.appendChild(panel);
    updateUI();

    setTimeout(() => {
      if (mediaQueue.size > 0) togglePanel(true);
    }, 1500);
  }

  // ===================== INIT =====================
  log("Sakura46 Downloader loaded.");
  buildPanel();
  showToast("🟢 Ready! Media will appear in queue.", "success");

  window.addEventListener("flutter-first-frame", () =>
    log("Flutter frame rendered."),
  );
})();
