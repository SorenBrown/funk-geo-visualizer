// space.js

import { SiteManager } from "../site/site.js";
import { ConvexPolygon, Point } from "../../default-objects.js";
import { centroid, pointInPolygon } from "../../default-functions.js";
import { initMouseActions, destroyMouseActions } from "./space-events.js";

export class SpaceManager extends SiteManager {
    constructor(canvas) {
        super(canvas);
        this.name = "SpaceManager";
        this._listenersAttached = false;

        this._normOriginalPolygonVertices = [];
        this._normOriginalSites = [];

        this._normInfo = null;

    }

    storeOriginalGeometry() {
        const vertices = this.canvas.polygon.vertices;

        // 1) Find bounding box
        let xMin = Infinity, xMax = -Infinity;
        let yMin = Infinity, yMax = -Infinity;

        vertices.forEach(v => {
            if (v.x < xMin) xMin = v.x;
            if (v.x > xMax) xMax = v.x;
            if (v.y < yMin) yMin = v.y;
            if (v.y > yMax) yMax = v.y;
        });

        const width = xMax - xMin;
        const height = yMax - yMin;
        const scale = 2 / Math.max(width, height);

        const xMid = (xMax + xMin) / 2;
        const yMid = (yMax + yMin) / 2;

        this._normInfo = { xMin, xMax, yMin, yMax, xMid, yMid, scale };

        this._normOriginalPolygonVertices = vertices.map(v => {
            return {
                x: (v.x - xMid) * scale,
                y: (v.y - yMid) * scale
            };
        });

        // 3) Normalize the site positions
        this._normOriginalSites = this.canvas.sites.map(site => {
            return {
                x: (site.x - xMid) * scale,
                y: (site.y - yMid) * scale
            };
        });
    }

    movePointsAlongGeodesics(v) {
        const velocityFactor = 0.0006;
        const scaledV = {
            x: v.x * velocityFactor,
            y: v.y * velocityFactor
        };

        const center = centroid(this._normOriginalPolygonVertices);

        const projectedVertices = this._normOriginalPolygonVertices.map(vertex => {
            return projectPointWithCenter(vertex, scaledV, center);
        });

        const unNormalizedVertices = projectedVertices.map(vtx => {
            return unNormalizePoint(vtx, this._normInfo);
        });

        // new polygon with unnormalized projected vertices
        const currPolygon = this.canvas.polygon;
        this.canvas.polygon = new ConvexPolygon(
            unNormalizedVertices,
            currPolygon.color,
            currPolygon.penWidth,
            currPolygon.showInfo,
            currPolygon.showVertices,
            currPolygon.vertexRadius
        );

        // project the sites in the normalized space, then unnormalize
        this.canvas.sites.forEach((site, i) => {
            const oldP_norm = this._normOriginalSites[i];
            const newP_norm = projectPointWithCenter(oldP_norm, scaledV, center);

            const newP = unNormalizePoint(newP_norm, this._normInfo);

            if (pointInPolygon(newP.x, newP.y, this.canvas.polygon)) {
                site.x = newP.x;
                site.y = newP.y;

                site.convexPolygon = currPolygon;

                site.computeSpokes?.();
                site.computeHilbertBall?.();
                site.computeMultiBall?.();
            }
        });

        // 6) Redraw
        this.canvas.drawAll();
    }

    activate() {
        this.active = true;
        initMouseActions(this); // Attach space-specific listeners
    }
    
    deactivate() {
        this.active = false;
        destroyMouseActions(this); // Remove space-specific listeners
    }
}

// Project about the "center" in normalized coords
// function projectPointWithCenter(point, velocity, center) {
//     const px = point.x - center.x;
//     const py = point.y - center.y;

//     // Dot product
//     const dot = px * velocity.x + py * velocity.y;
//     let denom = 1 - dot;

//     // Optionally clamp to avoid infinite blow-up
//     if (Math.abs(denom) < 1e-5) {
//         denom = (denom < 0) ? -1e-5 : 1e-5;
//     }

//     const factor = 1 / denom;
//     const newX = px * factor;
//     const newY = py * factor;

//     return new Point(center.x + newX, center.y + newY);
// }

function projectPointWithCenter(point, velocity, center) {
    const px = point.x;
    const py = point.y;

    // Dot product
    const dot = px * velocity.x + py * velocity.y;
    let denom = 1 - dot;

    // Optionally clamp to avoid infinite blow-up
    if (Math.abs(denom) < 1e-5) {
        denom = (denom < 0) ? -1e-5 : 1e-5;
    }

    const factor = 1 / denom;
    const newX = px * factor;
    const newY = py * factor;

    return new Point(newX, newY);
}

/**
 * Un-normalize a point from our [-1,1]-ish coordinate system
 * back to the original canvas system using the saved bounding box info.
 */
function unNormalizePoint(pt, info) {
    // info contains: xMid, yMid, scale, ...
    const { xMid, yMid, scale } = info;
    return new Point((pt.x / scale) + xMid,  (pt.y / scale) + yMid);
}