import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const pickForm = document.getElementById('pickForm');

let adminOptionsContainer;

/**
 * Load the admin options screen with three buttons:
 * - Add New Pick
 * - Update Win/Loss (disabled)
 * - Stats
 */
export function loadAdminOptions() {
  if (!pickForm) {
    console.error('pickForm element not found!');
    return;
  }

  // Clear all existing content in pickForm before rendering admin options
  pickForm.innerHTML = '';

  // Remove previous adminOptionsContainer if any
  if (adminOptionsContainer) {
    adminOptionsContainer.remove();
    adminOptionsContainer = null;
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
    // Hide admin options container (no clearing pickForm)
    if (adminOptionsContainer) {
      adminOptionsContainer.style.display = 'none';
    }

    // Show pickForm container
    if (pickForm) {
      pickForm.style.display = 'block';
    }

    // Call loadSports just like user login flow
    await loadSports();
  });

  // Stats button click handler
  statsBtn.addEventListener('click', async () => {
    // Hide admin options container while showing stats
    adminOptionsContainer.style.display = 'none';

    // Load stats screen
    await loadAdminStats();
  });

  // Append buttons to the container
  adminOptionsContainer.appendChild(addNewPickBtn);
  adminOptionsContainer.appendChild(updateWinLossBtn);
  adminOptionsContainer.appendChild(statsBtn);

  // Append container to pickForm
  pickForm.appendChild(adminOptionsContainer);
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
  btn.className = 'pick-btn blue'; // styling consistent with sport selector buttons

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
