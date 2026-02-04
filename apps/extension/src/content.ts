window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  const data = event.data as { source?: string; token?: string };
  if (data?.source === "aschedual-extension-connect" && data.token) {
    chrome.runtime.sendMessage({ type: "EXTENSION_TOKEN", token: data.token });
  }
});
