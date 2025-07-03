// admin/js/adminOptions.js

/**
 * Displays the admin options UI below the user display name.
 * Creates a 2-row x 3-column button grid with labeled buttons.
 * Shows a welcome message in the main content area.
 * Implements access control for some buttons.
 * 
 * @param {Object} userData - The logged-in user's data, including accessType and userName.
 */
export function showAdminOptions(userData) {
  console.log("[adminOptions] Starting to render admin options UI...");

  // Select header to insert below user display name
  const header = document.querySelector('header');

  // Remove existing adminOptions section if it exists, to avoid duplicates
  const existingAdminOptions = document.getElementById('adminOptionsSection');
  if (existingAdminOptions) {
    console.log("[adminOptions] Existing adminOptionsSection found, removing it.");
    existingAdminOptions.remove();
  }

  // Create main container section for admin options
  const adminOptionsSection = document.createElement('section');
  adminOptionsSection.id = 'adminOptionsSection';
  adminOptionsSection.style.marginTop = '15px';
  adminOptionsSection.style.fontFamily = "'Oswald', sans-serif";

  // Create button grid container
  const buttonGrid = document.createElement('div');
  buttonGrid.style.display = 'grid';
  buttonGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  buttonGrid.style.gridTemplateRows = 'repeat(2, 1fr)';
  buttonGrid.style.gap = '12px';
  buttonGrid.style.justifyItems = 'center';
  buttonGrid.style.alignItems = 'center';
  buttonGrid.style.marginBottom = '20px';

  // Button style shared settings
  const buttonStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'Oswald', sans-serif",
    fontSize: '1.1rem',
    height: '45px',
    width: '100%',  // full cell width
    padding: '0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    userSelect: 'none',
    whiteSpace: 'normal',  // allow multi-line text
    lineHeight: '1.1',     // tighter line spacing for 2 lines
  };

  // List of buttons and their access requirements and labels
  // If accessRequired is true, only SuperAdmin allowed
  const buttons = [
    { label: 'Add New', accessRequired: false },
    { label: 'Win/Loss', accessRequired: true },
    { label: 'Stats', accessRequired: true },
    { label: 'Start Over', accessRequired: false },
    { label: 'Code{}', accessRequired: true },
    { label: 'Settings', accessRequired: true },
  ];

  // Main content area below buttons (where messages appear)
  let mainContent = document.getElementById('adminMainContent');
  if (!mainContent) {
    mainContent = document.createElement('div');
    mainContent.id = 'adminMainContent';
    mainContent.style.fontFamily = "'Oswald', sans-serif";
    mainContent.style.fontSize = '1rem';
    mainContent.style.padding = '10px 20px';
    mainContent.style.border = '1px solid #ddd';
    mainContent.style.borderRadius = '6px';
    mainContent.style.minHeight = '100px';
    mainContent.style.backgroundColor = '#f9f9f9';
  } else {
    // Clear previous content
    mainContent.innerHTML = '';
  }

  // Show welcome message initially
  mainContent.textContent = `Welcome, ${userData.userName || 'User'}! Ready to get started?`;

  // Append button elements to grid
  buttons.forEach((btn) => {
    const button = document.createElement('button');
    button.textContent = btn.label;
    Object.assign(button.style, buttonStyle);

    // Click handler with access control
    button.addEventListener('click', () => {
      console.log(`[adminOptions] "${btn.label}" button clicked.`);

      // Handle Start Over button separately (no access restriction)
      if (btn.label === 'Start Over') {
        console.log("[adminOptions] Processing Start Over - resetting main content.");
        // Reset main content to welcome message, clear any stored inputs (if applicable)
        mainContent.textContent = `Welcome, ${userData.userName || 'User'}! Ready to get started?`;
        return;
      }

      // For other buttons, check accessType if accessRequired
      if (btn.accessRequired && userData.accessType !== 'SuperAdmin') {
        console.warn(`[adminOptions] Access denied for user type: ${userData.accessType}`);
        mainContent.textContent = 'Access Denied';
        return;
      }

      // Normal button pressed, update main content accordingly
      mainContent.textContent = `${btn.label} Button Pressed`;
    });

    buttonGrid.appendChild(button);
  });

  // Append grid and main content to adminOptionsSection
  adminOptionsSection.appendChild(buttonGrid);
  adminOptionsSection.appendChild(mainContent);

  // Insert adminOptionsSection just below the user display name in header
  // Find the user display element (assumed to be a <p> with gray text)
  const userDisplayEl = [...header.querySelectorAll('p')].find(p => p.textContent.startsWith('User:'));
  if (userDisplayEl) {
    userDisplayEl.insertAdjacentElement('afterend', adminOptionsSection);
  } else {
    // fallback append at the end of header
    header.appendChild(adminOptionsSection);
  }

  console.log("[adminOptions] Admin options UI rendered successfully.");
}
