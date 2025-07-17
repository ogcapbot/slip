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
  const searchContainer = document.getElementById('searchContainer');
  const searchInput = document.getElementById('searchInput');
  const eventsContainer = document.getElementById('eventsContainer');
  const modal = document.getElementById('eventModal');
  const modalImage = document.getElementById('modalImage');
  const modalTeamName = document.getElementById('modalTeamName');
  const closeModal = document.getElementById('closeModal');

  let allEvents = [];

  accessCodeButton.addEventListener('click', async () => {
    const code = accessCodeInput.value.trim();
    if (!code) return;

    const q = query(collection(db, 'Users'), where('accessCode', '==', code));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      errorMessage.textContent = 'Invalid access code.';
      return;
    }

    const user = snapshot.docs[0].data();
    document.querySelector('h1').textContent = `🎉 Welcome, ${user.userDisplayname}! Search Events Below`;

    accessCodeInput.classList.add('hidden');
    accessCodeButton.classList.add('hidden');
    errorMessage.textContent = '';
    searchContainer.classList.remove('hidden');

    const eventSnap = await getDocs(collection(db, 'event_data'));
    allEvents = eventSnap.docs.map(doc => doc.data());
  });

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase().trim();
    const filtered = allEvents.filter(e =>
      e.event_home_team_name.toLowerCase().includes(term) ||
      e.event_away_team_name.toLowerCase().includes(term)
    );

    renderEvents(filtered);
  });

  function renderEvents(events) {
    eventsContainer.innerHTML = '';
    eventsContainer.classList.toggle('hidden', events.length === 0);

    events.forEach(event => {
      const card = document.createElement('div');
      card.classList.add('event-card');

      card.innerHTML = `
        <div class="event-thumb-wrapper">
          <img src="${event.event_img_thumb}" class="event-thumb" alt="Event" />
          <div class="click-zone left"></div>
          <div class="click-zone right"></div>
        </div>
        <div class="event-team-names">
          <div>${event.event_home_team_name}</div>
          <div>${event.event_away_team_name}</div>
        </div>
        <div class="event-details">
          <div class="event-left">
            <div>${event.event_sport_name}</div>
            <img src="${event.event_img_league_badge}" class="event-league-badge" />
          </div>
          <div class="event-right">
            <p><strong>Date:</strong> ${new Date(event.event_expire_at).toLocaleString()}</p>
            <p><strong>Venue:</strong> ${event.event_venue || 'N/A'}</p>
            <p><strong>League:</strong> ${event.event_league_name_short || 'N/A'}</p>
            <p><strong>Match:</strong> ${event.event_home_team_name} vs ${event.event_away_team_name}</p>
          </div>
        </div>
      `;

      card.querySelector('.click-zone.left').addEventListener('click', () => {
        openModal(event.event_img_thumb, event.event_home_team_name);
      });

      card.querySelector('.click-zone.right').addEventListener('click', () => {
        openModal(event.event_img_thumb, event.event_away_team_name);
      });

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
