// admin/js/adminOptions.js

export function displayAdminOptions(userData) {
  const adminContent = document.getElementById('adminContent');
  const userName = userData.userName || 'Unknown User';
  const accessType = userData.accessType || 'Unknown Access Level';
  const displayName = userData.displayName || 'No Display Name';

  adminContent.innerHTML = `
    <p>Hello <strong>${userName}</strong></p>
    <p>Access Level: <strong>${accessType}</strong></p>
    <p>Display Name: <strong>${displayName}</strong></p>
  `;
}
