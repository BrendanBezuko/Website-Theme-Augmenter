(() => {
  const ROOT_CLASS = "doom-yt";
  const HIDE_SHORTS_CLASS = "doom-yt-hide-shorts";
  const HIDDEN_ITEM_CLASS = "doom-yt-shorts-item";

  let hideShorts = false;
  let observer = null;
  let hideTimer = null;

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

    // Shelves titled Shorts even if structure differs
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

    // Filter chips labeled Shorts
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

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "DOOM_YT_SETTINGS") {
      if ("enabled" in message) applyTheme(Boolean(message.enabled));
      if ("hideShorts" in message) applyHideShorts(Boolean(message.hideShorts));
      return;
    }
    if (message?.type === "DOOM_YT_TOGGLE") {
      applyTheme(Boolean(message.enabled));
    }
  });

  // Optimistic theme enable to avoid unstyled flash
  document.documentElement.classList.add(ROOT_CLASS);

  chrome.storage.local.get({ enabled: true, hideShorts: false }, (result) => {
    applyTheme(result.enabled !== false);
    applyHideShorts(Boolean(result.hideShorts));
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.enabled) applyTheme(changes.enabled.newValue !== false);
    if (changes.hideShorts) applyHideShorts(Boolean(changes.hideShorts.newValue));
  });

  // YouTube SPA navigations
  window.addEventListener("yt-navigate-finish", () => {
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
