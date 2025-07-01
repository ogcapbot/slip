import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');
const adminStatsContainer = document.getElementById('adminStatsContainer');

export async function loadAdminOptions() {
  console.log('[loadAdminOptions] called');

  if (!adminButtonsContainer) {
    console.error('[loadAdminOptions] ERROR: adminButtonsContainer not found!');
    return;
  }
  if (!pickForm) {
    console.error('[loadAdminOptions] ERROR: pickForm not found!');
    return;
  }
  if (!adminStatsContainer) {
    console.error('[loadAdminOptions] ERROR: adminStatsContainer not found!');
    return;
  }

  // Clear buttons and hide content containers
  adminButtonsContainer.innerHTML = '';
  pickForm.style.display = 'none';
  adminStatsContainer.style.display = 'none';

  // Create buttons
  const addNewPickBtn = createButton('Add New Pick');
  const updateWinLossBtn = createButton('Update Win/Loss', true);
  const statsBtn = createButton('Stats');

  // Style container
  adminButtonsContainer.style.display = 'grid';
  adminButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  adminButtonsContainer.style.gap = '6px';
  adminButtonsContainer.style.marginBottom = '12px';

  // Append buttons to container
  adminButtonsContainer.appendChild(addNewPickBtn);
  adminButtonsContainer.appendChild(updateWinLossBtn);
  adminButtonsContainer.appendChild(statsBtn);

  // Setup event listeners
  addNewPickBtn.addEventListener('click', async () => {
    console.log('[Add New Pick] clicked');
    addNewPickBtn.disabled = true;
    statsBtn.disabled = false;

    pickForm.style.display = 'block';
    adminStatsContainer.style.display = 'none';

    try {
      await loadSports();
      console.log('[Add New Pick] loadSports completed');
    } catch (e) {
      console.error('[Add New Pick] loadSports error:', e);
    } finally {
      addNewPickBtn.disabled = false;
    }
  });

  statsBtn.addEventListener('click', async () => {
    console.log('[Stats] clicked');
    statsBtn.disabled = true;
    addNewPickBtn.disabled = false;

    pickForm.style.display = 'none';
    adminStatsContainer.style.display = 'block';

    try {
      await loadAdminStats();
      console.log('[Stats] loadAdminStats completed');
    } catch (e) {
      console.error('[Stats] loadAdminStats error:', e);
    } finally {
      statsBtn.disabled = false;
    }
  });

  // Show sports selector by default on load
  pickForm.style.display = 'block';
  adminStatsContainer.style.display = 'none';

  try {
    await loadSports();
    console.log('[loadAdminOptions] initial loadSports completed');
  } catch (e) {
    console.error('[loadAdminOptions] initial loadSports error:', e);
  }
}

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

  if (disabled) btn.disabled = true;
  return btn;
}
