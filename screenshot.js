chrome.storage.local.get(['screenshotDataUrl', 'textContent'], function (result) {
  document.getElementById('screenshot').src = result.screenshotDataUrl;
});
  
chrome.storage.local.get(['textContent'], function (result) {
  document.getElementById('content').value = result.textContent;
});
