// auth.js
// Manages user login, roles, and access control

const Auth = (() => {
  const USERS = {
    'superuser123': { role: 'superuser', name: 'Super User' },
    'admin456': { role: 'admin', name: 'Admin User' },
    'user789': { role: 'user', name: 'Regular User' }
    // Ideally, fetch this securely from server or API in real app
  };

  let currentUser = null;

  function login(accessCode) {
    if (USERS[accessCode]) {
      currentUser = USERS[accessCode];
      sessionStorage.setItem('ogUser', JSON.stringify(currentUser));
      return currentUser;
    } else {
      return null;
    }
  }

  function logout() {
    currentUser = null;
    sessionStorage.removeItem('ogUser');
  }

  function getCurrentUser() {
    if (!currentUser) {
      const saved = sessionStorage.getItem('ogUser');
      if (saved) {
        currentUser = JSON.parse(saved);
      }
    }
    return currentUser;
  }

  function isSuperUser() {
    return currentUser && currentUser.role === 'superuser';
  }

  function isAdmin() {
    return currentUser && (currentUser.role === 'admin' || currentUser.role === 'superuser');
  }

  function isUser() {
    return currentUser && currentUser.role === 'user';
  }

  return {
    login,
    logout,
    getCurrentUser,
    isSuperUser,
    isAdmin,
    isUser
  };
})();
