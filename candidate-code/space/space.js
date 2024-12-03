// // space.js

// import { initMouseActions } from "./space-events.js";
// import { SiteManager } from "../site/site.js";
// // import { ConvexPolygon } from "../../default-objects.js";
// import { pointInPolygon } from "../../default-functions.js";

// export class SpaceManager extends SiteManager {
//     constructor(canvas) {
//         super(canvas);
//         this.name = "SpaceManager";
//         initMouseActions(this);
//     }

//     movePointsAlongGeodesics(deltaX, deltaY) {
//         // Create a movement vector
//         const movementVector = { x: deltaX, y: deltaY };

//         // Optional: Adjust sensitivity
//         const sensitivity = 1.0; // Adjust this value as needed
//         movementVector.x *= sensitivity;
//         movementVector.y *= sensitivity;

//         // Move each point along the movement vector
//         this.canvas.sites.forEach(site => {
//             const newX = site.x - movementVector.x;
//             const newY = site.y - movementVector.y;

//             // Check if the new position is inside the polygon
//             if (pointInPolygon(newX, newY, this.canvas.polygon)) {
//                 site.x = newX;
//                 site.y = newY;

//                 // Update dependent properties
//                 site.computeSpokes();
//                 if (typeof site.computeHilbertBall === 'function') {
//                     site.computeHilbertBall();
//                 }
//                 if (typeof site.computeMultiBall === 'function') {
//                     site.computeMultiBall();
//                 }
//             }
//         });

//         // Redraw the canvas
//         this.canvas.drawAll();
//     }
// }
