// space-events.js

import { pointInPolygon } from "../../default-functions.js";
import { Point } from "../../default-objects.js";


export function initMouseActions(manager) {
    let isDragging = false;
    let mouseDownPos = null;

    let mouseDownFirst = true;

    const canvasElement = manager.canvas.canvas;
    const canvasObj = manager.canvas;

    manager._mouseDownHandler = (event) => {
        isDragging = true;

        if (mouseDownFirst) {
            mouseDownFirst = false;
            manager.storeOriginalOriginalGeometry();
        }
        
        const tempMouseDownPos = canvasObj.getMousePos(event);
        if (pointInPolygon(tempMouseDownPos.x, tempMouseDownPos.y, manager.canvas.polygon)) {
            mouseDownPos = tempMouseDownPos;
            manager.storeOriginalGeometry();
        } else {
            mouseDownPos = null;
        }

        event.preventDefault();
    };

    manager._mouseMoveHandler = (event) => {
        if (isDragging && mouseDownPos) {
            const currentMousePos = canvasObj.getMousePos(event);

            const velocityVector = {
                x: currentMousePos.x - mouseDownPos.x,
                y: currentMousePos.y - mouseDownPos.y,
            };

            manager.movePointsAlongGeodesics(velocityVector);
        }
    };

    manager._mouseUpHandler = () => {
        isDragging = false;
    };

    manager._mouseLeaveHandler = () => {
        isDragging = false;
    };

    // Attach event listeners
    canvasElement.addEventListener('mousedown', manager._mouseDownHandler);
    canvasElement.addEventListener('mousemove', manager._mouseMoveHandler);
    canvasElement.addEventListener('mouseup', manager._mouseUpHandler);
    canvasElement.addEventListener('mouseleave', manager._mouseLeaveHandler);

    manager._listenersAttached = true;
}

export function destroyMouseActions(manager) {
    const canvasElement = manager.canvas.canvas;
    
    if (manager._listenersAttached) {
        canvasElement.removeEventListener('mousedown', manager._mouseDownHandler);
        canvasElement.removeEventListener('mousemove', manager._mouseMoveHandler);
        canvasElement.removeEventListener('mouseup', manager._mouseUpHandler);
        canvasElement.removeEventListener('mouseleave', manager._mouseLeaveHandler);

        delete manager._mouseDownHandler;
        delete manager._mouseMoveHandler;
        delete manager._mouseUpHandler;
        delete manager._mouseLeaveHandler;

        manager._listenersAttached = false;
    }
}