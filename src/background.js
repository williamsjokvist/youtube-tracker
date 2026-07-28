let baseUrl = ""
let token = ""
let privateMode = false

async function init() {
    const { devMode, privateMode: priv, prodBackend, prodToken, devBackend, devToken } =
        await chrome.storage.sync.get([
            "devMode",
            "privateMode",
            "prodBackend",
            "prodToken",
            "devBackend",
            "devToken",
        ])
    baseUrl = devMode ? devBackend : prodBackend
    token = devMode ? devToken : prodToken
    privateMode = Boolean(priv)
}
init()

async function setActivity(token, videoId) {
    if (privateMode) {
        console.debug("Private mode enabled, not reporting activity: ", videoId)
        return
    }
    console.debug("Setting activity: ", videoId)
    const res = await fetch(`${baseUrl}/internal/youtube`, {
      method: "post",
      body: {
        id: videoId
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
        throw new Error(await res.text())
    }
}

function getVideoIdFromUrl(url) {
    const queryString = url.split("?")[1]
    const query = new URLSearchParams(queryString)
    const id = query.get("v")

    if (!id) {
        throw new Error(`Video id not found in url ${url}`)
    }

    return id
}

// ---
const trackingTabs = new Set()

function isYoutubeUrl(url) {
    if (!url) {
        return false
    }
    try {
        const { hostname } = new URL(url)
        return hostname === "youtube.com" || hostname.endsWith(".youtube.com")
    } catch {
        return false
    }
}

chrome.tabs.onActivated.addListener(onTabActivated)
chrome.tabs.onRemoved.addListener(onTabRemoved)
chrome.tabs.onUpdated.addListener(onTabUrlUpdated)
chrome.tabs.onUpdated.addListener(onTabTitleUpdated)

function onTabRemoved(tabId, removeInfo) {
    console.debug("On tab removed", tabId)
    if (!trackingTabs.has(tabId)) {
        return
    }
    trackingTabs.delete(tabId)
}

async function onTabActivated(activeInfo) {
    console.debug("On tab activated", activeInfo.tabId)
    if (!trackingTabs.has(activeInfo.tabId)) {
        return
    }

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    if (!isYoutubeUrl(tab.url)) {
        return
    }
    const videoId = getVideoIdFromUrl(tab.url)
    await setActivity(token, videoId)
  } catch (err) {
    console.error('onTabActivated', err)
  }
}

async function onTabUrlUpdated(tabId, changeInfo, tabInfo) {
    console.debug("On tab url updated", tabId)
    const { url } = changeInfo
    if (url === undefined || trackingTabs.has(tabId) || !isYoutubeUrl(url)) {
        return
    }

  try {
    const videoId = getVideoIdFromUrl(tabInfo.url)

    trackingTabs.add(tabId)

    if (tabInfo.active) {
        await setActivity(token, videoId)
    }
  } catch (err) {
    console.error('onTabUrlUpdated', err)
  }
}

async function onTabTitleUpdated(tabId, changeInfo, tabInfo) {
    if (!isYoutubeUrl(tabInfo.url)) {
        return
    }
    console.debug("On tab title updated", tabId)
    const { title } = changeInfo
    if (title === undefined || !trackingTabs.has(tabId)) {
        console.warn(
            "Title not found or tab not being tracked",
            title,
            trackingTabs.has(tabId),
        )
        return
    }

  try {
    const videoId = getVideoIdFromUrl(tabInfo.url)
    await setActivity(token, videoId)
  } catch (err) {
    console.error("onTabTitleUpdated", err)
  }
}
