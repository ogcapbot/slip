import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const adminContentContainer = document.getElementById('adminContentContainer');

let addNewPickBtn;
let updateWinLossBtn;
let statsBtn;

/**
 * Load the admin screen with three buttons (Add New Pick, Update Win/Loss, Stats)
 * and show the sports selector or stats below depending on selection.
 */
export async function loadAdminOptions() {
  if (!adminButtonsContainer || !adminContentContainer) {
    console.error('[loadAdminOptions] Containers not found!');
    return;
  }

  // Clear previous UI
  adminButtonsContainer.innerHTML = '';
  adminContentContainer.innerHTML = '';

  // Create buttons
  addNewPickBtn = createButton('Add New Pick');
  updateWinLossBtn = createButton('Update Win/Loss', true);
  statsBtn = createButton('Stats');

  // Style buttons container as grid with 3 equal columns
  adminButtonsContainer.style.display = 'grid';
  adminButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  adminButtonsContainer.style.gap = '6px';
  adminButtonsContainer.style.marginBottom = '12px';

  // Append buttons to container
  adminButtonsContainer.appendChild(addNewPickBtn);
  adminButtonsContainer.appendChild(updateWinLossBtn);
  adminButtonsContainer.appendChild(statsBtn);

  // Add New Pick button click handler
  addNewPickBtn.addEventListener('click', async () => {
    console.log('[Add New Pick] clicked');
    adminContentContainer.innerHTML = '';
    adminContentContainer.style.display = 'block';
    await loadSports();
  });

  // Stats button click handler
  statsBtn.addEventListener('click', async () => {
    console.log('[Stats] clicked');
    adminContentContainer.innerHTML = '';
    adminContentContainer.style.display = 'block';
    await loadAdminStats();
  });

  // Show admin content container and load sports selector by default
  adminContentContainer.style.display = 'block';
  await loadSports();
}

/**
 * Utility function to create styled buttons
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
