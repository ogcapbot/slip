import { loadSports } from './sportSelector.js';
import { loadAdminStats } from './adminStats.js';

const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');
const adminStatsContainer = document.getElementById('adminStatsContainer');

let addNewPickBtn;
let updateWinLossBtn;
let statsBtn;

export async function loadAdminOptions() {
  if (!adminButtonsContainer || !pickForm || !adminStatsContainer) {
    console.error('Required containers not found!');
    return;
  }

  adminButtonsContainer.innerHTML = '';

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

  // Initially show sports selector and hide stats
  pickForm.style.display = 'block';
  adminStatsContainer.style.display = 'none';
  await loadSports();

  addNewPickBtn.addEventListener('click', async () => {
    pickForm.style.display = 'block';
    adminStatsContainer.style.display = 'none';
    await loadSports();
  });

  statsBtn.addEventListener('click', async () => {
    pickForm.style.display = 'none';
    adminStatsContainer.style.display = 'block';
    await loadAdminStats();
  });
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

  if (disabled) {
    btn.disabled = true;
  }
  return btn;
}
