import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');

let updateWinLossBtn;
let statsBtn;

/**
 * Load the admin screen with two buttons (Update Win/Loss disabled and Stats),
 * and always show the sports selector form below.
 */
export async function loadAdminOptions() {
  console.log('[loadAdminOptions] called');

  if (!adminButtonsContainer || !pickForm) {
    console.error('[loadAdminOptions] ERROR: Containers not found');
    return;
  }

  // Clear the admin buttons container but do NOT clear pickForm (sports selector)
  adminButtonsContainer.innerHTML = '';

  console.log('[loadAdminOptions] Creating Update Win/Loss button (disabled)');
  updateWinLossBtn = createButton('Update Win/Loss', true);

  console.log('[loadAdminOptions] Creating Stats button');
  statsBtn = createButton('Stats');

  statsBtn.addEventListener('click', async () => {
    console.log('[Stats Button] Clicked - hiding admin buttons');
    adminButtonsContainer.style.display = 'none';

    console.log('[Stats Button] Loading admin stats screen');
    await loadAdminStats();

    console.log('[Stats Button] Admin stats screen loaded');
    // Add logic here to restore buttons or UI if needed
  });

  console.log('[loadAdminOptions] Appending buttons to adminButtonsContainer');
  adminButtonsContainer.appendChild(updateWinLossBtn);
  adminButtonsContainer.appendChild(statsBtn);

  console.log('[loadAdminOptions] Showing adminButtonsContainer and pickForm');
  adminButtonsContainer.style.display = 'grid';
  adminButtonsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
  adminButtonsContainer.style.gap = '6px';
  adminButtonsContainer.style.marginBottom = '12px';

  pickForm.style.display = 'block';

  console.log('[loadAdminOptions] Calling loadSports to render sports selector');
  await loadSports();

  console.log('[loadAdminOptions] loadSports completed');
}

/**
 * Utility function to create styled button
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
    console.log(`[createButton] Button "${text}" disabled`);
  }

  return btn;
}
