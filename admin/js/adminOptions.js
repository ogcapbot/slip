// admin/js/adminOptions.js
export function showAdminOptions(user) {
  let adminSection = document.getElementById('adminSection');

  if (!adminSection) {
    adminSection = document.createElement('section');
    adminSection.id = 'adminSection';
    document.body.insertBefore(adminSection, document.querySelector('footer'));
  }

  adminSection.style.display = 'block';
  adminSection.innerHTML = `
    <p>Hello ${user.userName || 'User'}</p>
    <p>Access Level: ${user.accessType || 'N/A'}</p>
    <p>Display Name: ${user.userDisplayname || 'N/A'}</p>
  `;
}
