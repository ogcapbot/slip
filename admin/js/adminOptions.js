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

  // Style containers: position relative for layering and z-index
  pickForm.style.position = 'relative';
  adminStatsContainer.style.position = 'relative';

  // Start by hiding both content containers
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

  // Event: Add New Pick - show sports selector, hide stats
  addNewPickBtn.addEventListener('click', async () => {
    console.log('[Add New Pick] clicked');
    // Show sports container
    pickForm.style.display = 'block';
    pickForm.style.zIndex = '10'; // bring on top
    adminStatsContainer.style.display = 'none';
    adminStatsContainer.style.zIndex = '0'; // send behind
    // Load sports content
    await loadSports();
    console.log('[Add New Pick] loadSports completed');
  });

  // Event: Stats - show stats container, hide sports
  statsBtn.addEventListener('click', async () => {
    console.log('[Stats] clicked');
    // Show stats container
    adminStatsContainer.style.display = 'block';
    adminStatsContainer.style.zIndex = '10'; // bring on top
    pickForm.style.display = 'none';
    pickForm.style.zIndex = '0'; // send behind
    // Clear sports container if needed (optional)
    pickForm.innerHTML = '';
    // Load stats content
    await loadAdminStats();
    console.log('[Stats] loadAdminStats completed');
  });

  // Initial load: show sports selector by default
  pickForm.style.display = 'block';
  pickForm.style.zIndex = '10';
  adminStatsContainer.style.display = 'none';
  adminStatsContainer.style.zIndex = '0';

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
