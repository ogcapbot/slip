import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const accessSection = document.getElementById('access-section');
  const searchSection = document.getElementById('search-section');
  const accessCodeInput = document.getElementById('access-code');
  const submitCodeBtn = document.getElementById('submit-code');
  const accessMsg = document.getElementById('access-message');
  const loader = document.getElementById('loader');
  const welcomeMessage = document.getElementById('welcome-message');
  const teamSearchInput = document.getElementById('team-search');
  const resultsContainer = document.getElementById('results');

  const modal = document.getElementById('eventModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  const modalSend = document.getElementById('modalSend');

  modalClose.addEventListener('click', () => {
    modal.classList.remove('show');
    modal.classList.add('hidden');
  });

  modalSend.addEventListener('click', () => {
    alert("Send clicked — no action yet.");
  });

  submitCodeBtn.addEventListener('click', async () => {
    const code = accessCodeInput.value.trim();
    accessMsg.textContent = '';
    loader.classList.remove('hidden');

    if (!code) {
      loader.classList.add('hidden');
      accessMsg.textContent = 'Please enter a code.';
      return;
    }

    try {
      const q = query(collection(db, "Users"), where("accessCode", "==", code));
      const snapshot = await getDocs(q);

      loader.classList.add('hidden');

      if (snapshot.empty) {
        accessMsg.textContent = 'Invalid access code ❌';
      } else {
        const userDoc = snapshot.docs[0].data();
        accessSection.classList.add('hidden');
        searchSection.classList.remove('hidden');
        welcomeMessage.textContent = `🎉 Welcome, ${userDoc.userDisplayname || 'User'}! Search Events Below`;
      }
    } catch (err) {
      loader.classList.add('hidden');
      console.error(err);
      accessMsg.textContent = 'Error checking code.';
    }
  });

  teamSearchInput.addEventListener('input', async () => {
    const queryText = teamSearchInput.value.trim().toLowerCase();
    resultsContainer.innerHTML = '';
    if (queryText.length < 2) return;

    try {
      const snapshot = await getDocs(collection(db, "event_data"));
      const results = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const home = data.event_home_team_name?.toLowerCase();
        const away = data.event_away_team_name?.toLowerCase();
        if (home?.includes(queryText) || away?.includes(queryText)) {
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

        const card = document.createElement('div');
        card.className = 'team-card';

        card.innerHTML = `
          <div class="split-image">
            <div class="left-click">
              <img src="${event.event_img_thumb}" alt="Event Thumb" />
            </div>
            <div class="right-click">
              <img src="${event.event_img_thumb}" alt="Event Thumb" />
            </div>
          </div>
          <div class="team-labels">
            <div>${event.event_home_team_name}</div>
            <div>${event.event_away_team_name}</div>
          </div>
          <div class="card-content">
            <div class="left-col">
              <div>${event.event_sport_name || ''}</div>
              <img src="${event.event_img_league_badge}" alt="League Badge" />
            </div>
            <div class="right-col">
              <p><strong>Date:</strong> ${estTime}</p>
              <p><strong>Venue:</strong> ${event.event_venue || 'N/A'}, ${event.event_country || ''}</p>
              <p><strong>League:</strong> ${event.event_league_name_short || ''}</p>
              <p><strong>Match:</strong> ${event.event_home_team_name} vs ${event.event_away_team_name}</p>
            </div>
          </div>
        `;

        card.querySelector('.left-click').addEventListener('click', () => {
          modalImage.src = event.event_img_thumb || '';
          modalTitle.textContent = event.event_home_team_name;
          modal.classList.remove('hidden');
          modal.classList.add('show');
        });

        card.querySelector('.right-click').addEventListener('click', () => {
          modalImage.src = event.event_img_thumb || '';
          modalTitle.textContent = event.event_away_team_name;
          modal.classList.remove('hidden');
          modal.classList.add('show');
        });

        resultsContainer.appendChild(card);
      });

    } catch (err) {
      console.error('Error fetching events:', err);
      resultsContainer.innerHTML = '<p>Error loading results.</p>';
    }
  });
});
