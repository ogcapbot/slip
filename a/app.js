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
    const inputCode = accessCodeInput.value.trim();
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('accessCode', '==', inputCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      errorMessage.textContent = 'Error checking code.';
      return;
    }

    errorMessage.textContent = '';
    const displayName = querySnapshot.docs[0].data().userDisplayname;
    document.querySelector('h1').textContent = `🎉 Welcome, ${displayName}! Search Events Below`;
    accessCodeInput.classList.add('hidden');
    accessCodeButton.classList.add('hidden');
    searchContainer.classList.remove('hidden');

    await fetchEvents();
  });

  async function fetchEvents() {
    const snapshot = await getDocs(collection(db, 'event_data'));
    allEvents = snapshot.docs.map(doc => doc.data());
  }

  function renderEvents(events) {
    eventsContainer.innerHTML = '';
    if (events.length === 0) {
      eventsContainer.classList.add('hidden');
      return;
    }

    eventsContainer.classList.remove('hidden');

    events.forEach(event => {
      const card = document.createElement('div');
      card.classList.add('event-card');

      card.innerHTML = `
        <div class="event-thumb-wrapper">
          <div class="click-zone left">
            <img src="${event.event_img_thumb}" class="event-thumb" />
          </div>
          <div class="click-zone right">
            <img src="${event.event_img_thumb}" class="event-thumb" />
          </div>
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
            <p><strong>Venue:</strong> ${event.event_venue || 'Unknown'}</p>
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

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    if (!term) {
      eventsContainer.classList.add('hidden');
      eventsContainer.innerHTML = '';
      return;
    }

    const filtered = allEvents.filter(event =>
      event.event_home_team_name.toLowerCase().includes(term) ||
      event.event_away_team_name.toLowerCase().includes(term)
    );
    renderEvents(filtered);
  });

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
