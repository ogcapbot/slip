// main.js
// Handles page initialization, login screen, routing

import { Auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.container');
  const user = Auth.getCurrentUser();

  if (!user) {
    showLoginScreen(container);
  } else {
    showDashboard(container, user);
  }
});

function showLoginScreen(container) {
  container.innerHTML = `
    <div style="text-align:center; padding-top: 100px;">
      <h2>Login with Access Code</h2>
      <input type="text" id="accessCodeInput" placeholder="Enter Access Code" style="font-size:1.2rem; padding:10px; max-width:300px; width: 100%; margin-top:20px;">
      <button id="loginBtn" style="max-width: 300px; margin-top: 15px;">Login</button>
      <p id="loginError" style="color:red; font-weight:600; margin-top: 10px;"></p>
    </div>
  `;

  const loginBtn = document.getElementById('loginBtn');
  const accessCodeInput = document.getElementById('accessCodeInput');
  const loginError = document.getElementById('loginError');

  loginBtn.addEventListener('click', () => {
    const code = accessCodeInput.value.trim();
    const user = Auth.login(code);
    if (user) {
      showDashboard(container, user);
    } else {
      loginError.textContent = 'Invalid access code. Please try again.';
    }
  });

  accessCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
}

function showDashboard(container, user) {
  container.innerHTML = `
    <div>
      <h3>Welcome, ${user.name} (${user.role})</h3>
      <button id="logoutBtn" style="max-width: 120px;">Logout</button>
      <div id="appContent" style="margin-top: 20px;"></div>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    Auth.logout();
    location.reload();
  });

  // Load role-based UI here (data entry, reporting, config, etc)
  loadRoleUI(user.role);
}

function loadRoleUI(role) {
  const content = document.getElementById('appContent');
  switch (role) {
    case 'superuser':
      content.innerHTML = `<p>You have full access. (Placeholder for superuser dashboard)</p>`;
      break;
    case 'admin':
      content.innerHTML = `<p>You have admin access. (Placeholder for admin dashboard)</p>`;
      break;
    case 'user':
      content.innerHTML = `<p>You have user access. (Placeholder for user dashboard)</p>`;
      break;
    default:
      content.innerHTML = `<p>Unknown role.</p>`;
  }
}
