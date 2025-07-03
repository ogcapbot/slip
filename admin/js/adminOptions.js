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

      if (index === 0) {  // Add New Pick - reset sport selector state before loading sports
        if (activeAdminBtn !== btn) {
          resetSportSelectorState();
        }
        // Show official pick summary section and then load sports into separate container
        const summaryHtml = `
          <h3>Official Pick Summary</h3>
          <div>Sport: Not Selected</div>
          <div>League: Not Selected</div>
          <div>Game: Not Selected</div>
          <div>Team: Not Selected</div>
          <div>Wager: Not Selected</div>
          <div>Unit: Not Selected</div>
          <div>Pick Desc: N/A</div>
          <div>Notes: Not Entered</div>
          <div>Phrase: Not Selected</div>
          <hr />
        `;
        pickForm.innerHTML = summaryHtml;

        // Create separate container for sport buttons below summary
        let sportContainer = document.getElementById('sportButtonsWrapper');
        if (!sportContainer) {
          sportContainer = document.createElement('div');
          sportContainer.id = 'sportButtonsWrapper';
          sportContainer.style.marginTop = '12px';
          pickForm.appendChild(sportContainer);
        } else {
          sportContainer.innerHTML = '';
        }

        try {
          await loadSports(sportContainer);
          setActiveAdminButton(btn);
          console.log('loadSports() completed successfully');
        } catch (error) {
          console.error('Error in loadSports():', error);
        }
        return;
      }

      if (index === 1) {  // Update Win/Loss button
        try {
          await loadUpdateWinLoss(pickForm);

          // Fix Win/Loss buttons style
          const winLossButtons = pickForm.querySelectorAll('button');
          winLossButtons.forEach(btn => {
            btn.style.display = 'inline-block';
            btn.style.margin = '4px 6px';
            btn.style.width = 'auto';
          });

          // Wrap Win/Loss output text in a container with line breaks and spacing
          const outputText = pickForm.querySelector('.winloss-output-text'); // Assuming output text has this class, adjust as needed
          if (outputText) {
            const wrapper = document.createElement('div');
            wrapper.style.whiteSpace = 'normal';
            wrapper.style.lineHeight = '1.4';
            wrapper.style.marginTop = '8px';
            wrapper.textContent = outputText.textContent;
            outputText.parentNode.replaceChild(wrapper, outputText);
          }

          setActiveAdminButton(btn);
          console.log('loadUpdateWinLoss() completed successfully with style fixes');
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
