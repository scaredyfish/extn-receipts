document.addEventListener('DOMContentLoaded', function () {
    var captureButton = document.getElementById('captureButton');
    if (captureButton) {
      captureButton.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'capture' });
        });
      });
    } else {
      console.error('Element with ID "captureButton" not found.');
    }
  });