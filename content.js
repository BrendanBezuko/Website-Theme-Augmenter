(() => {
  const ROOT_CLASS = "doom-yt";
  const HIDE_SHORTS_CLASS = "doom-yt-hide-shorts";
  const SESSION_CLASS = "doom-yt-session";
  const HIDDEN_ITEM_CLASS = "doom-yt-shorts-item";
  const SESSION_BAR_ID = "doom-yt-session-bar";

  const host = location.hostname.replace(/^www\./, "");
  const site =
    host.includes("youtube.com")
      ? "youtube"
      : host.includes("facebook.com")
        ? "facebook"
        : host === "x.com" || host.includes("twitter.com")
          ? "twitter"
          : host.includes("linkedin.com")
            ? "linkedin"
            : "unknown";

  const SITE_LABEL = {
    youtube: "YOUTUBE",
    facebook: "FACEBOOK",
    twitter: "TWITTER / X",
    linkedin: "LINKEDIN",
    unknown: "SITE",
  }[site];

  const ACTIVE_MS_KEY = `doomHudActiveMs:${site}`;
  const WALL_START_KEY = `doomHudWallStart:${site}`;

  const DEFAULT_SITES = {
    youtube: true,
    facebook: true,
    twitter: true,
    linkedin: true,
  };

  let siteEnabledMap = { ...DEFAULT_SITES };
  let themeWanted = true;
  let hideShortsWanted = false;
  let sessionTimerWanted = true;
  let hideShorts = false;
  let sessionTimerEnabled = false;
  let observer = null;
  let hideTimer = null;
  let sessionInterval = null;
  let activeMs = Number(sessionStorage.getItem(ACTIVE_MS_KEY) || 0);
  let segmentStart =
    document.visibilityState === "visible" ? Date.now() : null;

  document.documentElement.dataset.doomSite = site;

  if (!sessionStorage.getItem(WALL_START_KEY)) {
    sessionStorage.setItem(WALL_START_KEY, String(Date.now()));
  }

  function isSiteEnabled() {
    if (site === "unknown") return false;
    return siteEnabledMap[site] !== false;
  }

  function applyTheme(enabled) {
    document.documentElement.classList.toggle(ROOT_CLASS, enabled);
  }

  function applyHideShorts(enabled) {
    hideShorts = enabled;
    document.documentElement.classList.toggle(HIDE_SHORTS_CLASS, enabled);

    if (enabled) {
      leaveShortFormPages();
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

  function syncFeatures() {
    const on = isSiteEnabled();
    applyTheme(on && themeWanted);
    applyHideShorts(on && hideShortsWanted);
    applySessionTimer(on && sessionTimerWanted);
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
    return [hours, minutes, seconds]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
  }

  function ensureSessionBar() {
    let bar = document.getElementById(SESSION_BAR_ID);
    if (bar) {
      const meta = bar.querySelector(".doom-yt-session-bar__meta");
      if (meta) meta.textContent = `ACTIVE TIME ON ${SITE_LABEL}`;
      return bar;
    }

    bar = document.createElement("div");
    bar.id = SESSION_BAR_ID;
    bar.setAttribute("role", "timer");
    bar.setAttribute("aria-live", "off");
    bar.innerHTML = `
      <div class="doom-yt-session-bar__inner">
        <span class="doom-yt-session-bar__label">SESSION // ${SITE_LABEL}</span>
        <span class="doom-yt-session-bar__time" data-session-time>00:00:00</span>
        <div class="doom-yt-session-bar__right">
          <span class="doom-yt-session-bar__meta">ACTIVE TIME ON ${SITE_LABEL}</span>
          <button type="button" class="doom-yt-session-bar__reset" title="Reset session timer">RESET</button>
        </div>
      </div>
    `;

    bar
      .querySelector(".doom-yt-session-bar__reset")
      ?.addEventListener("click", (event) => {
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

  function leaveShortFormPages() {
    const path = location.pathname;
    if (site === "youtube" && (path === "/shorts" || path.startsWith("/shorts/"))) {
      location.replace("/");
      return;
    }
    if (
      site === "facebook" &&
      (path === "/reel" ||
        path.startsWith("/reel/") ||
        path === "/reels" ||
        path.startsWith("/reels/"))
    ) {
      location.replace("/");
    }
  }

  function isBlockedHref(href) {
    if (!href) return false;
    try {
      const url = new URL(href, location.origin);
      const path = url.pathname;
      if (site === "youtube") {
        return path === "/shorts" || path.startsWith("/shorts/");
      }
      if (site === "facebook") {
        return (
          path === "/reel" ||
          path.startsWith("/reel/") ||
          path === "/reels" ||
          path.startsWith("/reels/")
        );
      }
      if (site === "twitter") {
        return path === "/explore" || path.startsWith("/i/broadcasts");
      }
      if (site === "linkedin") {
        return path.startsWith("/video") || path.startsWith("/games");
      }
    } catch {
      if (site === "youtube") return /\/shorts(\/|$)/i.test(href);
      if (site === "facebook") return /\/reels?(\/|$)/i.test(href);
      if (site === "linkedin") return /\/(video|games)(\/|$)/i.test(href);
    }
    return false;
  }

  function markClosest(anchor, selectors) {
    const item = anchor.closest(selectors);
    if (item) item.classList.add(HIDDEN_ITEM_CLASS);
  }

  function markShortsTargets() {
    if (!hideShorts) return;

    if (site === "youtube") {
      for (const anchor of document.querySelectorAll(
        'a[href*="/shorts"], a[href*="/shorts/"]'
      )) {
        if (!isBlockedHref(anchor.getAttribute("href") || anchor.href)) continue;
        markClosest(
          anchor,
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
      }

      for (const shelf of document.querySelectorAll(
        "ytd-rich-shelf-renderer, ytd-reel-shelf-renderer, ytd-item-section-renderer"
      )) {
        const title = (
          shelf.querySelector("#title, #title-text, h2, .title")?.textContent ||
          ""
        ).trim();
        if (/^shorts$/i.test(title) || shelf.querySelector('a[href*="/shorts/"]')) {
          shelf.classList.add(HIDDEN_ITEM_CLASS);
        }
      }

      for (const chip of document.querySelectorAll("yt-chip-cloud-chip-renderer")) {
        if (/^shorts$/i.test((chip.textContent || "").trim())) {
          chip.classList.add(HIDDEN_ITEM_CLASS);
        }
      }
      return;
    }

    if (site === "facebook") {
      for (const anchor of document.querySelectorAll(
        'a[href*="/reel"], a[href*="/reels"]'
      )) {
        if (!isBlockedHref(anchor.getAttribute("href") || anchor.href)) continue;
        markClosest(
          anchor,
          'div[role="article"], div[data-pagelet], a, [role="listitem"], [role="row"]'
        );
        anchor.classList.add(HIDDEN_ITEM_CLASS);
      }
      for (const el of document.querySelectorAll(
        '[aria-label="Reels"], [aria-label*="Reel"]'
      )) {
        markClosest(el, 'a, div[role="listitem"], div[data-pagelet], div');
        el.classList.add(HIDDEN_ITEM_CLASS);
      }
      return;
    }

    if (site === "twitter") {
      for (const anchor of document.querySelectorAll(
        'a[href="/explore"], a[href*="/i/broadcasts"], a[aria-label="Explore"], a[aria-label="Video"]'
      )) {
        markClosest(anchor, 'a, nav[role="navigation"] a, [data-testid="DashboardProfileCard"]');
        anchor.classList.add(HIDDEN_ITEM_CLASS);
      }
      return;
    }

    if (site === "linkedin") {
      for (const anchor of document.querySelectorAll(
        'a[href*="/video"], a[href*="/games"], a[href*="linkedin.com/video"]'
      )) {
        if (!isBlockedHref(anchor.getAttribute("href") || anchor.href)) continue;
        markClosest(
          anchor,
          ".feed-shared-update-v2, .artdeco-card, li, .global-nav__primary-item, a"
        );
        anchor.classList.add(HIDDEN_ITEM_CLASS);
      }
      for (const el of document.querySelectorAll(
        ".feed-shared-linkedin-video, .update-components-linkedin-video"
      )) {
        markClosest(el, ".feed-shared-update-v2, .artdeco-card, div");
        el.classList.add(HIDDEN_ITEM_CLASS);
      }
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

  function onSpaNavigate() {
    if (!isSiteEnabled()) return;
    if (sessionTimerEnabled) {
      ensureSessionBar();
      renderSessionTime();
    }
    if (!hideShorts) return;
    leaveShortFormPages();
    scheduleHideShorts();
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
    if (message?.type !== "DOOM_YT_SETTINGS") return;
    if ("enabled" in message) themeWanted = Boolean(message.enabled);
    if ("hideShorts" in message) hideShortsWanted = Boolean(message.hideShorts);
    if ("sessionTimer" in message) {
      sessionTimerWanted = Boolean(message.sessionTimer);
    }
    if ("siteEnabled" in message && message.siteEnabled) {
      siteEnabledMap = { ...DEFAULT_SITES, ...message.siteEnabled };
    }
    syncFeatures();
  });

  chrome.storage.local.get(
    {
      enabled: true,
      hideShorts: false,
      sessionTimer: true,
      siteEnabled: DEFAULT_SITES,
    },
    (result) => {
      themeWanted = result.enabled !== false;
      hideShortsWanted = Boolean(result.hideShorts);
      sessionTimerWanted = result.sessionTimer !== false;
      siteEnabledMap = { ...DEFAULT_SITES, ...result.siteEnabled };
      syncFeatures();
    }
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.enabled) themeWanted = changes.enabled.newValue !== false;
    if (changes.hideShorts) {
      hideShortsWanted = Boolean(changes.hideShorts.newValue);
    }
    if (changes.sessionTimer) {
      sessionTimerWanted = changes.sessionTimer.newValue !== false;
    }
    if (changes.siteEnabled) {
      siteEnabledMap = {
        ...DEFAULT_SITES,
        ...changes.siteEnabled.newValue,
      };
    }
    if (
      changes.enabled ||
      changes.hideShorts ||
      changes.sessionTimer ||
      changes.siteEnabled
    ) {
      syncFeatures();
    }
  });

  // YouTube SPA
  window.addEventListener("yt-navigate-finish", onSpaNavigate);

  // Generic SPA / history navigations (Facebook, X)
  window.addEventListener("popstate", onSpaNavigate);
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    queueMicrotask(onSpaNavigate);
    return result;
  };
  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    queueMicrotask(onSpaNavigate);
    return result;
  };

  document.addEventListener(
    "click",
    (event) => {
      if (!hideShorts) return;
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      if (!isBlockedHref(anchor.getAttribute("href") || anchor.href)) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
})();
