chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'capture') {
      chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
        chrome.storage.local.set({ screenshotDataUrl: dataUrl }, () => {
          chrome.tabs.create({ url: chrome.runtime.getURL('screenshot.html') });
        });
      });
    }
  });