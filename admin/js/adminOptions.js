import { AddNewWorkflow } from './addNew.js';
import { loadUpdateWinLoss } from './updateWinloss.js';
import { loadStatsForDay } from './adminStats.js';  // <-- Import your new stats module here

export function showAdminOptions(userData) {
  console.log("[adminOptions] Starting to render admin options UI...");

  const header = document.querySelector('header');
  const existingAdminOptions = document.getElementById('adminOptionsSection');
  if (existingAdminOptions) {
    console.log("[adminOptions] Existing adminOptionsSection found, removing it.");
    existingAdminOptions.remove();
  }

  const adminOptionsSection = document.createElement('section');
  adminOptionsSection.id = 'adminOptionsSection';

  const buttonGrid = document.createElement('div');
  buttonGrid.classList.add('button-grid');

  const buttons = [
    { label: 'Add New', accessRequired: false },
    { label: 'Win/Loss', accessRequired: true },
    { label: 'Stats', accessRequired: true },
    { label: 'Start Over', accessRequired: false },
    { label: 'Code{}', accessRequired: true },
    { label: 'Settings', accessRequired: true },
  ];

  let mainContent = document.getElementById('adminMainContent');
  if (!mainContent) {
    mainContent = document.createElement('div');
    mainContent.id = 'adminMainContent';
    // Append newly created mainContent to DOM (important!)
    header.appendChild(mainContent);
  }
  mainContent.innerHTML = '';
  mainContent.textContent = `Welcome, ${userData.userName || 'User'}! Ready to get started?`;

  let activeButton = null;

  buttons.forEach(btnConfig => {
    const btn = document.createElement('button');
    btn.textContent = btnConfig.label;
    btn.classList.add('admin-button');

    btn.addEventListener('click', () => {
      console.log(`[adminOptions] "${btnConfig.label}" button clicked.`);

      if (btnConfig.label === 'Start Over') {
        console.log("[adminOptions] Resetting UI on Start Over.");
        mainContent.textContent = `Welcome, ${userData.userName || 'User'}! Ready to get started?`;
        if (activeButton) {
          activeButton.classList.remove('active');
          activeButton = null;
        }
        return;
      }

      if (btnConfig.accessRequired && userData.accessType !== 'SuperAdmin') {
        console.warn(`[adminOptions] Access denied for user with accessType: ${userData.accessType}`);
        mainContent.textContent = 'Access Denied';
        return;
      }

      if (activeButton && activeButton !== btn) {
        activeButton.classList.remove('active');
      }
      btn.classList.add('active');
      activeButton = btn;

      if (btnConfig.label === 'Add New') {
        mainContent.innerHTML = '';
        const userId = userData.uid || 'anonymous';
        // Pass full userInfo object here
        const workflow = new AddNewWorkflow(mainContent, userId, {
          userName: userData.userName || 'unknown',
          userDisplayName: userData.displayName || '',
          accessCode: userData.accessCode || '',
          accessType: userData.accessType || '',
          loginCount: userData.loginCount || 0,
        });
        return;
      }

      if (btnConfig.label === 'Win/Loss') {
        mainContent.innerHTML = '';
        loadUpdateWinLoss(mainContent);
        return;
      }

      if (btnConfig.label === 'Stats') {
        mainContent.innerHTML = '';
        // Just call loadStatsForDay, it creates the statsContainer internally
        loadStatsForDay('today');
        return;
      }

      mainContent.textContent = `${btnConfig.label} Button Pressed`;
    });

    buttonGrid.appendChild(btn);
  });

  adminOptionsSection.appendChild(buttonGrid);
  adminOptionsSection.appendChild(mainContent);

  const userDisplayEl = [...header.querySelectorAll('p')].find(p => p.textContent.startsWith('User:'));
  if (userDisplayEl) {
    userDisplayEl.insertAdjacentElement('afterend', adminOptionsSection);
  } else {
    header.appendChild(adminOptionsSection);
  }

  console.log("[adminOptions] Admin options UI rendered successfully.");
}
