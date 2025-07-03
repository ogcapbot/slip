// admin/js/adminOptions.js

/**
 * Displays the admin options UI below the user display name.
 * Creates a 2-row x 3-column button grid with labeled buttons.
 * Shows a welcome message in the main content area.
 * Implements access control for some buttons.
 * Highlights the active button with a calm green color.
 * Resets UI on Start Over button click.
 * 
 * @param {Object} userData - The logged-in user's data, including accessType and userName.
 */
export function showAdminOptions(userData) {
  console.log("[adminOptions] Starting to render admin options UI...");

  // Select header to insert below user display name
  const header = document.querySelector('header');

  // Remove existing admin options if present to avoid duplicates
  const existingAdminOptions = document.getElementById('adminOptionsSection');
  if (existingAdminOptions) {
    console.log("[adminOptions] Existing adminOptionsSection found, removing it.");
    existingAdminOptions.remove();
  }

  // Create main container for admin options and apply ID for CSS targeting
  const adminOptionsSection = document.createElement('section');
  adminOptionsSection.id = 'adminOptionsSection';

  // Create button grid container and assign CSS class
  const buttonGrid = document.createElement('div');
  buttonGrid.classList.add('button-grid');

  // Define buttons with labels and access requirements
  const buttons = [
    { label: 'Add New', accessRequired: false },
    { label: 'Win/Loss', accessRequired: true },
    { label: 'Stats', accessRequired: true },
    { label: 'Start Over', accessRequired: false },
    { label: 'Code{}', accessRequired: true },
    { label: 'Settings', accessRequired: true },
  ];

  // Create or select main content area below buttons
  let mainContent = document.getElementById('adminMainContent');
  if (!mainContent) {
    mainContent = document.createElement('div');
    mainContent.id = 'adminMainContent';
  }
  // Reset main content styles are in CSS, just clear content here
  mainContent.innerHTML = '';
  mainContent.textContent = `Welcome, ${userData.userName || 'User'}! Ready to get started?`;

  // Track currently active button for toggling highlight
  let activeButton = null;

  // Create buttons with class and event listeners
  buttons.forEach(btnConfig => {
    const btn = document.createElement('button');
    btn.textContent = btnConfig.label;
    btn.classList.add('admin-button');

    btn.addEventListener('click', () => {
      console.log(`[adminOptions] "${btnConfig.label}" button clicked.`);

      // Handle Start Over separately - resets main content and clears button highlight
      if (btnConfig.label === 'Start Over') {
        console.log("[adminOptions] Resetting UI on Start Over.");

        mainContent.textContent = `Welcome, ${userData.userName || 'User'}! Ready to get started?`;

        if (activeButton) {
          activeButton.classList.remove('active');
          activeButton = null;
        }
        return;
      }

      // Access control for restricted buttons
      if (btnConfig.accessRequired && userData.accessType !== 'SuperAdmin') {
        console.warn(`[adminOptions] Access denied for user with accessType: ${userData.accessType}`);
        mainContent.textContent = 'Access Denied';
        return;
      }

      // Highlight clicked button, remove highlight from previous
      if (activeButton && activeButton !== btn) {
        activeButton.classList.remove('active');
      }
      btn.classList.add('active');
      activeButton = btn;

      // Show which button was pressed
      mainContent.textContent = `${btnConfig.label} Button Pressed`;
    });

    buttonGrid.appendChild(btn);
  });

  // Append button grid and main content to admin options container
  adminOptionsSection.appendChild(buttonGrid);
  adminOptionsSection.appendChild(mainContent);

  // Insert adminOptionsSection just below user display name paragraph
  const userDisplayEl = [...header.querySelectorAll('p')].find(p => p.textContent.startsWith('User:'));
  if (userDisplayEl) {
    userDisplayEl.insertAdjacentElement('afterend', adminOptionsSection);
  } else {
    header.appendChild(adminOptionsSection);
  }

  console.log("[adminOptions] Admin options UI rendered successfully.");
}
