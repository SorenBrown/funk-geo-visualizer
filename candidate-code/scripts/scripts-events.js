// scripts-events.js
import { HilbertDistanceManager } from "../hilbert-distance/hilbert-distance.js";
import { SiteManager } from "../site/site.js";

function setDisplay(element, display) {
    element.style.display = display;
}

function updateCollapsibleVisibility(selectedProgram, managers, canvas) {
    const siteCollapsible = document.getElementById('siteCollapsible');
    const hilbertCollapsible = document.getElementById('hilbertBallCollapsible');
    const ffunkCollapsible = document.getElementById('ffunkBallCollapsible');
    const rfunkCollapsible = document.getElementById('rfunkBallCollapsible');
    const thompsonCollapsible = document.getElementById('thompsonBallCollapsible');
    const customInsertCollapsible = document.querySelectorAll('#siteCollapsible')[1];
    const savedDistancesContainer = document.getElementById('savedDistancesContainer');
    const savedBisectorsContainer = document.getElementById('savedBisectorsContainer');
    const metricBallSelectionCard = document.getElementById('metricBallSelectionCard'); // New card
    const settingsLabel = document.getElementById('general-settings');
    const siteColorInput = document.getElementById('colorContainer');

    const setDisplay = (element, display) => {
        if (element) element.style.display = display;
    };

    const displayMap = {
        'Metric Balls': () => {
            setDisplay(siteCollapsible, 'block');
            setDisplay(hilbertCollapsible, 'block');
            setDisplay(ffunkCollapsible, 'block');
            setDisplay(rfunkCollapsible, 'block');
            setDisplay(thompsonCollapsible, 'block');
            setDisplay(customInsertCollapsible, 'block');
            setDisplay(savedDistancesContainer, 'none');
            setDisplay(savedBisectorsContainer, 'none');
            setDisplay(metricBallSelectionCard, 'block'); // Show the card
            setDisplay(settingsLabel, 'block'); 
            setDisplay(siteColorInput, 'none'); 

            insertSiteButton.textContent = 'Insert Metric Ball(s)';

            managers.forEach(manager => {
                if (manager.name === 'HilbertBallManager') manager.activate();
                else manager.deactivate();
            });

            canvas.activeManager = 'HilbertBallManager';
        },
        'Site': () => {
            setDisplay(siteCollapsible, 'block');
            setDisplay(hilbertCollapsible, 'none');
            setDisplay(ffunkCollapsible, 'none');
            setDisplay(rfunkCollapsible, 'none');
            setDisplay(thompsonCollapsible, 'none');
            setDisplay(customInsertCollapsible, 'block');
            setDisplay(savedDistancesContainer, 'none');
            setDisplay(savedBisectorsContainer, 'none');
            setDisplay(metricBallSelectionCard, 'none'); // Hide the card
            setDisplay(settingsLabel, 'block'); 
            setDisplay(siteColorInput, 'block');
            insertSiteButton.textContent = 'Insert Site';

            managers.forEach(manager => {
                if (manager.name === 'SiteManager') manager.activate();
                else manager.deactivate();
            });

            canvas.activeManager = 'SiteManager';
        },
        'Hilbert Distance': () => {
            setDisplay(siteCollapsible, 'block');
            setDisplay(savedDistancesContainer, 'block');
            setDisplay(customInsertCollapsible, 'none');
            setDisplay(hilbertCollapsible, 'none');
            setDisplay(ffunkCollapsible, 'none');
            setDisplay(rfunkCollapsible, 'none');
            setDisplay(thompsonCollapsible, 'none');
            setDisplay(savedBisectorsContainer, 'none');
            setDisplay(metricBallSelectionCard, 'none'); // Hide the card
            setDisplay(settingsLabel, 'none'); 
            setDisplay(siteColorInput, 'none'); 

            managers.forEach(manager => {
                if (manager.name === 'SiteManager' || manager.name === 'HilbertDistanceManager') {
                    manager.activate();
                } else {
                    manager.deactivate();
                }
            });

            canvas.activeManager = 'HilbertDistanceManager';
        },
        'Bisector': () => {
            setDisplay(siteCollapsible, 'none');
            setDisplay(customInsertCollapsible, 'none');
            setDisplay(hilbertCollapsible, 'none');
            setDisplay(ffunkCollapsible, 'none');
            setDisplay(rfunkCollapsible, 'none');
            setDisplay(thompsonCollapsible, 'none');
            setDisplay(savedDistancesContainer, 'none');
            setDisplay(savedBisectorsContainer, 'block');
            setDisplay(metricBallSelectionCard, 'none');
            setDisplay(siteColorInput, 'none'); 

            setDisplay(settingsLabel, 'none'); 

            managers.forEach(manager => {
                if (manager.name === 'SiteManager' || manager.name === 'BisectorManager') {
                    manager.activate();
                } else {
                    manager.deactivate();
                }
            });

            canvas.activeManager = 'BisectorManager';
        },
        'default': () => {
            setDisplay(siteCollapsible, 'none');
            setDisplay(customInsertCollapsible, 'none');
            setDisplay(hilbertCollapsible, 'none');
            setDisplay(ffunkCollapsible, 'none');
            setDisplay(rfunkCollapsible, 'none');
            setDisplay(thompsonCollapsible, 'none');
            setDisplay(savedDistancesContainer, 'none');
            setDisplay(savedBisectorsContainer, 'none');
            setDisplay(metricBallSelectionCard, 'none'); // Hide the card
            setDisplay(siteColorInput, 'none'); 
        }
    };

    (displayMap[selectedProgram] || displayMap['default'])();
}

