import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const pickForm = document.getElementById('pickForm');

let adminOptionsContainer = null;
let currentUserAccess = null;

/**
 * Call this function on user login to load the correct UI based on access level.
 * @param {string} accessLevel - 'User' or admin roles like 'SuperAdmin'
 */
export function loginUser(accessLevel) {
  currentUserAccess = accessLevel;

  if (!pickForm) {
    console.error('pickForm element not found!');
    return;
  }

  // Clear existing content on login
  pickForm.innerHTML = '';
  adminOptionsContainer = null;

  if (accessLevel === 'User') {
    // Regular user: load sports selector page directly
    loadSports();
  } else {
    // Admin user: load admin options screen
    loadAdminOptions();
  }
}

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

  // Clear pickForm before rendering admin options
  pickForm.innerHTML = '';

  // Remove any existing adminOptionsContainer from DOM
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

  // Add New Pick button click handler: switch to user mode UI
  addNewPickBtn.addEventListener('click', async () => {
    // Clear UI container and reset adminOptionsContainer reference
    pickForm.innerHTML = '';
    adminOptionsContainer = null;

    // Set UI mode to 'User' without logging out
    currentUserAccess = 'User';

    // Load sports selector UI (like regular user)
    await loadSports();
  });

  // Stats button click handler: load admin stats screen
  statsBtn.addEventListener('click', async () => {
    pickForm.innerHTML = '';
    adminOptionsContainer = null;
    await loadAdminStats();
  });

  // Append buttons to the container
  adminOptionsContainer.appendChild(addNewPickBtn);
  adminOptionsContainer.appendChild(updateWinLossBtn);
  adminOptionsContainer.appendChild(statsBtn);

  // Append admin options container to pickForm
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
