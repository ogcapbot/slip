import { loadAdminStats } from './adminStats.js';
import { loadSports } from './sportSelector.js';

const adminSection = document.getElementById('adminSection');
const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');

const SUPERADMIN_CODE = 'super123';

export async function loadAdminOptions() {
  adminSection.style.display = 'block';
  adminButtonsContainer.innerHTML = '';
  pickForm.style.display = 'block';
  pickForm.innerHTML = '';

  const buttons = [
    { text: 'Add New Pick', message: '' },
    { text: 'Update Win/Loss', message: 'Coming Soon... Win/Loss' },
    { text: 'Stats', message: 'Stats' },
    { text: 'Admin 1', message: 'Coming Soon... Admin 1' },
    { text: 'Admin 2', message: 'Coming Soon... Admin 2' },
    { text: 'Settings', message: 'Coming Soon... Settings' },
  ];

  buttons.forEach(({ text, message }, index) => {
    const btn = createButton(text);
    btn.addEventListener('click', async () => {
      if (index === 0) {
        // Load sports instead of placeholder for "Add New Pick"
        await loadSports();
      } else if (index === 2) {
        await loadAdminStats(pickForm);
      } else if (index >= 3) {
        const enteredCode = prompt('Enter Code to Continue:');
        if (enteredCode === SUPERADMIN_CODE) {
          pickForm.style.color = '#444';
          pickForm.innerHTML = `<p>${message}</p>`;
        } else {
          pickForm.style.color = 'red';
          pickForm.innerHTML = `<p>Access Denied - The Code entered is incorrect.</p>`;
        }
      } else {
        pickForm.style.color = '#444';
        pickForm.innerHTML = `<p>${message}</p>`;
      }
    });
    adminButtonsContainer.appendChild(btn);
  });

  await loadAdminStats(pickForm);
}

function createButton(text) {
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

  return btn;
}
