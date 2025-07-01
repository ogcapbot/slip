
import { loadSports } from './sportSelector.js';

const pickForm = document.getElementById('pickForm');

let adminOptionsContainer;

export function loadAdminOptions() {
  if (!pickForm) {
    console.error('pickForm element not found!');
    return;
  }

  // Clear previous adminOptions container if exists
  if (adminOptionsContainer) {
    adminOptionsContainer.remove();
  }

  adminOptionsContainer = document.createElement('div');
  adminOptionsContainer.id = 'adminOptionsContainer';

  // Style container to match sportButtonsContainer grid style
  adminOptionsContainer.style.display = 'grid';
  adminOptionsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  adminOptionsContainer.style.gap = '6px';
  adminOptionsContainer.style.marginTop = '8px';

  // Create buttons
  const addNewPickBtn = createButton('Add New Pick');
  const updateWinLossBtn = createButton('Update Win/Loss', true);
  const statsBtn = createButton('Stats', true);

  // Add event listener for Add New Pick
  addNewPickBtn.addEventListener('click', async () => {
    // Hide all buttons
    adminOptionsContainer.style.display = 'none';

    // Load sport selector screen
    await loadSports();
  });

  // Append buttons in order
  adminOptionsContainer.appendChild(addNewPickBtn);
  adminOptionsContainer.appendChild(updateWinLossBtn);
  adminOptionsContainer.appendChild(statsBtn);

  // Append container to pickForm (or suitable container)
  pickForm.appendChild(adminOptionsContainer);
}

function createButton(text, disabled = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  btn.className = 'pick-btn blue'; // matching sportSelector button styles

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
