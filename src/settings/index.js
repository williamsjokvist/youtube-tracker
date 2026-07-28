const devModeInput = document.getElementById("devMode")
const privateModeInput = document.getElementById("privateMode")
const prodBackendInput = document.getElementById("prodBackend")
const prodTokenInput = document.getElementById("prodToken")
const devBackendInput = document.getElementById("devBackend")
const devTokenInput = document.getElementById("devToken")

async function init() {
    const { devMode, privateMode, prodBackend, prodToken, devBackend, devToken } =
        await chrome.storage.sync.get([
            "devMode",
            "privateMode",
            "prodBackend",
            "prodToken",
            "devBackend",
            "devToken",
        ])
    devModeInput.setAttribute('checked', String(devMode))
    privateModeInput.setAttribute('checked', String(privateMode))
    prodBackendInput.setAttribute('value', String(prodBackend) ?? "")
    prodTokenInput.setAttribute('value', String(prodToken) ?? "")
    devBackendInput.setAttribute('value', String(devBackend ?? ""))
    devTokenInput.setAttribute('value', String(devToken) ?? "")
}
init()

const form = document.getElementsByTagName("form")[0]
form.onsubmit = function (e) {
    e.preventDefault()
    const data = new FormData(e.target)
    chrome.storage.sync.set({
        devMode: data.get("devMode") !== null,
        privateMode: data.get("privateMode") !== null,
        prodBackend: data.get("prodBackend"),
        prodToken: data.get("prodToken"),
        devBackend: data.get("devBackend"),
        devToken: data.get("devToken"),
    })
}
