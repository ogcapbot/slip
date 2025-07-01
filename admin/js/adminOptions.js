import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const pickForm = document.getElementById('pickForm');

let adminOptionsContainer = null;
let currentUserAccess = null;

/**
 * Call this on login to load correct UI based on access level
 * @param {string} accessLevel - 'User' or admin roles like 'SuperAdmin'
 */
export function loginUser(accessLevel) {
  currentUserAccess = accessLevel;

  if (!pickForm) {
    console.error('pickForm element not found!');
    return;
  }

  // Clear any existing content
  pickForm.innerHTML = '';
  adminOptionsContainer = null;

  // Make sure pickForm is visible
  pickForm.style.display = 'block';

  if (accessLevel === 'User') {
    // Regular user: show sports selector UI immediately
    loadSports();
  } else {
    // Admin user: show admin options UI
    loadAdminOptions();
  }
}

/**
 * Load the admin options screen with buttons:
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

  // Remove existing container if any
  if (adminOptionsContainer) {
    adminOptionsContainer.remove();
    adminOptionsContainer = null;
  }

  // Show pickForm container
  pickForm.style.display = 'block';

  // Create container div for admin buttons
  adminOptionsContainer = document.createElement('div');
  adminOptionsContainer.id = 'adminOptionsContainer';

  // Style as grid with 3 equal columns
  adminOptionsContainer.style.display = 'grid';
  adminOptionsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  adminOptionsContainer.style.gap = '6px';
  adminOptionsContainer.style.marginTop = '8px';

  // Create buttons
  const addNewPickBtn = createButton('Add New Pick');
  const updateWinLossBtn = createButton('Update Win/Loss', true);
  const statsBtn = createButton('Stats');

  // Add New Pick button click: switch UI to sports selector (user mode)
  addNewPickBtn.addEventListener('click', async () => {
    pickForm.innerHTML = '';
    adminOptionsContainer = null;

    pickForm.style.display = 'block';

    // Optionally update UI mode state:
    // currentUserAccess = 'User';

    await loadSports();
  });

  // Stats button click: load admin stats UI
  statsBtn.addEventListener('click', async () => {
    pickForm.innerHTML = '';
    adminOptionsContainer = null;

    pickForm.style.display = 'block';

    await loadAdminStats();
  });

  // Append buttons to container
  adminOptionsContainer.appendChild(addNewPickBtn);
  adminOptionsContainer.appendChild(updateWinLossBtn);
  adminOptionsContainer.appendChild(statsBtn);

  // Append container to pickForm
  pickForm.appendChild(adminOptionsContainer);
}

/**
 * Utility to create styled button
 * @param {string} text Button label
 * @param {boolean} disabled Whether to disable button
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
