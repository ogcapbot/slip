import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');
const adminStatsContainer = document.getElementById('adminStatsContainer');

let addNewPickBtn;
let updateWinLossBtn;
let statsBtn;

export async function loadAdminOptions() {
  console.log('[loadAdminOptions] called');

  if (!adminButtonsContainer) {
    console.error('[loadAdminOptions] ERROR: adminButtonsContainer NOT found!');
    return;
  }
  if (!pickForm) {
    console.error('[loadAdminOptions] ERROR: pickForm NOT found!');
    return;
  }
  if (!adminStatsContainer) {
    console.error('[loadAdminOptions] ERROR: adminStatsContainer NOT found!');
    return;
  }

  try {
    console.log('[loadAdminOptions] Clearing adminButtonsContainer and hiding content containers');
    adminButtonsContainer.innerHTML = '';
    pickForm.style.display = 'none';
    adminStatsContainer.style.display = 'none';

    console.log('[loadAdminOptions] Creating buttons');
    addNewPickBtn = createButton('Add New Pick');
    updateWinLossBtn = createButton('Update Win/Loss', true);
    statsBtn = createButton('Stats');

    console.log('[loadAdminOptions] Styling adminButtonsContainer');
    adminButtonsContainer.style.display = 'grid';
    adminButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    adminButtonsContainer.style.gap = '6px';
    adminButtonsContainer.style.marginBottom = '12px';

    console.log('[loadAdminOptions] Appending buttons');
    adminButtonsContainer.appendChild(addNewPickBtn);
    adminButtonsContainer.appendChild(updateWinLossBtn);
    adminButtonsContainer.appendChild(statsBtn);

    console.log('[loadAdminOptions] Setting up Add New Pick button event listener');
    addNewPickBtn.addEventListener('click', async () => {
      console.log('[Add New Pick] Clicked');
      try {
        pickForm.style.display = 'block';
        adminStatsContainer.style.display = 'none';
        console.log('[Add New Pick] Showing pickForm, hiding adminStatsContainer');
        await loadSports();
        console.log('[Add New Pick] loadSports() completed');
      } catch (e) {
        console.error('[Add New Pick] Error loading sports:', e);
      }
    });

    console.log('[loadAdminOptions] Setting up Stats button event listener');
    statsBtn.addEventListener('click', async () => {
      console.log('[Stats] Clicked');
      try {
        pickForm.style.display = 'none';
        adminStatsContainer.style.display = 'block';
        console.log('[Stats] Showing adminStatsContainer, hiding pickForm');
        await loadAdminStats();
        console.log('[Stats] loadAdminStats() completed');
      } catch (e) {
        console.error('[Stats] Error loading stats:', e);
      }
    });

    console.log('[loadAdminOptions] Initial load: showing pickForm');
    pickForm.style.display = 'block';
    adminStatsContainer.style.display = 'none';
    await loadSports();
    console.log('[loadAdminOptions] Initial loadSports() completed');

  } catch (error) {
    console.error('[loadAdminOptions] Unexpected error:', error);
  }
}

/**
 * Creates a styled button element.
 * @param {string} text Button label.
 * @param {boolean} disabled Whether to disable the button.
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
