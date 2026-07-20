const themeCheckbox = document.getElementById("enabled");
const shortsCheckbox = document.getElementById("hide-shorts");
const statusText = document.getElementById("status-text");
const shortsStatus = document.getElementById("shorts-status");

function setThemeStatus(enabled) {
  statusText.textContent = enabled ? "ONLINE" : "OFFLINE";
  statusText.style.color = enabled ? "#39ff14" : "#6f9f84";
}

function setShortsStatus(enabled) {
  shortsStatus.textContent = enabled ? "ON" : "OFF";
  shortsStatus.style.color = enabled ? "#39ff14" : "#6f9f84";
}

async function broadcast(settings) {
  const tabs = await chrome.tabs.query({
    url: ["*://www.youtube.com/*", "*://youtube.com/*"],
  });

  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "DOOM_YT_SETTINGS",
        ...settings,
      });
    } catch {
      // Tab may not have the content script yet.
    }
  }
}

async function init() {
  const { enabled = true, hideShorts = false } = await chrome.storage.local.get([
    "enabled",
    "hideShorts",
  ]);
  themeCheckbox.checked = enabled;
  shortsCheckbox.checked = hideShorts;
  setThemeStatus(enabled);
  setShortsStatus(hideShorts);
}

themeCheckbox.addEventListener("change", async () => {
  const enabled = themeCheckbox.checked;
  await chrome.storage.local.set({ enabled });
  setThemeStatus(enabled);
  await broadcast({ enabled });
});

shortsCheckbox.addEventListener("change", async () => {
  const hideShorts = shortsCheckbox.checked;
  await chrome.storage.local.set({ hideShorts });
  setShortsStatus(hideShorts);
  await broadcast({ hideShorts });
});

init();
