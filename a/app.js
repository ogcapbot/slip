import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
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
    document.querySelector('h1').textContent = `🎉 Welcome, ${querySnapshot.docs[0].data().userDisplayname}! Search Events Below`;
    accessCodeInput.classList.add('hidden');
    accessCodeButton.classList.add('hidden');
    searchContainer.classList.remove('hidden');

    loadEvents();
  });

  async function loadEvents() {
    const eventRef = collection(db, 'event_data');
    const snapshot = await getDocs(eventRef);
    const events = snapshot.docs.map(doc => doc.data());

    renderEvents(events);

    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase();
      const filtered = events.filter(event =>
        event.event_home_team_name.toLowerCase().includes(term) ||
        event.event_away_team_name.toLowerCase().includes(term)
      );
      renderEvents(filtered);
    });
  }

  function renderEvents(events) {
    eventsContainer.innerHTML = '';

    events.forEach(event => {
      const card = document.createElement('div');
      card.classList.add('event-card');

      card.innerHTML = `
        <div class="event-thumb-wrapper">
          <div class="click-zone left">
            <img src="${event.event_img_thumb}" alt="thumb" class="event-thumb"/>
          </div>
          <div class="click-zone right">
            <img src="${event.event_img_thumb}" alt="thumb" class="event-thumb"/>
          </div>
        </div>
        <div class="event-team-names">
          <div>${event.event_home_team_name}</div>
          <div>${event.event_away_team_name}</div>
        </div>
        <div class="event-details">
          <div class="event-left">
            <div>${event.event_sport_name}</div>
            <img src="${event.event_img_league_badge}" class="event-league-badge" alt="league" />
          </div>
          <div class="event-right">
            <p><strong>Date:</strong> ${new Date(event.event_expire_at).toLocaleString()}</p>
            <p><strong>Venue:</strong> ${event.event_venue || 'Unknown'}</p>
            <p><strong>League:</strong> ${event.event_league_name_short_alt || 'N/A'}</p>
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
