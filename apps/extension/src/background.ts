chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "EXTENSION_TOKEN" && message.token) {
    chrome.storage.local.set({ authToken: message.token }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
  return false;
});
