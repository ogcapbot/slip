// adminOptions.js

const mainContent = document.getElementById('mainContent');

/**
 * Shows the admin options UI for the logged-in user.
 * @param {Object} user - User object containing user info (e.g. displayName, accessType)
 */
export function showAdminOptions(user) {
  console.log("[adminOptions] Showing admin options for user:", user);

  mainContent.innerHTML = '';

  // Create admin buttons container
  const adminBtnContainer = document.createElement('div');
  adminBtnContainer.style.display = 'grid';
  adminBtnContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  adminBtnContainer.style.gap = '10px';
  adminBtnContainer.style.maxWidth = '400px';
  adminBtnContainer.style.margin = '0 auto 20px auto';

  // Buttons list
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

  // Welcome message
  const welcomeMessage = document.createElement('div');
  welcomeMessage.id = 'welcomeMessage';
  welcomeMessage.style.marginTop = '10px';
  welcomeMessage.style.fontSize = '14px';
  welcomeMessage.style.fontWeight = 'bold';
  welcomeMessage.style.textAlign = 'center';
  welcomeMessage.textContent = `Welcome, ${user.displayName || 'User'}!`;
  mainContent.appendChild(welcomeMessage);

  // Store accessType locally
  const userAccessType = user.accessType || 'User';

  // Button handlers
  document.getElementById('btnAddNew').addEventListener('click', async () => {
    console.log('[adminOptions] "Add New" clicked');
    // Your logic here (e.g., call renderSportSelector)
    welcomeMessage.textContent = '';
    setActiveButton('btnAddNew');
  });

  ['btnWinLoss', 'btnStats', 'btnCode', 'btnSettings'].forEach(buttonId => {
    document.getElementById(buttonId).addEventListener('click', () => {
      console.log(`[adminOptions] "${buttonId}" clicked.`);
      if (userAccessType !== 'SuperAdmin') {
        alert("Access Denied");
      } else {
        welcomeMessage.textContent = `${buttonId.replace('btn', '')} Button Pressed`;
      }
      setActiveButton(buttonId);
    });
  });

  document.getElementById('btnStartOver').addEventListener('click', () => {
    console.log('[adminOptions] "Start Over" clicked');
    window.location.reload();
  });

  // Active button tracking
  let activeButtonId = null;
  function setActiveButton(buttonId) {
    if (activeButtonId) {
      document.getElementById(activeButtonId).style.backgroundColor = '#007bff';
    }
    document.getElementById(buttonId).style.b
