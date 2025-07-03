// adminOptions.js

import { renderSportSelector } from './sportSelector.js';

const mainContent = document.getElementById('mainContent');

export function initAdminOptions() {
  console.log("[adminOptions] Starting to render admin options UI...");

  // Clear main content
  mainContent.innerHTML = '';

  // Create admin buttons container
  const adminBtnContainer = document.createElement('div');
  adminBtnContainer.style.display = 'grid';
  adminBtnContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  adminBtnContainer.style.gap = '10px';
  adminBtnContainer.style.maxWidth = '400px';
  adminBtnContainer.style.margin = '0 auto 20px auto';

  // Define buttons
  const buttons = [
    { id: 'btnAddNew', label: 'Add New' },
    { id: 'btnWinLoss', label: 'Win/Loss' },
    { id: 'btnStats', label: 'Stats' },
    { id: 'btnStartOver', label: 'Start Over' },
    { id: 'btnCode', label: 'Code{}' },
    { id: 'btnSettings', label: 'Settings' }
  ];

  buttons.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.id = id;
    btn.textContent = label;
    btn.className = 'admin-button';
    btn.style.height = '45px';
    btn.style.fontSize = '11px';
    adminBtnContainer.appendChild(btn);
  });

  mainContent.appendChild(adminBtnContainer);

  // Welcome message area
  const welcomeMessage = document.createElement('div');
  welcomeMessage.id = 'welcomeMessage';
  welcomeMessage.style.marginTop = '10px';
  welcomeMessage.style.fontSize = '14px';
  welcomeMessage.style.fontWeight = 'bold';
  welcomeMessage.style.textAlign = 'center';
  welcomeMessage.textContent = 'Welcome to the Admin Panel!';
  mainContent.appendChild(welcomeMessage);

  // Event handlers
  document.getElementById('btnAddNew').addEventListener('click', async () => {
    console.log('[adminOptions] "Add New" button clicked.');
    try {
      await renderSportSelector();
      welcomeMessage.textContent = '';
    } catch (error) {
      console.error('[adminOptions] Error loading sportSelector:', error);
      mainContent.textContent = "Failed to load sport selector.";
    }
    setActiveButton('btnAddNew');
  });

  // Dummy accessType for demo
  const userAccessType = window.currentUserAccessType || 'User';

  ['btnWinLoss', 'btnStats', 'btnCode', 'btnSettings'].forEach(buttonId => {
    document.getElementById(buttonId).addEventListener('click', () => {
      console.log(`[adminOptions] "${buttonId.replace('btn','')}" button clicked.`);
      if (userAccessType !== 'SuperAdmin') {
        alert("Access Denied");
      } else {
        welcomeMessage.textContent = `${buttonId.replace('btn','')} Button Pressed`;
      }
      setActiveButton(buttonId);
    });
  });

  document.getElementById('btnStartOver').addEventListener('click', () => {
    console.log('[adminOptions] "Start Over" button clicked.');
    window.location.reload();
  });

  // Active button management
  let activeButtonId = null;
  function setActiveButton(buttonId) {
    if (activeButtonId) {
      document.getElementById(activeButtonId).style.backgroundColor = '#007bff';
    }
    document.getElementById(buttonId).style.backgroundColor = '#28a745'; // green
    activeButtonId = buttonId;
  }

  console.log("[adminOptions] Admin options UI rendered successfully.");
}
