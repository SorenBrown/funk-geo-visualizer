import { Point, Segment } from "../../default-objects.js";
import { hilbertDistance } from "../../default-functions.js";

export class BruteForceVoronoiManager {
    constructor(canvas, siteManager) {
        this.canvas = canvas;
        this.siteManager = siteManager;
        this.voronoiCells = [];
        this.name = 'BruteForceVoronoiManager';
    }

    // Main method to compute and display Voronoi diagram
    computeVoronoi(resolution = 1) {
        const ctx = this.canvas.ctx;
        const polygon = this.canvas.polygon;
        const sites = this.siteManager.sites;

        if (sites.length === 0) {
            alert("No sites selected. Please add sites first.");
            return;
        }

        // Clear previous Voronoi cells
        this.voronoiCells = [];
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Get polygon bounds
        const minX = Math.min(...polygon.vertices.map(v => v.x));
        const maxX = Math.max(...polygon.vertices.map(v => v.x));
        const minY = Math.min(...polygon.vertices.map(v => v.y));
        const maxY = Math.max(...polygon.vertices.map(v => v.y));

        // For each pixel in the polygon
        for (let x = minX; x <= maxX; x += resolution) {
            for (let y = minY; y <= maxY; y += resolution) {
                const point = new Point(x, y);

                if (polygon.contains(point)) {
                    // Find the closest site using Hilbert distance
                    let minDist = Infinity;
                    let closestSite = null;

                    for (const site of sites) {
                        const dist = hilbertDistance(site, point, polygon);
                        if (dist < minDist) {
                            minDist = dist;
                            closestSite = site;
                        }
                    }

                    // Store point with site's color
                    if (closestSite) {
                        point.setRadius(1);
                        point.setColor(closestSite.color);
                        this.canvas.drawPoint(point); // Or: point.draw(ctx);
                    }
                }
            }
        }
    }

    // (Optional) Activate/deactivate for UI integration
    activate() {
        this.active = true;
    }
    deactivate() {
        this.active = false;
    }
}
