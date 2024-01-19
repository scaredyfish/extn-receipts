chrome.storage.local.get(['screenshotDataUrl', 'textContent'], function (result) {
  document.getElementById('screenshot').src = result.screenshotDataUrl;
  document.getElementById('screenshot').alt = result.textContent;
  document.getElementById('content').value = result.textContent;
});

document.getElementById('copyTextToClipboard').addEventListener('click', function () {
  const content = document.getElementById('content').value;
  navigator.clipboard.writeText(content);
});

document.getElementById('copyImageToClipboard').addEventListener('click', async function () {
  const screenshot = document.getElementById('screenshot');
  // convert screenshot to blob
  fetch(screenshot.src)
    .then(res => res.blob())
    .then(blob => {
      // create clipboard item
      const item = new ClipboardItem({
        [blob.type]: blob
      });
      // write to clipboard
      navigator.clipboard.write([item]);
    });

});

document.getElementById('download').addEventListener('click', async function () {
  //download text content as text file
  const content = document.getElementById('content').value;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'image.png.metadata.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  //download image
  const screenshot = document.getElementById('screenshot');
  const blob2 = await fetch(screenshot.src).then(res => res.blob());
  const url2 = URL.createObjectURL(blob2);
  a.href = url2;
  a.download = 'image.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url2);
});
