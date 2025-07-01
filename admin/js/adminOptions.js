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

  if (!adminButtonsContainer || !pickForm || !adminStatsContainer) {
    console.error('[loadAdminOptions] ERROR: One or more containers NOT found!');
    return;
  }

  try {
    adminButtonsContainer.innerHTML = '';
    pickForm.style.display = 'none';
    adminStatsContainer.style.display = 'none';

    addNewPickBtn = createButton('Add New Pick');
    updateWinLossBtn = createButton('Update Win/Loss', true);
    statsBtn = createButton('Stats');

    adminButtonsContainer.style.display = 'grid';
    adminButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    adminButtonsContainer.style.gap = '6px';
    adminButtonsContainer.style.marginBottom = '12px';

    adminButtonsContainer.appendChild(addNewPickBtn);
    adminButtonsContainer.appendChild(updateWinLossBtn);
    adminButtonsContainer.appendChild(statsBtn);

    // Remove any existing listeners to avoid duplicates
    removeAllEventListeners(addNewPickBtn);
    removeAllEventListeners(statsBtn);

    // Add New Pick click
    addNewPickBtn.addEventListener('click', async () => {
      console.log('[Add New Pick] Clicked');
      try {
        addNewPickBtn.disabled = true;
        statsBtn.disabled = false;

        pickForm.style.display = 'block';
        adminStatsContainer.style.display = 'none';

        await loadSports();
        console.log('[Add New Pick] loadSports() completed');
      } catch (e) {
        console.error('[Add New Pick] loadSports() error:', e);
      } finally {
        addNewPickBtn.disabled = false;
      }
    });

    // Stats click
    statsBtn.addEventListener('click', async () => {
      console.log('[Stats] Clicked');
      try {
        statsBtn.disabled = true;
        addNewPickBtn.disabled = false;

        pickForm.style.display = 'none';
        adminStatsContainer.style.display = 'block';

        await loadAdminStats();
        console.log('[Stats] loadAdminStats() completed');
      } catch (e) {
        console.error('[Stats] loadAdminStats() error:', e);
      } finally {
        statsBtn.disabled = false;
      }
    });

    // Initial load
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

// Utility to remove all event listeners to avoid duplicates
function removeAllEventListeners(element) {
  const oldElement = element;
  const newElement = oldElement.cloneNode(true);
  oldElement.parentNode.replaceChild(newElement, oldElement);
  return newElement;
}
