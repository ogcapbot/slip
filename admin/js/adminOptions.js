import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');
const adminStatsContainer = document.getElementById('adminStatsContainer');

if (!adminButtonsContainer || !pickForm || !adminStatsContainer) {
  console.error('Containers not found! Check HTML IDs.');
}

/**
 * Load the admin screen with three buttons:
 * - Add New Pick (loads sports selector)
 * - Update Win/Loss (disabled)
 * - Stats (loads stats)
 * Shows the relevant section below the buttons depending on button clicks.
 */
export async function loadAdminOptions() {
  console.log('[loadAdminOptions] called');

  if (!adminButtonsContainer || !pickForm || !adminStatsContainer) {
    console.error('[loadAdminOptions] Containers missing, aborting');
    return;
  }

  // Clear previous buttons
  adminButtonsContainer.innerHTML = '';
  // Hide both content containers initially
  pickForm.style.display = 'none';
  adminStatsContainer.style.display = 'none';

  console.log('[loadAdminOptions] Creating buttons');

  // Create buttons
  const addNewPickBtn = createButton('Add New Pick');
  const updateWinLossBtn = createButton('Update Win/Loss', true);
  const statsBtn = createButton('Stats');

  // Style container as grid with gap
  adminButtonsContainer.style.display = 'grid';
  adminButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  adminButtonsContainer.style.gap = '6px';
  adminButtonsContainer.style.marginBottom = '12px';

  // Append buttons
  adminButtonsContainer.appendChild(addNewPickBtn);
  adminButtonsContainer.appendChild(updateWinLossBtn);
  adminButtonsContainer.appendChild(statsBtn);

  // Add event listeners wired correctly!

  addNewPickBtn.addEventListener('click', async () => {
    console.log('[Add New Pick] clicked');
    // Show sports selector form, hide stats
    pickForm.style.display = 'block';
    adminStatsContainer.style.display = 'none';
    // Load sports selector content
    await loadSports();
    console.log('[Add New Pick] loadSports completed');
  });

  statsBtn.addEventListener('click', async () => {
    console.log('[Stats] clicked');
    // Show stats container, hide sports selector form
    adminStatsContainer.style.display = 'block';
    pickForm.style.display = 'none';
    // Load admin stats content
    await loadAdminStats();
    console.log('[Stats] loadAdminStats completed');
  });

  // Initial state: show sports selector form and load sports
  pickForm.style.display = 'block';
  adminStatsContainer.style.display = 'none';

  await loadSports();
  console.log('[loadAdminOptions] initial loadSports completed');
}

/**
 * Creates a styled button element
 * @param {string} text - Button label
 * @param {boolean} disabled - Disabled state (default false)
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