function initializeDefaultVisibility(mode) {
    const hilbertContainer = document.getElementById('hilbertContainer');
    if (mode === 'Convex') {
        hilbertContainer.style.display = 'none';
    } else {
        hilbertContainer.style.display = 'block';
    }
}

export function initializeDropdowns(managers, mode, canvas) {
    initializeDefaultVisibility(mode);
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const select = dropdown.querySelector('.select');
        const menu = dropdown.querySelector('.menu');
        const options = dropdown.querySelectorAll('.menu li');
        const selected = dropdown.querySelector('.selected');

        select.addEventListener('click', () => {
            menu.classList.toggle('menu-open');
            select.classList.toggle('select-clicked');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                selected.innerText = option.innerText;
                menu.classList.remove('menu-open');
                select.classList.remove('select-clicked');

                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                updateCollapsibleVisibility(option.innerText, managers, canvas);
            });
        });

        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target)) {
                menu.classList.remove('menu-open');
                select.classList.remove('select-clicked');
            }
        });

        updateCollapsibleVisibility(selected.innerText, managers, canvas); // Initial visibility update
    });
}

export function initializeAddSiteListener(canvasElement, managers, canvas) {
    canvasElement.addEventListener('dblclick', (event) => {
        if (canvas.mode === 'Hilbert') {
            managers.find(manager => {
                if (manager.active && (manager.name === 'SiteManager' || manager.name === 'HilbertBallManager')) {
                    manager.addSite(event);
                    return true;
                }
                return false;
            });
        }
    });
}
function clearInput(inputElement) {
    inputElement.value = '';
}

function handleInsertClick(managers) {
    const insertSiteXInput = document.getElementById('insertSiteX');
    const insertSiteYInput = document.getElementById('insertSiteY');
    const x = parseFloat(insertSiteXInput.value);
    const y = parseFloat(insertSiteYInput.value);

    if (isNaN(x) || isNaN(y)) {
        alert('Please enter valid X and Y coordinates');
        return;
    }

    const selectedProgram = document.querySelector('.dropdown .selected').innerText;
    const selectedManager = selectedProgram.replace(/\s/g, '') + 'Manager';

    managers.find(manager => {
        if (manager.active && manager.name === selectedManager) {
            manager.addSite(null,x,y);
            return true;
        }
        return false;
    });

    clearInput(insertSiteXInput);
    clearInput(insertSiteYInput);
}

export function initializeInsertSiteListeners(managers) {
    const insertSiteXInput = document.getElementById('insertSiteX');
    const insertSiteYInput = document.getElementById('insertSiteY');
    const insertSiteButton = document.getElementById('insertSiteButton');
    const clearInsertSiteXButton = document.getElementById('clearInsertSiteX');
    const clearInsertSiteYButton = document.getElementById('clearInsertSiteY');

    insertSiteXInput.addEventListener('focus', () => managers.forEach(manager => {
        if (manager instanceof HilbertBallManager || manager instanceof SiteManager) {
            manager.deselectAllSites();
        }
    }));
    insertSiteYInput.addEventListener('focus', () => managers.forEach(manager => {
        if (manager instanceof HilbertBallManager || manager instanceof SiteManager) {
            manager.deselectAllSites();
        }
    }));
    insertSiteButton.addEventListener('click', () => handleInsertClick(managers));
    clearInsertSiteXButton.addEventListener('click', () => clearInput(insertSiteXInput));
    clearInsertSiteYButton.addEventListener('click', () => clearInput(insertSiteYInput));
}

export function initCollapsibleAnimation() {
    const collapsibles = document.querySelectorAll('.collapsible-header');
    collapsibles.forEach(header => {
        header.addEventListener('click', function () {
            const collapsible = this.parentElement;
            collapsible.classList.toggle('active');
            const content = collapsible.querySelector('.content');
            content.style.display = content.style.display === "block" ? "none" : "block";
        });
    });
}

// document.addEventListener('DOMContentLoaded', () => {
//     const hilbertCheckbox = document.getElementById('hilbertBallCheckbox');
//     const ffunkCheckbox = document.getElementById('ffunkBallCheckbox');
//     const rfunkCheckbox = document.getElementById('rfunkBallCheckbox');
//     const thompsonCheckbox = document.getElementById('thompsonBallCheckbox');

//     function getSelectedBalls() {
//         const selected = [];
//         if (hilbertCheckbox.checked) selected.push('Hilbert Ball');
//         if (ffunkCheckbox.checked) selected.push('Forward Funk Ball');
//         if (rfunkCheckbox.checked) selected.push('Reverse Funk Ball');
//         if (thompsonCheckbox.checked) selected.push('Thompson Ball');
//         return selected;
//     }

//     // Example: Handling double-click inside the polygon to add selected balls
//     document.getElementById('canvas').addEventListener('dblclick', (event) => {
//         const selectedBalls = getSelectedBalls();
//         console.log('Creating balls:', selectedBalls);
//         // Logic to create the selected balls goes here
//     });
// });

