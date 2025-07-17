import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const accessSection = document.getElementById('access-section');
const searchSection = document.getElementById('search-section');
const accessBtn = document.getElementById('access-btn');
const accessCodeInput = document.getElementById('access-code');
const accessError = document.getElementById('access-error');
const welcomeMessage = document.getElementById('welcome-message');
const teamSearchInput = document.getElementById('team-search');
const resultsContainer = document.getElementById('results');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalTeamName = document.getElementById('modal-team-name');
const closeModalBtn = document.getElementById('close-modal');
const sendBtn = document.getElementById('send-btn');

let userData = null;

// Access Code Verification
accessBtn.addEventListener('click', async () => {
  const accessCode = accessCodeInput.value.trim();
  accessError.classList.add('hidden');

  if (!accessCode) return;

  const usersRef = collection(db, 'Users');
  const q = query(usersRef, where('accessCode', '==', accessCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    accessError.classList.remove('hidden');
  } else {
    userData = snapshot.docs[0].data();
    welcomeMessage.textContent = `🎉 Welcome, ${userData.userDisplayname}! Search Events Below`;
    accessSection.classList.add('hidden');
    searchSection.classList.remove('hidden');
  }
});

// Search Events
teamSearchInput.addEventListener('input', async () => {
  const term = teamSearchInput.value.trim().toLowerCase();
  resultsContainer.innerHTML = '';

  if (term.length < 2) return;

  const eventsRef = collection(db, 'event_data');
  const snapshot = await getDocs(eventsRef);

  snapshot.forEach(doc => {
    const event = doc.data();
    const home = event.event_home_team_name?.toLowerCase();
    const away = event.event_away_team_name?.toLowerCase();

    if (home.includes(term) || away.includes(term)) {
      const card = document.createElement('div');
      card.className = 'event-card';

      card.innerHTML = `
        <div class="image-container">
          <img src="${event.event_img_thumb}" alt="Event Thumb" />
          <div class="click-zone left" data-team="${event.event_home_team_name}" data-thumb="${event.event_img_thumb}"></div>
          <div class="click-zone right" data-team="${event.event_away_team_name}" data-thumb="${event.event_img_thumb}"></div>
        </div>
        <div class="team-names">
          <div class="home-name">${event.event_home_team_name}</div>
          <div class="away-name">${event.event_away_team_name}</div>
        </div>
        <div class="event-details">
          <div class="details-left">
            <div>${event.event_sport_name}</div>
            <img src="${event.event_img_league_badge}" alt="League Badge" style="width: 40px; height: 40px; margin-top: 0.5rem;" />
          </div>
          <div class="details-right">
            <p><strong>Date:</strong> ${new Date(event.event_timestamp_est).toLocaleString()}</p>
            <p><strong>Venue:</strong> ${event.event_venue}, ${event.event_country}</p>
            <p><strong>League:</strong> ${event.event_league_name_short}</p>
            <p><strong>Match:</strong> ${event.event_home_team_name} vs ${event.event_away_team_name}</p>
          </div>
        </div>
      `;

      resultsContainer.appendChild(card);
    }
  });
});

// Modal Handlers
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('click-zone')) {
    const teamName = e.target.getAttribute('data-team');
    const thumb = e.target.getAttribute('data-thumb');

    modalImage.src = thumb;
    modalTeamName.textContent = teamName;
    modal.classList.remove('hidden');
  }
});

closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

sendBtn.addEventListener('click', () => {
  alert('Send button clicked! (No action wired yet)');
});
