// space.js

import { SiteManager } from "../site/site.js";
import { ConvexPolygon, Point } from "../../default-objects.js";
import { centroid, pointInPolygon } from "../../default-functions.js";
import { initMouseActions, destroyMouseActions } from "./space-events.js";


function minimumEnclosingCircle(points) {

    const shuffled = [...points];
    shuffled.sort(() => Math.random() - 0.5);

    let c = { center: new Point(0, 0), radius: 0 };

    for (let i = 0; i < shuffled.length; i++) {
        if (!isInCircle(c, shuffled[i])) {
            c = { center: shuffled[i], radius: 0 };
            for (let j = 0; j < i; j++) {
                if (!isInCircle(c, shuffled[j])) {
                    c = circleWithTwoPoints(shuffled[i], shuffled[j]);
                    for (let k = 0; k < j; k++) {
                        if (!isInCircle(c, shuffled[k])) {
                            c = circleWithThreePoints(shuffled[i], shuffled[j], shuffled[k]);
                        }
                    }
                }
            }
        }
    }
    return c;
}

function isInCircle(circle, p) {
    const dx = circle.center.x - p.x;
    const dy = circle.center.y - p.y;
    return dx * dx + dy * dy <= circle.radius * circle.radius + 1e-12;
}

function circleWithTwoPoints(a, b) {
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const r = distance(a, b) / 2;
    return { center: new Point(cx, cy), radius: r };
}

function circleWithThreePoints(a, b, c) {

    const A = b.x - a.x;
    const B = b.y - a.y;
    const C = c.x - a.x;
    const D = c.y - a.y;
    const E = A * (a.x + b.x) + B * (a.y + b.y);
    const F = C * (a.x + c.x) + D * (a.y + c.y);
    const G = 2 * (A * (c.y - b.y) - B * (c.x - b.x));

    if (Math.abs(G) < 1e-12) {
        const cAB = circleWithTwoPoints(a, b);
        const cAC = circleWithTwoPoints(a, c);
        const cBC = circleWithTwoPoints(b, c);
        let candidates = [cAB, cAC, cBC];
        candidates = candidates.filter((circ) =>
            isInCircle(circ, a) && isInCircle(circ, b) && isInCircle(circ, c)
        );
        candidates.sort((c1, c2) => c1.radius - c2.radius);
        return candidates[0] || cAB;
    } else {
        const cx = (D * E - B * F) / G;
        const cy = (A * F - C * E) / G;
        const center = new Point(cx, cy);
        const r = distance(center, a);
        return { center, radius: r };
    }
}

function distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export class SpaceManager extends SiteManager {
    constructor(canvas) {
        super(canvas);
        this.name = "SpaceManager";
        this._listenersAttached = false;

        this._normOriginalPolygonVertices = [];
        this._normOriginalSites = [];
        this._normInfo = null;

        this._origCircle = null;
    }

    storeOriginalGeometry() {
        const vertices = this.canvas.polygon.vertices;

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

        this._normOriginalSites = this.canvas.sites.map(site => {
            return {
                x: (site.x - xMid) * scale,
                y: (site.y - yMid) * scale
            };
        });

        this._normOriginalAsteroids = this.canvas.asteroids.map(site => {
            return {
                x: (site.x - xMid) * scale,
                y: (site.y - yMid) * scale
            };
        });
    }

    storeOriginalOriginalGeometry() {
        const vertices = this.canvas.polygon.vertices;
        this._origCircle = minimumEnclosingCircle(vertices);
    }

    
    projectPoints(v) {
        if (!this._normInfo || !this._origCircle) return;

        const velocityFactor = 0.0005;
        const scaledV = {
            x: v.x * velocityFactor,
            y: v.y * velocityFactor
        };

        const centerNorm = centroid(this._normOriginalPolygonVertices);

        const projectedVertices = this._normOriginalPolygonVertices.map(vertex => {
            return projectPointWithCenter(vertex, scaledV, centerNorm);
        });

        const unNormalizedVertices = projectedVertices.map(vtx => {
            return unNormalizePoint(vtx, this._normInfo);
        });

        const newSitePositions = this._normOriginalSites.map(siteNorm => {
            return projectPointWithCenter(siteNorm, scaledV, centerNorm);
        }).map(pt => unNormalizePoint(pt, this._normInfo));

        const newAsteroidPositions = this._normOriginalAsteroids.map(siteNorm => {
            return projectPointWithCenter(siteNorm, scaledV, centerNorm);
        }).map(pt => unNormalizePoint(pt, this._normInfo));

        const newCircle = minimumEnclosingCircle(unNormalizedVertices);

        if (newCircle.radius > 1e-10 && this._origCircle.radius > 1e-10) {
            const finalVertices = [];
            for (const vtx of unNormalizedVertices) {
                finalVertices.push(
                    mapCircleToCircle(
                        vtx,
                        newCircle.center, newCircle.radius,
                        this._origCircle.center, this._origCircle.radius
                    )
                );
            }

            for (let i = 0; i < this.canvas.sites.length; i++) {
                const oldPt = newSitePositions[i];
                const mappedPt = mapCircleToCircle(
                    oldPt,
                    newCircle.center, newCircle.radius,
                    this._origCircle.center, this._origCircle.radius
                );

                this.canvas.sites[i].x = mappedPt.x;
                this.canvas.sites[i].y = mappedPt.y;
            }
            
            for (let i = 0; i < this.canvas.asteroids.length; i++) {
                const oldPt = newAsteroidPositions[i];
                const mappedPt = mapCircleToCircle(
                    oldPt,
                    newCircle.center, newCircle.radius,
                    this._origCircle.center, this._origCircle.radius
                );

                this.canvas.asteroids[i].x = mappedPt.x;
                this.canvas.asteroids[i].y = mappedPt.y;
            }

            const currPolygon = this.canvas.polygon;
            const newPolygon = new ConvexPolygon(
                finalVertices,
                currPolygon.color,
                currPolygon.penWidth,
                currPolygon.showInfo,
                currPolygon.showVertices,
                currPolygon.vertexRadius
            );

            this.canvas.polygon = newPolygon;

            for (let i = 0; i < this.canvas.sites.length; i++) {
                const s = this.canvas.sites[i];
                if (pointInPolygon(s.x, s.y, newPolygon)) {
                    s.convexPolygon = newPolygon;
                    s.computeSpokes?.();
                    s.computeHilbertBall?.();
                    s.computeMultiBall?.();
                }
            }


            if (this.canvas.showAsteroids) {
                for (let i = 0; i < this.canvas.asteroids.length; i++) {
                    const s = this.canvas.asteroids[i];
                    if (pointInPolygon(s.x, s.y, newPolygon)) {
                        s.convexPolygon = newPolygon;
                        s.computeSpokes?.();
                        s.computeHilbertBall?.();
                    }
                }
            }
        }

        this.canvas.drawAll();
    }

    activate() {
        this.active = true;
        initMouseActions(this);
    }

    deactivate() {
        this.active = false;
        destroyMouseActions(this); 
    }
}

function projectPointWithCenter(point, velocity, center) {
    const px = point.x;
    const py = point.y;

    const dot = px * velocity.x + py * velocity.y;
    let denom = 1 + dot;

    if (Math.abs(denom) < 1e-5) {
        denom = (denom < 0) ? -1e-3 : 1e-3;
    }

    const factor = 1 / denom;
    const newX = px * factor;
    const newY = py * factor;

    return new Point(newX, newY);
}

function unNormalizePoint(pt, info) {
    const { xMid, yMid, scale } = info;
    return new Point(
        (pt.x / scale) + xMid,
        (pt.y / scale) + yMid
    );
}

function mapCircleToCircle(p, center1, r1, center2, r2) {
    const dx = p.x - center1.x;
    const dy = p.y - center1.y;
    const scale = r2 / r1; 
    return new Point(
        center2.x + dx * scale,
        center2.y + dy * scale
    );
}