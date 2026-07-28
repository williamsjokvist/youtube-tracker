const titleSpan = document.getElementById("title")
const authorSpan = document.getElementById("author")
const refreshBtn = document.getElementById("refresh-btn")
const clearBtn = document.getElementById("clear-btn")
const thumbnailLink = document.getElementById("thumbnail-link")
const resourceLink = document.getElementById("resource-link")
const image = document.getElementById("activity-img")

let token = ""
let baseUrl = ""
let privateMode = false

async function loadStorage() {
    const { devMode, privateMode: priv, prodBackend, prodToken, devBackend, devToken } =
        await chrome.storage.sync.get([
            "devMode",
            "privateMode",
            "prodBackend",
            "prodToken",
            "devBackend",
            "devToken",
        ])
    token = String(devMode ? devToken : prodToken)
    baseUrl = String(devMode ? devBackend : prodBackend)
    privateMode = Boolean(priv)
}

async function refreshActivityData() {
  try {
    const res = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const id = getVideoIdFromUrl(res[0].url)
    await setActivity(token, id)
  } catch (err) {
    console.error(err)
  }
  try {
      const res = await fetch(`${baseUrl}/watching`, {
          headers: {
              Authorization: `Bearer ${token}`,
          },
      })
      if (!res.ok) {
          console.error(await res.text())
          return
      }

      const activity = await res.json()
      titleSpan.textContent = activity.title
      authorSpan.textContent = activity.channel_title
      thumbnailLink.setAttribute('href', activity.thumbnail_small)
      resourceLink.setAttribute('href', activity.url)
      image.setAttribute('src', activity.thumbnail_small)
  } catch (err) {
      console.error(err)
  }
}

async function clearActivity() {
    if (privateMode) {
        console.debug("Private mode enabled, not clearing activity")
        return refreshActivityData()
    }
    await fetch(`${baseUrl}/activity/clear`, {
        method: "post",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return refreshActivityData()
}


// copied
function getVideoIdFromUrl(url) {
    const queryString = url.split("?")[1]
    const query = new URLSearchParams(queryString)
    const id = query.get("v")

    if (!id) {
        throw new Error(`Video id not found in url ${url}`)
    }

    return id
}

// copied
async function setActivity(token, videoId) {
    if (privateMode) {
        console.debug("Private mode enabled, not reporting activity: ", videoId)
        return
    }
    console.debug("Setting activity: ", videoId)
    const res = await fetch(`${baseUrl}/internal/youtube`, {
      method: "post",
      body: JSON.stringify({
        id: videoId
      }),
      headers: {
          Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
        throw new Error(await res.text())
    }
}


async function init() {
    clearBtn.onclick = () => {
        clearActivity()
    }
    refreshBtn.onclick = () => {
        refreshActivityData()
    }

    await loadStorage()
    await refreshActivityData()
}
init()
