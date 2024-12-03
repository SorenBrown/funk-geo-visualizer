// // space-events.js

// export function initMouseActions(manager) {
//     let isDragging = false;
//     let lastMousePos = null;

//     const canvasElement = manager.canvas.canvas;

//     canvasElement.addEventListener('mousedown', (event) => {
//         isDragging = true;
//         lastMousePos = getMousePos(event, canvasElement);
//         event.preventDefault(); // Prevent default behavior
//     });

//     canvasElement.addEventListener('mousemove', (event) => {
//         if (isDragging) {
//             const currentMousePos = getMousePos(event, canvasElement);
//             const deltaX = currentMousePos.x - lastMousePos.x;
//             const deltaY = currentMousePos.y - lastMousePos.y;

//             manager.movePointsAlongGeodesics(deltaX, deltaY);

//             lastMousePos = currentMousePos;
//         }
//     });

//     canvasElement.addEventListener('mouseup', () => {
//         isDragging = false;
//     });

//     canvasElement.addEventListener('mouseleave', () => {
//         isDragging = false;
//     });
// }

// function getMousePos(event, canvasElement) {
//     const rect = canvasElement.getBoundingClientRect();
//     return {
//         x: event.clientX - rect.left,
//         y: event.clientY - rect.top
//     };
// }
