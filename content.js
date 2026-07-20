(() => {
  const ROOT_CLASS = "doom-yt";
  const HIDE_SHORTS_CLASS = "doom-yt-hide-shorts";
  const SESSION_CLASS = "doom-yt-session";
  const HIDDEN_ITEM_CLASS = "doom-yt-shorts-item";
  const SESSION_BAR_ID = "doom-yt-session-bar";
  const ACTIVE_MS_KEY = "doomYtSessionActiveMs";
  const WALL_START_KEY = "doomYtSessionWallStart";

  let hideShorts = false;
  let sessionTimerEnabled = true;
  let observer = null;
  let hideTimer = null;
  let sessionInterval = null;
  let activeMs = Number(sessionStorage.getItem(ACTIVE_MS_KEY) || 0);
  let segmentStart =
    document.visibilityState === "visible" ? Date.now() : null;

  if (!sessionStorage.getItem(WALL_START_KEY)) {
    sessionStorage.setItem(WALL_START_KEY, String(Date.now()));
  }

  function applyTheme(enabled) {
    document.documentElement.classList.toggle(ROOT_CLASS, enabled);
  }

  function applyHideShorts(enabled) {
    hideShorts = enabled;
    document.documentElement.classList.toggle(HIDE_SHORTS_CLASS, enabled);

    if (enabled) {
      leaveShortsPage();
      scheduleHideShorts();
      startObserver();
    } else {
      clearHiddenShorts();
      stopObserver();
    }
  }

  function applySessionTimer(enabled) {
    sessionTimerEnabled = enabled;
    document.documentElement.classList.toggle(SESSION_CLASS, enabled);

    if (enabled) {
      ensureSessionBar();
      startSessionClock();
      renderSessionTime();
    } else {
      stopSessionClock();
      flushActiveTime();
      document.getElementById(SESSION_BAR_ID)?.remove();
    }
  }

  function flushActiveTime() {
    if (segmentStart == null) return;
    activeMs += Date.now() - segmentStart;
    segmentStart = document.visibilityState === "visible" ? Date.now() : null;
    sessionStorage.setItem(ACTIVE_MS_KEY, String(activeMs));
  }

  function getElapsedMs() {
    let ms = activeMs;
    if (segmentStart != null) ms += Date.now() - segmentStart;
    return ms;
  }

  function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
  }

  function ensureSessionBar() {
    let bar = document.getElementById(SESSION_BAR_ID);
    if (bar) return bar;

    bar = document.createElement("div");
    bar.id = SESSION_BAR_ID;
    bar.setAttribute("role", "timer");
    bar.setAttribute("aria-live", "off");
    bar.innerHTML = `
      <div class="doom-yt-session-bar__inner">
        <span class="doom-yt-session-bar__label">SESSION</span>
        <span class="doom-yt-session-bar__time" data-session-time>00:00:00</span>
        <div class="doom-yt-session-bar__right">
          <span class="doom-yt-session-bar__meta">ACTIVE TIME ON YOUTUBE</span>
          <button type="button" class="doom-yt-session-bar__reset" title="Reset session timer">RESET</button>
        </div>
      </div>
    `;

    bar.querySelector(".doom-yt-session-bar__reset")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      activeMs = 0;
      segmentStart =
        document.visibilityState === "visible" ? Date.now() : null;
      sessionStorage.setItem(ACTIVE_MS_KEY, "0");
      sessionStorage.setItem(WALL_START_KEY, String(Date.now()));
      renderSessionTime();
    });

    const mount = () => {
      (document.body || document.documentElement).appendChild(bar);
    };

    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });

    return bar;
  }

  function renderSessionTime() {
    const el = document.querySelector(`#${SESSION_BAR_ID} [data-session-time]`);
    if (!el) return;
    el.textContent = formatDuration(getElapsedMs());
  }

  function startSessionClock() {
    if (sessionInterval) return;
    sessionInterval = setInterval(() => {
      if (!sessionTimerEnabled) return;
      renderSessionTime();
      if (Date.now() % 5000 < 1100) flushActiveTime();
    }, 1000);
  }

  function stopSessionClock() {
    if (!sessionInterval) return;
    clearInterval(sessionInterval);
    sessionInterval = null;
  }

  function leaveShortsPage() {
    const path = location.pathname;
    if (path === "/shorts" || path.startsWith("/shorts/")) {
      location.replace("/");
    }
  }

  function isShortsHref(href) {
    if (!href) return false;
    try {
      const url = new URL(href, location.origin);
      return url.pathname === "/shorts" || url.pathname.startsWith("/shorts/");
    } catch {
      return /\/shorts(\/|$)/i.test(href);
    }
  }

  function markShortsTargets() {
    if (!hideShorts) return;

    const anchors = document.querySelectorAll(
      'a[href*="/shorts"], a[href*="/shorts/"]'
    );

    for (const anchor of anchors) {
      if (!isShortsHref(anchor.getAttribute("href") || anchor.href)) continue;

      const item = anchor.closest(
        [
          "ytd-rich-item-renderer",
          "ytd-rich-shelf-renderer",
          "ytd-reel-shelf-renderer",
          "ytd-reel-item-renderer",
          "ytd-grid-video-renderer",
          "ytd-video-renderer",
          "ytd-compact-video-renderer",
          "ytd-guide-entry-renderer",
          "ytd-mini-guide-entry-renderer",
          "ytd-pivot-bar-item-renderer",
          "yt-tab-shape",
          "ytd-thumbnail",
        ].join(",")
      );

      if (item) item.classList.add(HIDDEN_ITEM_CLASS);
    }

    const shelves = document.querySelectorAll(
      "ytd-rich-shelf-renderer, ytd-reel-shelf-renderer, ytd-item-section-renderer"
    );
    for (const shelf of shelves) {
      const title = (
        shelf.querySelector("#title, #title-text, h2, .title")?.textContent || ""
      ).trim();
      if (/^shorts$/i.test(title) || shelf.querySelector('a[href*="/shorts/"]')) {
        shelf.classList.add(HIDDEN_ITEM_CLASS);
      }
    }

    for (const chip of document.querySelectorAll("yt-chip-cloud-chip-renderer")) {
      const label = (chip.textContent || "").trim();
      if (/^shorts$/i.test(label)) chip.classList.add(HIDDEN_ITEM_CLASS);
    }
  }

  function clearHiddenShorts() {
    document
      .querySelectorAll(`.${HIDDEN_ITEM_CLASS}`)
      .forEach((el) => el.classList.remove(HIDDEN_ITEM_CLASS));
  }

  function scheduleHideShorts() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(markShortsTargets, 80);
  }

  function startObserver() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(() => {
      if (!hideShorts) return;
      scheduleHideShorts();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function stopObserver() {
    observer?.disconnect();
    observer = null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushActiveTime();
      segmentStart = null;
    } else if (sessionTimerEnabled) {
      segmentStart = Date.now();
    }
  });

  window.addEventListener("pagehide", flushActiveTime);

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "DOOM_YT_SETTINGS") {
      if ("enabled" in message) applyTheme(Boolean(message.enabled));
      if ("hideShorts" in message) applyHideShorts(Boolean(message.hideShorts));
      if ("sessionTimer" in message) {
        applySessionTimer(Boolean(message.sessionTimer));
      }
      return;
    }
    if (message?.type === "DOOM_YT_TOGGLE") {
      applyTheme(Boolean(message.enabled));
    }
  });

  document.documentElement.classList.add(ROOT_CLASS);
  document.documentElement.classList.add(SESSION_CLASS);

  chrome.storage.local.get(
    { enabled: true, hideShorts: false, sessionTimer: true },
    (result) => {
      applyTheme(result.enabled !== false);
      applyHideShorts(Boolean(result.hideShorts));
      applySessionTimer(result.sessionTimer !== false);
    }
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.enabled) applyTheme(changes.enabled.newValue !== false);
    if (changes.hideShorts) applyHideShorts(Boolean(changes.hideShorts.newValue));
    if (changes.sessionTimer) {
      applySessionTimer(changes.sessionTimer.newValue !== false);
    }
  });

  window.addEventListener("yt-navigate-finish", () => {
    if (sessionTimerEnabled) {
      ensureSessionBar();
      renderSessionTime();
    }
    if (!hideShorts) return;
    leaveShortsPage();
    scheduleHideShorts();
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!hideShorts) return;
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      if (!isShortsHref(anchor.getAttribute("href") || anchor.href)) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
})();
