document.addEventListener('DOMContentLoaded', () => {
  const accessSection = document.getElementById('access-section');
  const searchSection = document.getElementById('search-section');
  const accessCodeInput = document.getElementById('access-code');
  const submitCodeBtn = document.getElementById('submit-code');
  const accessMsg = document.getElementById('access-message');
  const teamSearchInput = document.getElementById('team-search');
  const resultsContainer = document.getElementById('results');

  // 🔐 Validate Access Code
  submitCodeBtn.addEventListener('click', async () => {
    const code = accessCodeInput.value.trim();

    if (!code) {
      accessMsg.textContent = 'Please enter a code.';
      return;
    }

    try {
      const snapshot = await db.collection('Users')
        .where('accessCode', '==', code)
        .get();

      if (snapshot.empty) {
        accessMsg.textContent = 'Invalid access code ❌';
      } else {
        accessSection.classList.add('hidden');
        searchSection.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      accessMsg.textContent = 'Error checking access code.';
    }
  });

  // 🔍 Team Search Logic
  teamSearchInput.addEventListener('input', async () => {
    const query = teamSearchInput.value.trim().toLowerCase();
    resultsContainer.innerHTML = '';

    if (query.length < 2) return;

    try {
      const snapshot = await db.collection('event_data').get();
      const results = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const home = data.event_home_team_name?.toLowerCase();
        const away = data.event_away_team_name?.toLowerCase();

        if (home?.includes(query) || away?.includes(query)) {
          results.push(data);
        }
      });

      if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No matching teams found.</p>';
        return;
      }

      results.forEach(event => {
        const estTime = event.event_timestamp_est
          ? new Date(event.event_timestamp_est).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            })
          : 'Unknown';

        const div = document.createElement('div');
        div.className = 'team-card';
        div.innerHTML = `
          <img src="${event.event_img_thumb}" alt="Thumb" />
          <div>
            <h4>${event.event_name_long}</h4>
            <p><strong>When:</strong> ${estTime}</p>
            <p><strong>Venue:</strong> ${event.event_venue || 'N/A'}, ${event.event_country || ''}</p>
            <p><strong>Sport:</strong> ${event.event_sport_name || 'N/A'} | <strong>League:</strong> ${event.event_league_name_short || ''}</p>
          </div>
          <img src="${event.event_img_league_badge}" alt="Badge" />
        `;
        resultsContainer.appendChild(div);
      });

    } catch (err) {
      console.error('Error fetching events:', err);
      resultsContainer.innerHTML = '<p>Error loading results.</p>';
    }
  });
});
