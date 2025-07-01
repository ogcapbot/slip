import { loadAdminStats } from './adminStats.js'; // Import your stats module

const adminSection = document.getElementById('adminSection');
const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const adminStatsContainer = document.getElementById('adminStatsContainer');

if (!adminSection || !adminButtonsContainer || !adminStatsContainer) {
  console.error('Containers not found! Check HTML IDs.');
}

export async function loadAdminOptions() {
  adminSection.style.display = 'block';
  console.log('[loadAdminOptions] called');

  adminButtonsContainer.innerHTML = '';
  adminStatsContainer.style.display = 'none';

  const buttons = [
    { text: 'Add New Pick', message: 'Coming Soon... Add New' },
    { text: 'Update Win/Loss', message: 'Coming Soon... Win/Loss' },
    { text: 'Stats', message: 'Coming Soon... Stats' },
    { text: 'Admin 1', message: 'Coming Soon... Admin 1' },
    { text: 'Admin 2', message: 'Coming Soon... Admin 2' },
    { text: 'Settings', message: 'Coming Soon... Settings' },
  ];

  const SUPERADMIN_CODE = 'super123';

  buttons.forEach(({ text, message }, index) => {
    const btn = createButton(text);
    btn.addEventListener('click', async () => {
      console.log(`[${text}] clicked`);
      if (index >= 3) {
        const enteredCode = prompt('Enter SuperAdmin Code to Continue:');
        if (enteredCode === SUPERADMIN_CODE) {
          await handleButtonAction(text, message);
        } else {
          showAccessDenied();
        }
      } else {
        await handleButtonAction(text, message);
      }
    });
    adminButtonsContainer.appendChild(btn);
  });

  // Load stats automatically on load
  await handleButtonAction('Stats', 'Coming Soon... Stats');

  function showMessage(msg) {
    adminStatsContainer.style.display = 'block';
    adminStatsContainer.style.color = '#444';
    adminStatsContainer.innerHTML = `<p>${msg}</p>`;
  }

  function showAccessDenied() {
    adminStatsContainer.style.display = 'block';
    adminStatsContainer.style.color = 'red';
    adminStatsContainer.innerHTML = `<p>Access Denied - The SuperAdmin Code entered is incorrect</p>`;
  }

  async function handleButtonAction(text, message) {
    // Clear container before loading content
    adminStatsContainer.innerHTML = '';
    adminStatsContainer.style.display = 'block';

    if (text === 'Stats') {
      await loadAdminStats();
    } else {
      showMessage(message);
    }
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
