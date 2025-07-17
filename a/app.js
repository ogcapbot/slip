document.addEventListener('DOMContentLoaded', () => {
  const accessSection = document.getElementById('access-section');
  const searchSection = document.getElementById('search-section');
  const accessCodeInput = document.getElementById('access-code');
  const submitCodeBtn = document.getElementById('submit-code');
  const accessMsg = document.getElementById('access-message');
  const teamSearchInput = document.getElementById('team-search');
  const resultsContainer = document.getElementById('results');

  // Handle access code validation
  submitCodeBtn.addEventListener('click', async () => {
    const code = accessCodeInput.value.trim();

    if (!code) {
      accessMsg.textContent = 'Please enter a code.';
      return;
    }

    try {
      const snapshot = await db.collection('users').where('code', '==', code).get();

      if (snapshot.empty) {
        accessMsg.textContent = 'Invalid code ❌';
      } else {
        accessSection.classList.add('hidden');
        searchSection.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      accessMsg.textContent = 'Error checking code.';
    }
  });

  // Handle team search
  teamSearchInput.addEventListener('input', async () => {
    const query = teamSearchInput.value.trim().toLowerCase();

    resultsContainer.innerHTML = '';

    if (query.length < 2) return;

    try {
      const teamsSnapshot = await db.collection('teams')
        .where('searchName', '>=', query)
        .where('searchName', '<=', query + '\uf8ff')
        .get();

      if (teamsSnapshot.empty) {
        resultsContainer.innerHTML = '<p>No teams found.</p>';
        return;
      }

      teamsSnapshot.forEach(doc => {
        const team = doc.data();
        const div = document.createElement('div');
        div.className = 'team-card';
        div.innerHTML = `
          <img src="${team.thumbnail}" alt="${team.name}" />
          <h4>${team.name}</h4>
        `;
        resultsContainer.appendChild(div);
      });
    } catch (err) {
      console.error('Error searching teams:', err);
    }
  });
});
