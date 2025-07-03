// adminOptions.js
// Handles admin UI rendering and listens for sport selection events

import { renderSportSelector } from './sportSelector.js';

const mainContent = document.getElementById('mainContent');

/**
 * Initializes the admin options UI and event listeners
 */
export function initAdminOptions() {
  console.log("[adminOptions] Initializing admin options UI...");

  // Render initial admin buttons here (existing code)...

  // Render sport selector on "Add New" click or on init as needed
  // For demo, call once at init:
  renderSportSelector();

  // Listen for sportSelected events dispatched from sportSelector.js
  document.addEventListener('sportSelected', async (event) => {
    const selectedSport = event.detail;
    console.log(`[adminOptions] Sport selected: ${selectedSport}`);

    if (!mainContent) {
      console.error("[adminOptions] No #mainContent element found.");
      return;
    }

    // Clear main content to prepare for league selector or next steps
    mainContent.innerHTML = '';

    // Dynamically import leagueSelector.js and render leagues for selected sport
    try {
      const leagueModule = await import('./leagueSelector.js');
      await leagueModule.renderLeagueSelector(selectedSport);
      console.log("[adminOptions] League selector rendered successfully.");
    } catch (error) {
      console.error("[adminOptions] Failed to load leagueSelector.js:", error);
      mainContent.textContent = "Error loading leagues. Please try again.";
    }
  });
}

// Optionally, call initAdminOptions here if you want to auto-init on script load:
// initAdminOptions();
