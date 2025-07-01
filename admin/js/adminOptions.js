import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const adminContentContainer = document.getElementById('adminContentContainer');

let addNewPickBtn;
let updateWinLossBtn;
let statsBtn;

export async function loadAdminOptions() {
  if (!adminButtonsContainer || !adminContentContainer) {
    console.error('Containers not found!');
    return;
  }

  // Clear buttons and content containers
  adminButtonsContainer.innerHTML = '';
  adminContentContainer.innerHTML = '';

  // Create buttons
  addNewPickBtn = createButton('Add New Pick');
  updateWinLossBtn = createButton('Update Win/Loss', true);
  statsBtn = createButton('Stats');

  // Style buttons container
  adminButtonsContainer.style.display = 'grid';
  adminButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  adminButtonsContainer.style.gap = '6px';
  adminButtonsContainer.style.marginBottom = '12px';

  // Append buttons
  adminButtonsContainer.appendChild(addNewPickBtn);
  adminButtonsContainer.appendChild(updateWinLossBtn);
  adminButtonsContainer.appendChild(statsBtn);

  // Helper to clear content and load selected view
  async function showContent(loaderFunc) {
    adminContentContainer.innerHTML = '';
    await loaderFunc();
  }

  addNewPickBtn.addEventListener('click', async () => {
    console.log('Add New Pick clicked');
    await showContent(loadSports);
  });

  statsBtn.addEventListener('click', async () => {
    console.log('Stats clicked');
    await showContent(loadAdminStats);
  });

  // Update Win/Loss button disabled, no handler needed

  // Optionally show the sports selector by default or keep empty
  await showContent(loadSports);
}

/**
 * Utility to create styled button
 */
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

  if (disabled) {
    btn.disabled = true;
  }

  return btn;
}
