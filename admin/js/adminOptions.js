import { loadAdminStats } from './adminStats.js';
import { loadSports, resetSportSelectorState } from './sportSelector.js';
import { loadUpdateWinLoss } from './updateWinloss.js';

const adminSection = document.getElementById('adminSection');
const adminButtonsContainer = document.getElementById('adminButtonsContainer');
const pickForm = document.getElementById('pickForm');

const SUPERADMIN_CODE = 'super123';

let activeAdminBtn = null;
let statsBtn = null;

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
    { text: 'Refresh All', message: 'Refreshing all data...' },
    { text: 'Code {}', message: 'Coming Soon... Code {}' },
    { text: 'Settings', message: 'Coming Soon... Settings' },
  ];

  buttons.forEach(({ text, message }, index) => {
    console.log(`Creating button: ${text} at index ${index}`);
    const btn = createButton(text);

    if (index === 2) {
      statsBtn = btn;
    }

    btn.addEventListener('click', async () => {
      console.log(`Button clicked: ${text} at index ${index}`);

      // Reset color on every button click except password fail case
      pickForm.style.color = '#444';
      pickForm.innerHTML = '';

      if (index === 4 || index === 5) {  // Code {} and Settings require password
        const enteredCode = prompt('Enter Code to Continue:');
        console.log(`Code entered: ${enteredCode}`);
        if (enteredCode === SUPERADMIN_CODE) {
          pickForm.innerHTML = `<p>${message}</p>`;
          setActiveAdminButton(btn);
          console.log('Access granted, message displayed');
        } else {
          pickForm.style.color = 'red';
          pickForm.innerHTML = `<p>Access Denied - The Code entered is incorrect.</p>`;
          console.warn('Access denied due to incorrect code');
          return;  // Do NOT change active button on fail
        }
        return;
      }

      if (index === 3) {  // Refresh All no password, reload stats & set Stats active
        try {
          await loadAdminStats(pickForm);
          setActiveAdminButton(statsBtn);
          console.log('Admin UI refreshed: stats loaded, Stats button set active');
        } catch (error) {
          console.error('Error refreshing admin UI:', error);
        }
        return;
      }

      if (index === 0) {  // Add New Pick - reset sport selector state before loading sports and show summary
        if (activeAdminBtn !== btn) {
          resetSportSelectorState();
        }

        // Set the pickForm innerHTML including summary and containers for selectors
        pickForm.innerHTML = `
          <h3>Official Pick Summary</h3>
          <p id="summarySport">Sport: Not Selected</p>
          <p id="summaryLeague">League: Not Selected</p>
          <p id="summaryGame">Game: Not Selected</p>
          <p id="summaryTeam">Team: Not Selected</p>
          <p id="summaryWager">Wager: Not Selected</p>
          <p id="summaryUnit">Unit: Not Selected</p>
          <p id="summaryPickDesc">Pick Desc: N/A</p>
          <p id="summaryNotes">Notes: Not Entered</p>
          <p id="summaryPhrase">Phrase: Not Selected</p>
          <hr>
          <div id="sportSelectorContainer"></div>
          <div id="leagueSelectorContainer" style="display:none;"></div>
        `;

        // Now that sportSelectorContainer is in DOM, get reference and load sports into it
        const sportSelectorContainer = document.getElementById('sportSelectorContainer');
        await loadSports(sportSelectorContainer);

        setActiveAdminButton(btn);
        console.log('Initialized Add New Pick with dynamic summary and loaded sports');
        return;
      }

      if (index === 1) {  // Update Win/Loss button
        try {
          await loadUpdateWinLoss(pickForm);
          setActiveAdminButton(btn);
          console.log('loadUpdateWinLoss() completed successfully');
        } catch (error) {
          console.error('Error in loadUpdateWinLoss():', error);
        }
        return;
      }

      if (index === 2) {  // Stats button
        try {
          await loadAdminStats(pickForm);
          setActiveAdminButton(btn);
          console.log('loadAdminStats() completed successfully');
        } catch (error) {
          console.error('Error in loadAdminStats():', error);
        }
        return;
      }

      // All other buttons
      pickForm.innerHTML = `<p>${message}</p>`;
      setActiveAdminButton(btn);
      console.log('Placeholder message displayed');
    });

    adminButtonsContainer.appendChild(btn);
  });

  console.log('All buttons created and appended');

  try {
    await loadAdminStats(pickForm);
    setActiveAdminButton(statsBtn);
    console.log('Initial loadAdminStats() call completed, Stats button set active');
  } catch (error) {
    console.error('Error during initial loadAdminStats() call:', error);
  }
}

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
