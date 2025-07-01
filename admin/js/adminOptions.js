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
  const updateWinLossBtn = createButton('Update Win/Loss');
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

  // Shared container for showing messages
  // We will use the adminStatsContainer for simplicity to show all messages
  // and hide the pickForm always

  function showMessage(message) {
    adminStatsContainer.style.display = 'block';
    pickForm.style.display = 'none';
    adminStatsContainer.innerHTML = `<p style="font-weight:bold; font-size:18px; text-align:center; padding: 20px;">${message}</p>`;
  }

  // Button handlers

  addNewPickBtn.addEventListener('click', () => {
    console.log('[Add New Pick] clicked');
    showMessage('Coming Soon... Add New');
  });

  updateWinLossBtn.addEventListener('click', () => {
    console.log('[Update Win/Loss] clicked');
    showMessage('Coming Soon... Win/Loss');
  });

  statsBtn.addEventListener('click', () => {
    console.log('[Stats] clicked');
    showMessage('Coming Soon... Stats');
  });

  // Initial load: show Add New Pick message by default
  showMessage('Coming Soon... Add New');
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
