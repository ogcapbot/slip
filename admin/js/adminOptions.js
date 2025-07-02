// adminOptions.js
// Responsible for rendering the admin panel buttons and managing their interactions.
// Controls loading of different admin functions: Add New Pick, Update Win/Loss, Stats, etc.

// Imports relevant modules for loading different parts of the admin UI
import { loadAdminStats } from './adminStats.js';
import { loadSports, resetSportSelectorState } from './sportSelector.js';
import { loadUpdateWinLoss } from './updateWinloss.js';

// Cache key DOM elements for reuse
const adminSection = document.getElementById('adminSection');
const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');

const SUPERADMIN_CODE = 'super123';  // Password for admin restricted sections

let activeAdminBtn = null;
let statsBtn = null;

/**
 * Initializes and loads all admin option buttons.
 * Adds event listeners for each button to handle clicks and load relevant content.
 */
export async function loadAdminOptions() {
  console.log('[adminOptions.js:27] loadAdminOptions called');

  adminSection.style.display = 'block';
  adminButtonsContainer.innerHTML = '';
  pickForm.style.display = 'block';
  pickForm.innerHTML = '';

  const buttons = [
    { text: 'Add New Pick', message: '' },
    { text: 'Update Win/Loss', message: 'Coming Soon... Win/Loss' },
    { text: 'Stats', message: 'Stats' },
    { text: 'Refresh All', message: 'Refreshing all data...' },
    { text: 'Code {}', message: 'Coming Soon... Code {}' },
    { text: 'Settings', message: 'Coming Soon... Settings' },
  ];

  buttons.forEach(({ text, message }, index) => {
    console.log(`[adminOptions.js:41] Creating button: ${text} at index ${index}`);
    const btn = createButton(text);

    if (index === 2) {
      statsBtn = btn;
    }

    btn.addEventListener('click', async () => {
      console.log(`[adminOptions.js:48] Button clicked: ${text} at index ${index}`);

      // Reset pickForm style and clear content on every button click
      pickForm.style.color = '#444';
      pickForm.innerHTML = '';

      // Password protected buttons (Code {} and Settings)
      if (index === 4 || index === 5) {
        const enteredCode = prompt('Enter Code to Continue:');
        console.log(`[adminOptions.js:57] Code entered: ${enteredCode}`);
        if (enteredCode === SUPERADMIN_CODE) {
          pickForm.innerHTML = `<p>${message}</p>`;
          setActiveAdminButton(btn);
          console.log('[adminOptions.js:61] Access granted, message displayed');
        } else {
          pickForm.style.color = 'red';
          pickForm.innerHTML = `<p>Access Denied - The Code entered is incorrect.</p>`;
          console.warn('[adminOptions.js:66] Access denied due to incorrect code');
          return;  // Do NOT change active button on failure
        }
        return;
      }

      // Refresh All: reload stats, no password required
      if (index === 3) {
        try {
          await loadAdminStats(pickForm);
          setActiveAdminButton(statsBtn);
          console.log('[adminOptions.js:77] Admin UI refreshed: stats loaded, Stats button set active');
        } catch (error) {
          console.error('[adminOptions.js:80] Error refreshing admin UI:', error);
        }
        return;
      }

      // Add New Pick: reset sport selector state and load sports buttons
      if (index === 0) {
        if (activeAdminBtn !== btn) {
          resetSportSelectorState();
        }
        try {
          await loadSports(pickForm);
          setActiveAdminButton(btn);
          console.log('[adminOptions.js:93] loadSports() completed successfully');
        } catch (error) {
          console.error('[adminOptions.js:96] Error in loadSports():', error);
        }
        return;
      }

      // Update Win/Loss: load update interface
      if (index === 1) {
        try {
          await loadUpdateWinLoss(pickForm);
          setActiveAdminButton(btn);
          console.log('[adminOptions.js:106] loadUpdateWinLoss() completed successfully');
        } catch (error) {
          console.error('[adminOptions.js:109] Error in loadUpdateWinLoss():', error);
        }
        return;
      }

      // Stats button: load stats interface
      if (index === 2) {
        try {
          await loadAdminStats(pickForm);
          setActiveAdminButton(btn);
          console.log('[adminOptions.js:118] loadAdminStats() completed successfully');
        } catch (error) {
          console.error('[adminOptions.js:121] Error in loadAdminStats():', error);
        }
        return;
      }

      // Default placeholder for any other buttons
      pickForm.innerHTML = `<p>${message}</p>`;
      setActiveAdminButton(btn);
      console.log('[adminOptions.js:128] Placeholder message displayed');
    });

    adminButtonsContainer.appendChild(btn);
  });

  console.log('[adminOptions.js:134] All buttons created and appended');

  // Load initial stats display and set stats button as active
  try {
    await loadAdminStats(pickForm);
    setActiveAdminButton(statsBtn);
    console.log('[adminOptions.js:140] Initial loadAdminStats() call completed, Stats button set active');
  } catch (error) {
    console.error('[adminOptions.js:143] Error during initial loadAdminStats() call:', error);
  }
}

/**
 * Sets the currently active admin button's visual state.
 * Removes 'green' and 'pressed' classes from previously active button.
 * Adds these classes to the newly active button.
 * @param {HTMLElement} btn - The button to activate.
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

/**
 * Creates a styled button element with consistent UI styles.
 * @param {string} text - The text content of the button.
 * @returns {HTMLButtonElement} The created button element.
 */
function createButton(text) {
  console.log(`[adminOptions.js:164] createButton called with text: ${text}`);
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
