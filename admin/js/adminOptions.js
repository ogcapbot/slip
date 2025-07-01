import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');
const adminStatsContainer = document.getElementById('adminStatsContainer');

if (!adminButtonsContainer || !pickForm || !adminStatsContainer) {
  console.error('Containers not found! Check HTML IDs.');
}

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

  // *** Correct Event Bindings ***

  // When Add New Pick is clicked, show the sports selector and load sports
  addNewPickBtn.addEventListener('click', async () => {
    console.log('[Add New Pick] clicked');
    pickForm.style.display = 'block';
    adminStatsContainer.style.display = 'none';
    await loadSports();
    console.log('[Add New Pick] loadSports completed');
  });

  // When Stats is clicked, show the admin stats container and load stats
  statsBtn.addEventListener('click', async () => {
    console.log('[Stats] clicked');
    adminStatsContainer.style.display = 'block';
    pickForm.style.display = 'none';
    await loadAdminStats();
    console.log('[Stats] loadAdminStats completed');
  });

  // Initial load: show sports selector by default
  pickForm.style.display = 'block';
  adminStatsContainer.style.display = 'none';

  await loadSports();
  console.log('[loadAdminOptions] initial loadSports completed');
}

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
