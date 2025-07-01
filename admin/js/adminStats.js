import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');
const adminStatsContainer = document.getElementById('adminStatsContainer');

export async function loadAdminOptions() {
  console.log('[loadAdminOptions] called');

  if (!adminButtonsContainer || !pickForm || !adminStatsContainer) {
    console.error('[loadAdminOptions] ERROR: Required containers NOT found!');
    return;
  }

  try {
    // Clear and reset container
    adminButtonsContainer.innerHTML = '';
    pickForm.style.display = 'none';
    adminStatsContainer.style.display = 'none';

    // Create buttons and append
    const buttons = [
      createButton('Add New Pick'),
      createButton('Update Win/Loss', true),
      createButton('Stats'),
    ];

    buttons.forEach(btn => adminButtonsContainer.appendChild(btn));

    adminButtonsContainer.style.display = 'grid';
    adminButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    adminButtonsContainer.style.gap = '6px';
    adminButtonsContainer.style.marginBottom = '12px';

    // Use event delegation on container
    adminButtonsContainer.onclick = async (event) => {
      if (!event.target.matches('button')) return;
      const btnText = event.target.textContent;
      console.log(`[adminButtonsContainer] Button clicked: "${btnText}"`);

      if (btnText === 'Add New Pick') {
        try {
          pickForm.style.display = 'block';
          adminStatsContainer.style.display = 'none';
          await loadSports();
          console.log('[Add New Pick] loadSports() completed');
        } catch (e) {
          console.error('[Add New Pick] loadSports() error:', e);
        }
      } else if (btnText === 'Stats') {
        try {
          pickForm.style.display = 'none';
          adminStatsContainer.style.display = 'block';
          await loadAdminStats();
          console.log('[Stats] loadAdminStats() completed');
        } catch (e) {
          console.error('[Stats] loadAdminStats() error:', e);
        }
      } else if (btnText === 'Update Win/Loss') {
        console.log('[Update Win/Loss] Button clicked but disabled');
      } else {
        console.warn(`[adminButtonsContainer] Unknown button clicked: "${btnText}"`);
      }
    };

    // Initial loadSports call
    pickForm.style.display = 'block';
    adminStatsContainer.style.display = 'none';
    await loadSports();
    console.log('[loadAdminOptions] Initial loadSports() completed');

  } catch (error) {
    console.error('[loadAdminOptions] Unexpected error:', error);
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
