import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');
const adminStatsContainer = document.getElementById('adminStatsContainer');

if (!adminButtonsContainer) console.error('[adminOptions] adminButtonsContainer NOT FOUND!');
if (!pickForm) console.error('[adminOptions] pickForm NOT FOUND!');
if (!adminStatsContainer) console.error('[adminOptions] adminStatsContainer NOT FOUND!');

/**
 * Load the admin screen with three buttons (Add New Pick, Update Win/Loss, Stats),
 * and show/hide the sports selector and stats containers properly.
 */
export async function loadAdminOptions() {
  console.log('[loadAdminOptions] called');

  if (!adminButtonsContainer || !pickForm || !adminStatsContainer) {
    console.error('[loadAdminOptions] One or more required containers are missing.');
    return;
  }

  // Clear previous buttons
  adminButtonsContainer.innerHTML = '';
  // Hide containers initially
  pickForm.style.display = 'none';
  adminStatsContainer.style.display = 'none';

  // Create buttons
  console.log('[loadAdminOptions] Creating buttons');

  const addNewPickBtn = createButton('Add New Pick');
  const updateWinLossBtn = createButton('Update Win/Loss', true);
  const statsBtn = createButton('Stats');

  // Add event listeners
  addNewPickBtn.addEventListener('click', async () => {
    console.log('[Add New Pick] clicked');
    adminStatsContainer.style.display = 'none';
    pickForm.style.display = 'block';
    await loadSports();
    console.log('[Add New Pick] loadSports completed');
  });

  updateWinLossBtn.addEventListener('click', () => {
    console.log('[Update Win/Loss] clicked - disabled');
  });

  statsBtn.addEventListener('click', async () => {
    console.log('[Stats] clicked');
    pickForm.style.display = 'none';
    adminStatsContainer.style.display = 'block';
    await loadAdminStats();
    console.log('[Stats] loadAdminStats completed');
  });

  // Append buttons to container
  adminButtonsContainer.appendChild(addNewPickBtn);
  adminButtonsContainer.appendChild(updateWinLossBtn);
  adminButtonsContainer.appendChild(statsBtn);

  // Initial state: show pickForm and load sports
  pickForm.style.display = 'block';
  adminStatsContainer.style.display = 'none';

  await loadSports();
  console.log('[loadAdminOptions] initial loadSports completed');
}

/**
 * Utility function to create a styled button.
 * @param {string} text Button label
 * @param {boolean} disabled Whether button is disabled
 * @returns {HTMLButtonElement}
 */
function createButton(text, disabled = false) {
  console.log(`[createButton] Creating button "${text}" (disabled: ${disabled})`);
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
    console.log(`[createButton] Button "${text}" is disabled`);
  }

  return btn;
}
