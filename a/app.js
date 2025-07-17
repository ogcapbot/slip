import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  const accessCodeInput = document.getElementById('accessCodeInput');
  const accessCodeButton = document.getElementById('accessCodeButton');
  const errorMessage = document.getElementById('errorMessage');
  const searchInput = document.getElementById('searchInput');
  const eventsContainer = document.getElementById('eventsContainer');
  const loginSection = document.getElementById('login');
  const appSection = document.getElementById('mainApp');

  const modal = document.getElementById('eventModal');
  const modalImage = document.getElementById('modalImage');
  const modalTeamName = document.getElementById('modalTeamName');
  const closeModal = document.getElementById('closeModal');

  let allEvents = [];

  accessCodeButton.addEventListener('click', async () => {
    const inputCode = accessCodeInput.value.trim();
    if (!inputCode) return;

    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('accessCode', '==', inputCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      errorMessage.textContent = '❌ Invalid access code.';
      return;
    }

    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    errorMessage.textContent = '';

    const eventSnap = await getDocs(collection(db, 'event_data'));
    allEvents = eventSnap.docs.map(doc => doc.data());
  });

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase().trim();
    if (!term) {
      eventsContainer.innerHTML = '';
      return;
    }

    const filtered = allEvents.filter(event =>
      event.event_home_team_name.toLowerCase().includes(term) ||
      event.event_away_team_name.toLowerCase().includes(term)
    );

    renderEvents(filtered);
  });

  function renderEvents(events) {
    eventsContainer.innerHTML = '';

    events.forEach(event => {
      const card = document.createElement('div');
      card.className = 'event-card';

      const thumbWrapper = document.createElement('div');
      thumbWrapper.className = 'event-thumb-wrapper';

      const img = document.createElement('img');
      img.src = event.event_img_thumb;
      img.className = 'event-thumb';
      thumbWrapper.appendChild(img);

      // Left/right click zones
      const left = document.createElement('div');
      const right = document.createElement('div');
      left.className = 'click-zone left';
      right.className = 'click-zone right';

      left.addEventListener('click', () =>
        openModal(event.event_img_thumb, event.event_home_team_name)
      );
      right.addEventListener('click', () =>
        openModal(event.event_img_thumb, event.event_away_team_name)
      );

      thumbWrapper.appendChild(left);
      thumbWrapper.appendChild(right);

      const labels = document.createElement('div');
      labels.className = 'team-labels';
      labels.innerHTML = `
        <div>${event.event_home_team_name}</div>
        <div>${event.event_away_team_name}</div>
      `;

      const details = document.createElement('div');
      details.className = 'event-details';
      details.innerHTML = `
        <div class="details-left">
          <div>${event.event_sport_name}</div>
          <img src="${event.event_img_league_badge}" class="event-league-badge" />
        </div>
        <div class="details-right">
          <p><strong>Date:</strong> ${new Date(event.event_timestamp_est).toLocaleString()}</p>
          <p><strong>Venue:</strong> ${event.event_venue || 'N/A'}</p>
          <p><strong>League:</strong> ${event.event_league_name_short || 'N/A'}</p>
          <p><strong>Match:</strong> ${event.event_home_team_name} vs ${event.event_away_team_name}</p>
        </div>
      `;

      card.appendChild(thumbWrapper);
      card.appendChild(labels);
      card.appendChild(details);

      eventsContainer.appendChild(card);
    });
  }

  function openModal(imageUrl, teamName) {
    modalImage.src = imageUrl;
    modalTeamName.textContent = teamName;
    modal.classList.remove('hidden');
  }

  closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    modalImage.src = '';
    modalTeamName.textContent = '';
  });
});
