import '/pngjs/browser.js';

chrome.runtime.onMessage.addListener(async (request, sender) => {
    if (request.action === 'capture') {
        try {
            cropImage(request.selectionBox);
        } catch (error) {
            console.error(error);
        }
    }
});

async function dataUriToPng(dataUri) {
    const response = await fetch(dataUri);

    let buf = await response.arrayBuffer();

    let p = new png.PNG({ filterType: 4 }).parse(buf,async (error, data) => {
        if (error) {
            console.error(error);
        } else {
            data.tEXt = { Description: "this is a test" };
            console.log(data);

            const pngBuffer = png.PNG.sync.write(data);

            // Create a Blob from the Buffer
            const blob = new Blob([new Uint8Array(pngBuffer)], { type: 'image/png' });

            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });

            await chrome.storage.local.set({ screenshotDataUrl: dataUrl });
        }
    });
}

async function dataUriToImageBitmap(dataUri) {
    const response = await fetch(dataUri);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    return imageBitmap;
}

async function offscreenCanvasToDataUri(canvas) {
    const blob = await canvas.convertToBlob();
    const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
    return dataUrl;
}

async function cropImage(selectionBox) {
    try {
        const result = await chrome.storage.local.get(['screenshotDataUrl']);
        const image = await dataUriToImageBitmap(result.screenshotDataUrl);

        const canvas = new OffscreenCanvas(selectionBox.width, selectionBox.height);
        const context = canvas.getContext('2d');
        context.drawImage(image, selectionBox.left, selectionBox.top, selectionBox.width, selectionBox.height, 0, 0, selectionBox.width, selectionBox.height);
        const uri = await offscreenCanvasToDataUri(canvas)

        await chrome.storage.local.set({ screenshotDataUrl: uri });

        chrome.downloads.download({url: uri, filename: 'test.png'});
      //  const newtab = await chrome.tabs.create({ url: chrome.runtime.getURL('screenshot.html') });


    } catch (error) {
        console.error(error);
    }
}

chrome.action.onClicked.addListener(async (tab) => {
    const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
    await chrome.storage.local.set({ screenshotDataUrl: dataUrl });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: startDrawing
    });
});

function startDrawing() {
    let isDrawing = false;
    let startCoordinates = { x: 0, y: 0 };
    let selectionBox = null;
    let savedUserSelect = document.body.style.userSelect;

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    function handleMouseDown(event) {
        isDrawing = true;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        startCoordinates = { x: event.clientX + scrollX, y: event.clientY + scrollY };

        document.body.style.userSelect = 'none';

        // Create a new selection box element
        selectionBox = document.createElement('div');
        selectionBox.style.position = 'absolute';
        selectionBox.style.border = '2px dashed #0078d4';
        selectionBox.style.background = 'rgba(0, 120, 212, 0.2)';
        selectionBox.style.pointerEvents = 'none';
        document.body.appendChild(selectionBox);
    }

    function handleMouseMove(event) {
        if (!isDrawing) return;

        // Adjust coordinates based on scroll position
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const currentCoordinates = { x: event.clientX + scrollX, y: event.clientY + scrollY };

        // Calculate width and height of the selection box
        const width = currentCoordinates.x - startCoordinates.x;
        const height = currentCoordinates.y - startCoordinates.y;

        // Set the dimensions and position of the selection box
        selectionBox.style.width = Math.abs(width) + 'px';
        selectionBox.style.height = Math.abs(height) + 'px';
        selectionBox.style.left = (width > 0 ? startCoordinates.x : currentCoordinates.x) + 'px';
        selectionBox.style.top = (height > 0 ? startCoordinates.y : currentCoordinates.y) + 'px';
    }

    function handleMouseUp() {
        isDrawing = false;

        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Find elements inside the selection box
        const elementsInBox = findElementsInsideSelectionBox(selectionBox);
        console.log(elementsInBox);
     //   document.getSelection().removeAllRanges()

        // Capture the screenshot of the selected area
        chrome.runtime.sendMessage({ action: 'capture', selectionBox: selectionBox.getBoundingClientRect() });

        // Remove the selection box element
        if (selectionBox) {
            selectionBox.remove();
            selectionBox = null;
        }

        document.body.style.userSelect = savedUserSelect
    }

    function isWhitespace(text) {
        return !/[^\t\n\r ]/.test(text);
    }

    function traverseNodes(node, range, elementsInBox, selectionBox) {
        if (node.nodeType == 3) { // If the node is a text node
            if (range.intersectsNode(node)) {
                if (isWhitespace(node.textContent)) {
                    console.log('ignoring whitespace');
                } else {
                    console.log('traversing:', node)
                    elementsInBox.push(node.parentNode);
                }
            }
        } else if (node.nodeType == 1) { // If the node is an element node
            selectionRect = selectionBox.getBoundingClientRect();

            nodeRect = node.getBoundingClientRect();

            // check if the element is inside the selection box
            if (nodeRect.top > selectionRect.top && nodeRect.bottom < selectionRect.bottom && nodeRect.left > selectionRect.left && nodeRect.right < selectionRect.right) {
                // node.style.background = 'green';
                elementsInBox.push(node);
                console.log('traversing:', node)
            } else if (nodeRect.top < selectionRect.bottom && nodeRect.bottom > selectionRect.top && nodeRect.left < selectionRect.right && nodeRect.right > selectionRect.left) {
                // node.style.background = 'red';
                for (const child of node.childNodes) {
                    traverseNodes(child, range, elementsInBox, selectionBox);
                }
            }
        } else {
            console.log(node.nodeType);
        }
    }

    function findElementsInsideSelectionBox(selectionBox) {
        const elementsInBox = [];
      
        // Get the coordinates and dimensions of the selection box
        const boxRect = selectionBox.getBoundingClientRect();
        const boxLeft = boxRect.left;
        const boxTop = boxRect.top;
        const boxRight = boxRect.right;
        const boxBottom = boxRect.bottom;
      
        // Create a range based on the selection box coordinates
        const range = document.caretRangeFromPoint(boxLeft, boxTop);
        range.setEnd(document.caretRangeFromPoint(boxRight, boxBottom).endContainer, document.caretRangeFromPoint(boxRight, boxBottom).endOffset);

        // traverse all child nodes
        traverseNodes(range.commonAncestorContainer, range, elementsInBox, selectionBox);
      
        let text = '';

        elementsInBox.forEach(node => {
          text += node.textContent + '\n';
        });

        chrome.storage.local.set({ 'textContent' : text });

        return elementsInBox;
      }
      
}

