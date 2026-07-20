const themeCheckbox = document.getElementById("enabled");
const sessionCheckbox = document.getElementById("session-timer");
const shortsCheckbox = document.getElementById("hide-shorts");
const statusText = document.getElementById("status-text");
const sessionStatus = document.getElementById("session-status");
const shortsStatus = document.getElementById("shorts-status");

function setOnOff(el, enabled) {
  el.textContent = enabled ? "ON" : "OFF";
  el.style.color = enabled ? "#3dff2e" : "#5f8672";
}

function setThemeStatus(enabled) {
  statusText.textContent = enabled ? "ONLINE" : "OFFLINE";
  statusText.style.color = enabled ? "#3dff2e" : "#5f8672";
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
  const {
    enabled = true,
    hideShorts = false,
    sessionTimer = true,
  } = await chrome.storage.local.get(["enabled", "hideShorts", "sessionTimer"]);

  themeCheckbox.checked = enabled;
  sessionCheckbox.checked = sessionTimer;
  shortsCheckbox.checked = hideShorts;
  setThemeStatus(enabled);
  setOnOff(sessionStatus, sessionTimer);
  setOnOff(shortsStatus, hideShorts);
}

themeCheckbox.addEventListener("change", async () => {
  const enabled = themeCheckbox.checked;
  await chrome.storage.local.set({ enabled });
  setThemeStatus(enabled);
  await broadcast({ enabled });
});

sessionCheckbox.addEventListener("change", async () => {
  const sessionTimer = sessionCheckbox.checked;
  await chrome.storage.local.set({ sessionTimer });
  setOnOff(sessionStatus, sessionTimer);
  await broadcast({ sessionTimer });
});

shortsCheckbox.addEventListener("change", async () => {
  const hideShorts = shortsCheckbox.checked;
  await chrome.storage.local.set({ hideShorts });
  setOnOff(shortsStatus, hideShorts);
  await broadcast({ hideShorts });
});

init();
