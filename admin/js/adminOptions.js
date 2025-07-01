import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const pickForm = document.getElementById('pickForm');

let adminButtonsContainer;

/**
 * Load the admin screen with two buttons (Update Win/Loss disabled and Stats),
 * and always show the sports selector form below.
 */
export async function loadAdminOptions() {
  console.log('[loadAdminOptions] called');

  if (!pickForm) {
    console.error('[loadAdminOptions] ERROR: pickForm element not found!');
    return;
  }

  console.log('[loadAdminOptions] Clearing pickForm content');
  pickForm.innerHTML = '';

  if (adminButtonsContainer) {
    console.log('[loadAdminOptions] Removing previous adminButtonsContainer');
    adminButtonsContainer.remove();
    adminButtonsContainer = null;
  }

  console.log('[loadAdminOptions] Creating adminButtonsContainer div');
  adminButtonsContainer = document.createElement('div');
  adminButtonsContainer.id = 'adminButtonsContainer';

  console.log('[loadAdminOptions] Styling adminButtonsContainer');
  adminButtonsContainer.style.display = 'grid';
  adminButtonsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
  adminButtonsContainer.style.gap = '6px';
  adminButtonsContainer.style.marginBottom = '12px';

  console.log('[loadAdminOptions] Creating Update Win/Loss button (disabled)');
  const updateWinLossBtn = createButton('Update Win/Loss', true);

  console.log('[loadAdminOptions] Creating Stats button');
  const statsBtn = createButton('Stats');

  console.log('[loadAdminOptions] Adding click event listener to Stats button');
  statsBtn.addEventListener('click', async () => {
    console.log('[Stats Button] Clicked - hiding admin buttons');
    adminButtonsContainer.style.display = 'none';

    console.log('[Stats Button] Loading admin stats screen');
    await loadAdminStats();

    console.log('[Stats Button] Admin stats screen loaded');
    // If you want to restore buttons and form after stats, add logic here
  });

  console.log('[loadAdminOptions] Appending buttons to adminButtonsContainer');
  adminButtonsContainer.appendChild(updateWinLossBtn);
  adminButtonsContainer.appendChild(statsBtn);

  console.log('[loadAdminOptions] Appending adminButtonsContainer to pickForm');
  pickForm.appendChild(adminButtonsContainer);

  console.log('[loadAdminOptions] Showing pickForm container');
  pickForm.style.display = 'block';

  console.log('[loadAdminOptions] Calling loadSports to render sports selector');
  await loadSports();

  console.log('[loadAdminOptions] loadSports completed');
}

/**
 * Utility to create styled button
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
