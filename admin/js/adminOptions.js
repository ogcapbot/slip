import { loadAdminStats } from './adminStats.js';
import { loadSports, resetSportSelectorState } from './sportSelector.js';

const adminSection = document.getElementById('adminSection');
const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');

const SUPERADMIN_CODE = 'super123';

let activeAdminBtn = null; // Track active admin button

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
    { text: 'Refresh All', message: 'Refreshing all data...' },      // Updated Admin 1
    { text: 'Code {}', message: 'Coming Soon... Code {}' },          // Updated Admin 2
    { text: 'Settings', message: 'Coming Soon... Settings' },
  ];

  buttons.forEach(({ text, message }, index) => {
    console.log(`Creating button: ${text} at index ${index}`);
    const btn = createButton(text);

    btn.addEventListener('click', async () => {
      console.log(`Button clicked: ${text} at index ${index}`);

      pickForm.innerHTML = ''; // Clear UI on every button press

      if (index === 0) {
        // Add New Pick button
        if (activeAdminBtn !== btn) {
          resetSportSelectorState();
        }
        try {
          await loadSports(pickForm);
          setActiveAdminButton(btn);
          console.log('loadSports() completed successfully');
        } catch (error) {
          console.error('Error in loadSports():', error);
        }
      } else if (index === 2) {
        // Stats button
        try {
          await loadAdminStats(pickForm);
          setActiveAdminButton(btn);
          console.log('loadAdminStats() completed successfully');
        } catch (error) {
          console.error('Error in loadAdminStats():', error);
        }
      } else if (index === 3) {
        // Refresh All button — clears and reloads stats dynamically
        try {
          await loadAdminStats(pickForm);
          setActiveAdminButton(btn);
          console.log('Admin UI refreshed: stats loaded');
        } catch (error) {
          console.error('Error refreshing admin UI:', error);
        }
      } else if (index === 4) {
        // Code {} button with password prompt
        const enteredCode = prompt('Enter Code to Continue:');
        console.log(`Code entered: ${enteredCode}`);
        if (enteredCode === SUPERADMIN_CODE) {
          pickForm.style.color = '#444';
          pickForm.innerHTML = `<p>${message}</p>`;
          setActiveAdminButton(btn);
          console.log('Access granted, message displayed');
        } else {
          pickForm.style.color = 'red';
          pickForm.innerHTML = `<p>Access Denied - The Code entered is incorrect.</p>`;
          console.warn('Access denied due to incorrect code');
          // Do NOT change active button on failed access
        }
      } else {
        // Other buttons (e.g., Update Win/Loss)
        pickForm.style.color = '#444';
        pickForm.innerHTML = `<p>${message}</p>`;
        setActiveAdminButton(btn);
        console.log('Placeholder message displayed');
      }
    });

    adminButtonsContainer.appendChild(btn);
  });

  console.log('All buttons created and appended');

  try {
    await loadAdminStats(pickForm);
    setActiveAdminButton(null); // No active button on initial load
    console.log('Initial loadAdminStats() call completed');
  } catch (error) {
    console.error('Error during initial loadAdminStats() call:', error);
  }
}

/**
 * Set the given button as active, and remove active styles from previous button
 * @param {HTMLElement|null} btn 
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
