// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     if (request.action === 'capture') {
//         captureScreenshot();
//     }
// });

// function captureScreenshot() {
//     chrome.runtime.sendMessage({ action: 'capture' });
// }

let isDrawing = false;
let startCoordinates = { x: 0, y: 0 };
let selectionBox = null;

document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);

function handleMouseDown(event) {
    isDrawing = true;
    startCoordinates = { x: event.clientX, y: event.clientY };

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

    const currentCoordinates = { x: event.clientX, y: event.clientY };

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

    // Capture the screenshot of the selected area
    chrome.runtime.sendMessage({ action: 'capture' });

    // Remove the selection box element
    if (selectionBox) {
        selectionBox.remove();
        selectionBox = null;
    }
}