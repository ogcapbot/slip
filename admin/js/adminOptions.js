import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const pickForm = document.getElementById('pickForm');

let adminOptionsContainer;

/**
 * Load the admin options screen with three buttons:
 * - Add New Pick
 * - Update Win/Loss (disabled)
 * - Stats
 *
 * This implementation toggles visibility instead of removing elements.
 */
export function loadAdminOptions() {
  if (!pickForm) {
    console.error('pickForm element not found!');
    return;
  }

  // Hide the sports selector UI (all existing content in pickForm assumed to be sports selector)
  pickForm.style.display = 'none';

  // If admin options container exists, just show it and return
  if (adminOptionsContainer) {
    adminOptionsContainer.style.display = 'grid';
    return;
  }

  // Create container for admin option buttons
  adminOptionsContainer = document.createElement('div');
  adminOptionsContainer.id = 'adminOptionsContainer';

  // Style container as 3 equal columns grid
  adminOptionsContainer.style.display = 'grid';
  adminOptionsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  adminOptionsContainer.style.gap = '6px';
  adminOptionsContainer.style.marginTop = '8px';

  // Create buttons
  const addNewPickBtn = createButton('Add New Pick');
  const updateWinLossBtn = createButton('Update Win/Loss', true);
  const statsBtn = createButton('Stats');

  // Add New Pick button click handler
  addNewPickBtn.addEventListener('click', async () => {
    // Hide admin options container
    adminOptionsContainer.style.display = 'none';

    // Show the sports selector UI container
    pickForm.style.display = 'block';

    // Load sports selector UI (should update content if needed)
    await loadSports();
  });

  // Stats button click handler
  statsBtn.addEventListener('click', async () => {
    // Hide admin options container while showing stats
    adminOptionsContainer.style.display = 'none';

    // Load stats screen (assumed to manage its own UI)
    await loadAdminStats();
  });

  // Append buttons to the container
  adminOptionsContainer.appendChild(addNewPickBtn);
  adminOptionsContainer.appendChild(updateWinLossBtn);
  adminOptionsContainer.appendChild(statsBtn);

  // Append container to the body or main container (not inside pickForm)
  // So admin options and pickForm are siblings and can be toggled independently
  document.body.appendChild(adminOptionsContainer);
}

/**
 * Utility function to create a styled button.
 * @param {string} text Button label
 * @param {boolean} disabled Whether button is disabled
 * @returns {HTMLButtonElement}
 */
function createButton(text, disabled = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  btn.className = 'pick-btn blue';

  btn.style.paddingTop = '6px';
  btn.style.paddingBottom = '6px';
  btn.style.marginTop = '2px';
  btn.style.marginBottom = '2px';

  btn.style.width = '100%';
  btn.style.minWidth = '0';
  btn.style.boxSizing = 'border-box';

  if (disabled) {
    btn.disabled = true;
  }

  return btn;
}
