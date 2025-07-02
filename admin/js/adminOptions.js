import { loadAdminStats } from './adminStats.js';
import { loadSports } from './sportSelector.js';

const adminSection = document.getElementById('adminSection');
const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');

const SUPERADMIN_CODE = 'super123';

let activeAdminBtn = null; // Track which admin button is currently active

export async function loadAdminOptions() {
  console.log('loadAdminOptions called');

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
    console.log(`Creating button: ${text} at index ${index}`);
    const btn = createButton(text);

    btn.addEventListener('click', async () => {
      console.log(`Button clicked: ${text} at index ${index}`);

      if (index >= 3) {
        // Admin buttons with password check
        const enteredCode = prompt('Enter Code to Continue:');
        console.log(`Code entered: ${enteredCode}`);
        if (enteredCode === SUPERADMIN_CODE) {
          pickForm.style.color = '#444';
          pickForm.innerHTML = `<p>${message}</p>`;
          console.log('Access granted, message displayed');
          setActiveAdminButton(btn);
        } else {
          pickForm.style.color = 'red';
          pickForm.innerHTML = `<p>Access Denied - The Code entered is incorrect.</p>`;
          console.warn('Access denied due to incorrect code');
          // Do NOT set active button on failed access
        }
      } else if (index === 0) {
        // Add New Pick
        console.log('Calling loadSports() for Add New Pick with pickForm container');
        try {
          await loadSports(pickForm);
          console.log('loadSports() completed successfully');
          setActiveAdminButton(btn);
        } catch (error) {
          console.error('Error in loadSports():', error);
        }
      } else if (index === 2) {
        // Stats
        console.log('Calling loadAdminStats() for Stats');
        try {
          await loadAdminStats(pickForm);
          console.log('loadAdminStats() completed successfully');
          setActiveAdminButton(btn);
        } catch (error) {
          console.error('Error in loadAdminStats():', error);
        }
      } else {
        // Other buttons without password
        pickForm.style.color = '#444';
        pickForm.innerHTML = `<p>${message}</p>`;
        console.log('Placeholder message displayed');
        setActiveAdminButton(btn);
      }
    });

    adminButtonsContainer.appendChild(btn);
  });

  console.log('All buttons created and appended');

  try {
    await loadAdminStats(pickForm);
    console.log('Initial loadAdminStats() call completed');
  } catch (error) {
    console.error('Error during initial loadAdminStats() call:', error);
  }
}

/**
 * Set the given button as active, and remove active from previous one
 * @param {HTMLElement} btn 
 */
function setActiveAdminButton(btn) {
  if (activeAdminBtn) {
    activeAdminBtn.classList.remove('green', 'pressed');
  }
  activeAdminBtn = btn;
  if (activeAdminBtn) {
    activeAdminBtn.classList.add('green', 'pressed');
  }
}

function createButton(text) {
  console.log(`createButton called with text: ${text}`);
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
