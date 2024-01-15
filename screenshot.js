chrome.storage.local.get(['screenshotDataUrl'], function (result) {
    document.getElementById('screenshot').src = result.screenshotDataUrl;
  });
  