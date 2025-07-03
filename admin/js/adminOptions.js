// admin/js/adminOptions.js

export function displayAdminOptions(userData) {
  const adminSection = document.getElementById('adminSection');
  adminSection.innerHTML = `
    <p>Hello ${userData.userName || 'User'}</p>
    <p>Access Level: ${userData.accessType || 'N/A'}</p>
    <p>Display Name: ${userData.displayName || 'N/A'}</p>
  `;
}
