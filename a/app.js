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
  const teamSearchInput = document.getElementById('team-search');
  const resultsContainer = document.getElementById('results');

  const modal = document.getElementById('eventModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  const modalSend = document.getElementById('modalSend');

  // Modal controls
  modalClose.addEventListener('click', () => modal.classList.add('hidden'));
  modalSend.addEventListener('click', () => {
    alert('Send clicked (hook this up later)');
  });

  // Access Code
  submitCodeBtn.addEventListener('click', async () => {
    const code = accessCodeInput.value.trim();

    if (!code) {
      accessMsg.textContent = 'Please enter a code.';
      return;
    }

    try {
      const q = query(collection(db, "Users"), where("accessCode", "==", code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        accessMsg.textContent = 'Invalid access code ❌';
      } else {
        accessSection.classList.add('hidden');
        searchSection.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      accessMsg.textContent = 'Error checking code.';
    }
  });

  // Team search
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
          <img class="team-thumb" src="${event.event_img_thumb}" alt="Event Thumb" />
          <div class="team-title">${event.event_name_short_alt || ''}</div>
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

        card.addEventListener('click', () => {
          modalImage.src = event.event_img_thumb;
          modalTitle.textContent = event.event_name_short_alt || 'Event';
          modal.classList.remove('hidden');
        });

        resultsContainer.appendChild(card);
      });

    } catch (err) {
      console.error('Error fetching events:', err);
      resultsContainer.innerHTML = '<p>Error loading results.</p>';
    }
  });
});
