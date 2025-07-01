import { loadAdminStats } from './adminStats.js';

const adminSection = document.getElementById('adminSection');
const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const adminStatsContainer = document.getElementById('adminStatsContainer');

if (!adminSection || !adminButtonsContainer || !adminStatsContainer) {
  console.error('Containers not found! Check HTML IDs.');
}

const SUPERADMIN_CODE = 'super123'; // Your simple hardcoded code

export async function loadAdminOptions() {
  // Show the admin section container on login
  adminSection.style.display = 'block';

  console.log('[loadAdminOptions] called');

  // Clear buttons container
  adminButtonsContainer.innerHTML = '';

  // Hide message container initially
  adminStatsContainer.style.display = 'none';

  // Button definitions: text and message
  const buttons = [
    { text: 'Add New Pick', message: 'Coming Soon... Add New' },
    { text: 'Update Win/Loss', message: 'Coming Soon... Win/Loss' },
    { text: 'Stats', message: 'Stats' },
    { text: 'Admin 1', message: 'Coming Soon... Admin 1' },
    { text: 'Admin 2', message: 'Coming Soon... Admin 2' },
    { text: 'Settings', message: 'Coming Soon... Settings' },
  ];

  // Create buttons and add to container
  buttons.forEach(({ text, message }, index) => {
    const btn = createButton(text);
    btn.addEventListener('click', async () => {
      console.log(`[${text}] clicked`);

      if (index === 2) {
        // Stats button clicked
        await loadAdminStats();
      } else if (index >= 3) {
        // Bottom 3 buttons require password
        const enteredCode = prompt('Enter SuperAdmin Code to Continue:');
        if (enteredCode === SUPERADMIN_CODE) {
          showMessage(message);
        } else {
          showAccessDenied();
        }
      } else {
        // Top 2 buttons show placeholder message
        showMessage(message);
      }
    });
    adminButtonsContainer.appendChild(btn);
  });

  // On initial load, show Stats output automatically
  await loadAdminStats();

  function showMessage(msg) {
    adminStatsContainer.style.display = 'block';
    adminStatsContainer.style.color = '#444'; // normal text color
    adminStatsContainer.innerHTML = `<p>${msg}</p>`;
  }

  function showAccessDenied() {
    adminStatsContainer.style.display = 'block';
    adminStatsContainer.style.color = 'red';
    adminStatsContainer.innerHTML = `<p>Access Denied - The SuperAdmin Code entered is incorrect</p>`;
  }
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
