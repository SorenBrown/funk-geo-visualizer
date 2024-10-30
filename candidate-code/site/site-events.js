import { Bisector, HilbertBall, MiddleSector, Point, Site } from "../../default-objects.js";
import { createHilbertMinimumEnclosingRadiusBall, hilbertDistance, createScatterPlot, findHilbertCircumCenter, drawBisectorsOfHilbertCircumcenter } from "../../default-functions.js";
import { SiteManager } from "./site.js";
import { isAnyModalOpen } from "../scripts/scripts-json-events.js";
import { hilbertMidpoint } from "../../default-functions.js";
import { BisectorManager } from "../bisector/bisector.js";

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function initMouseActions(siteManager) {
    const events = ['mousedown', 'mousemove', 'mouseup', 'click'];
    const handlers = {
        mousedown: (event) => {
            if (event.shiftKey) {
                siteManager.startDragSelect(event);
            } else {
                siteManager.startDragging(event);
            }
        },
        mousemove: (event) => {
            if (siteManager.isDragSelecting) {
                siteManager.updateDragSelect(event);
            } else {
                siteManager.dragSite(event);
                if (siteManager.hilbertDistanceManager.active) {
                    siteManager.hilbertDistanceManager.updateSavedDistances();
                }
            }
        },
        mouseup: (event) => {
            if (siteManager.isDragSelecting) {
                siteManager.endDragSelect(event);
            } else {
                siteManager.stopDragging();
            }
        },
        click: (event) => {
            const { x, y } = siteManager.canvas.getMousePos(event);
            const point = new Point(x, y);
            if (siteManager.active) {
                if (event.shiftKey) {
                    siteManager.selectSite(event, true);
                } else {
                    siteManager.selectSite(event);
                    siteManager.selectSegment(point);
                }
            }
        },
    };

    events.forEach(eventType => {
        siteManager.canvas.canvas.addEventListener(eventType, (event) => {
            if (siteManager.active) {
                handlers[eventType](event);
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (!isAnyModalOpen()) {
            if (siteManager.active && (event.key === 'Delete' || event.key === 'Backspace')) {
                siteManager.removeSelectedSegment();
            }
        }
    });
}

function getChangedProperties() {
    const changedProperties = {};
    const siteColor = document.getElementById('siteColor');
    const siteShowInfo = document.getElementById('siteShowInfo');
    const siteDrawSpokes = document.getElementById('siteDrawSpokes');
    const labelInput = document.getElementById('labelInput');

    if (siteColor.value !== siteColor.defaultValue) {
        changedProperties.color = true;
    }
    if (siteShowInfo.checked !== siteShowInfo.defaultChecked) {
        changedProperties.showInfo = true;
    }
    if (siteDrawSpokes.checked !== siteDrawSpokes.defaultChecked) {
        changedProperties.drawSpokes = true;
    }
    if (labelInput.value !== labelInput.defaultValue) {
        changedProperties.label = true;
    }
    return changedProperties;
}

function updateSiteProperties(manager) {
    const changedProperties = getChangedProperties();
    const selectedSites = manager.canvas.sites.filter(site => site.selected);

    if (selectedSites.length === 1) {
        const site = selectedSites[0];
        site.color = document.getElementById('siteColor').value;
        site.showInfo = document.getElementById('siteShowInfo').checked;
        site.drawSpokes = document.getElementById('siteDrawSpokes').checked;
        site.label = document.getElementById('labelInput').value;
    } else if (selectedSites.length > 1) {

        manager.canvas.sites.forEach(site => {
            if (site.selected) {
                if (changedProperties.color && document.getElementById('siteColor').value !== '') {
                    site.color = document.getElementById('siteColor').value;
                    document.getElementById('siteColor').defaultValue = site.color; // Update default value
                }
                if (changedProperties.showInfo) {
                    site.showInfo = document.getElementById('siteShowInfo').checked;
                    document.getElementById('siteShowInfo').defaultChecked = site.showInfo; // Update default value
                }
                if (changedProperties.drawSpokes) {
                    site.drawSpokes = document.getElementById('siteDrawSpokes').checked;
                    document.getElementById('siteDrawSpokes').defaultChecked = site.drawSpokes; // Update default value
                }
                if (changedProperties.label) {
                    site.label = document.getElementById('labelInput').value;
                    document.getElementById('labelInput').defaultValue = site.label; // Update default value
                }
            }
        });
    }

    manager.canvas.drawAll();
}

export function initProperties(siteManager) {
    const debouncedUpdateSiteProperties = debounce(() => updateSiteProperties(siteManager), 0);
    document.getElementById('siteColor').addEventListener('input', debouncedUpdateSiteProperties);
    document.getElementById('siteShowInfo').addEventListener('change', debouncedUpdateSiteProperties);
    document.getElementById('siteDrawSpokes').addEventListener('change', debouncedUpdateSiteProperties);
    document.getElementById('labelInput').addEventListener('input', debouncedUpdateSiteProperties);
    document.getElementById('labelInput').addEventListener('blur', debouncedUpdateSiteProperties);
}

export function initShortcuts(siteManager) {
  document.addEventListener('keydown', (event) => {
    if (siteManager.active && (event.key === 'Delete' || event.key === 'Backspace')) {
      siteManager.removeSite();
    }
  });
}

export function initLabelInput() {
    const labelInput = document.getElementById('labelInput');
    labelInput.addEventListener('input', function() {
        this.style.width = (this.value.length + 1) + 'ch';
    });

    labelInput.style.width = (labelInput.placeholder.length + 1) + 'ch';

    labelInput.addEventListener('keydown', function(event) {
        if (event.key === 'Delete' || event.key === 'Backspace' || event.key === 't') {
            event.stopPropagation();
        }
    });
}

export function initContextMenu(siteManager) {

    const contextMenu = document.getElementById('contextMenu');
    const calculateHilbertDistanceItem = document.getElementById('calculateHilbertDistance');
    const saveHilbertDistanceItem = document.getElementById('saveHilbertDistance');
    const drawBisector = document.getElementById('drawBisector');

    // Hide context menu on any click
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    siteManager.canvas.canvas.addEventListener('contextmenu', (event) => {
        if (siteManager.checkTwoSitesSelected()) {

            event.preventDefault();
            const { clientX: mouseX, clientY: mouseY } = event;
            contextMenu.style.top = `${mouseY}px`;
            contextMenu.style.left = `${mouseX}px`;
            contextMenu.style.display = 'block';

            if (siteManager.canvas.activeManager === 'HilbertDistanceManager') {
                saveHilbertDistanceItem.style.display = 'block';
                calculateHilbertDistanceItem.style.display = 'block';
            } else {
                calculateHilbertDistanceItem.style.display = 'block';
                saveHilbertDistanceItem.style.display = 'none';
            }

            drawBisector.style.display = 'block';

        } else {
            contextMenu.style.display = 'none';
        }
    });

    if (!calculateHilbertDistanceItem.dataset.initialized) {

        calculateHilbertDistanceItem.addEventListener('click', () => {
            console.log('Calculate Hilbert Distance selected');
            console.log(siteManager.getSelectedSites());
            const selectedSites = siteManager.getSelectedSites();

            if (selectedSites.length === 2) {
                siteManager.hilbertDistanceManager.onTwoSitesSelected(selectedSites);
            }
            contextMenu.style.display = 'none';
        });

        saveHilbertDistanceItem.addEventListener('click', () => {
            console.log('Save Hilbert Distance selected');
            const selectedSites = siteManager.getSelectedSites();
            if (selectedSites.length === 2) {
                siteManager.hilbertDistanceManager.addSavedDistance(selectedSites);
            }
            contextMenu.style.display = 'none';
        });

        drawBisector.addEventListener('click', () => {
            console.log('Draw Bisector Selected');
            const selectedSites = siteManager.getSelectedSites();
            siteManager.hilbertDistanceManager.ensureLabels(selectedSites);
            if (selectedSites.length === 2) {
                siteManager.bisectorManager.createBisector(selectedSites[0], selectedSites[1]);
            }
            contextMenu.style.display = 'none';
        });

        calculateHilbertDistanceItem.dataset.initialized = true;
        saveHilbertDistanceItem.dataset.initialized = true;
        drawBisector.dataset.initialized = true;
    }
}