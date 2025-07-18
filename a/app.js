import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const accessSection = document.getElementById('access-section');
const mainSection = document.getElementById('main-section');
const accessInput = document.getElementById('access-code');
const accessBtn = document.getElementById('access-btn');
const searchInput = document.getElementById('search-input');
const eventsContainer = document.getElementById('events-container');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalTeamName = document.getElementById('modal-team-name');
const closeModalBtn = document.getElementById('close-modal');

const allowedCode = 'ogcap2025';
let allEvents = [];
let todayEvents = [];
let futureEvents = [];
let displayIndex = 0;
const batchSize = 5;

// 🔓 Access logic
accessBtn.addEventListener('click', () => {
  if (accessInput.value.trim().toLowerCase() === allowedCode) {
    accessSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
    loadEvents();
  } else {
    alert('Invalid access code!');
  }
});

async function loadEvents() {
  const q = query(collection(db, 'events'), orderBy('event_timestamp_est'));
  const snapshot = await getDocs(q);
  allEvents = snapshot.docs.map(doc => doc.data());

  const now = new Date();
  const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  estNow.setHours(0, 0, 0, 0);
  const todayStart = estNow.getTime() / 1000;
  const todayEnd = todayStart + 86400;

  todayEvents = allEvents.filter(ev =>
    ev.event_timestamp_est >= todayStart && ev.event_timestamp_est < todayEnd
  );

  futureEvents = allEvents.filter(ev =>
    ev.event_timestamp_est >= todayEnd
  );

  renderEvents(todayEvents);

  if (futureEvents.length > 0) {
    appendLoadMoreButton();
  }
}

function renderEvents(events) {
  eventsContainer.innerHTML = '';
  if (events.length === 0) {
    eventsContainer.innerHTML = `<p style="text-align:center;margin:20px 0;">No events for today.</p>`;
  } else {
    events.forEach(ev => eventsContainer.appendChild(buildEventCard(ev)));
  }
}

function loadMoreEvents() {
  const nextBatch = futureEvents.slice(displayIndex, displayIndex + batchSize);
  nextBatch.forEach(ev => eventsContainer.appendChild(buildEventCard(ev)));
  displayIndex += batchSize;

  if (displayIndex < futureEvents.length) {
    appendLoadMoreButton();
  }
}

function appendLoadMoreButton() {
  const btn = document.createElement('button');
  btn.textContent = 'Load More';
  btn.className = 'load-more-btn';
  btn.addEventListener('click', () => {
    btn.remove();
    loadMoreEvents();
  });
  eventsContainer.appendChild(btn);
}

function buildEventCard(ev) {
  const card = document.createElement('div');
  card.className = 'event-card';

  const eventDate = new Date(ev.event_timestamp_est * 1000);
  const formattedDate = eventDate.toLocaleString('en-US', { timeZone: 'America/New_York' });

  card.innerHTML = `
    <div class="event-thumb-wrapper">
      <img src="${ev.event_img_thumb}" alt="Thumb" class="event-thumb">
      <div class="click-zone left" data-team="${ev.event_home_team_name}" data-img="${ev.event_img_thumb}"></div>
      <div class="click-zone right" data-team="${ev.event_away_team_name}" data-img="${ev.event_img_thumb}"></div>
    </div>
    <div class="team-labels">
      <span>${ev.event_home_team_name}</span>
      <span>${ev.event_away_team_name}</span>
    </div>
    <div class="event-details">
      <div class="details-left">
        <div>${ev.event_sport_name}</div>
        <img src="${ev.event_img_league_badge}" class="event-league-badge">
      </div>
      <div class="details-right">
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Venue:</strong> ${ev.event_venue}</p>
        <p><strong>League:</strong> ${ev.event_league_name_short || 'N/A'}</p>
        <p><strong>Match:</strong> ${ev.event_home_team_name} vs ${ev.event_away_team_name}</p>
      </div>
    </div>
  `;

  card.querySelectorAll('.click-zone').forEach(zone => {
    zone.addEventListener('click', () => {
      modalImage.src = zone.dataset.img;
      modalTeamName.textContent = zone.dataset.team;
      modal.classList.remove('hidden');
    });
  });

  return card;
}

// Modal close
closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Search filter logic
searchInput.addEventListener('input', () => {
  const term = searchInput.value.trim().toLowerCase();
  const filteredToday = todayEvents.filter(ev =>
    ev.event_home_team_name.toLowerCase().includes(term) ||
    ev.event_away_team_name.toLowerCase().includes(term)
  );

  if (filteredToday.length > 0) {
    renderEvents(filteredToday);
  } else {
    eventsContainer.innerHTML = `<p style="text-align:center;margin:20px 0;">No events for today.</p>`;
    const futureFiltered = futureEvents.filter(ev =>
      ev.event_home_team_name.toLowerCase().includes(term) ||
      ev.event_away_team_name.toLowerCase().includes(term)
    );
    if (futureFiltered.length > 0) {
      futureEvents = futureFiltered;
      displayIndex = 0;
      appendLoadMoreButton();
    }
  }
});
