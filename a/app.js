import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const accessSection = document.getElementById('access-section');
const mainSection = document.getElementById('main-section');
const accessBtn = document.getElementById('access-btn');
const accessCodeInput = document.getElementById('access-code');
const searchInput = document.getElementById('search-input');
const eventsContainer = document.getElementById('events-container');
const loadMoreBtn = document.getElementById('load-more-btn');

const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-image');
const modalTeam = document.getElementById('modal-team-name');
const modalClose = document.getElementById('modal-close');

let allEvents = [];
let filteredEvents = [];
let displayedCount = 0;

const EVENTS_LIMIT = 5;
const ACCESS_CODE = "OGCAP2025";

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function renderEvent(event) {
  const card = document.createElement('div');
  card.className = 'event-card';

  const thumb = document.createElement('div');
  thumb.className = 'event-thumb';

  const left = document.createElement('img');
  left.src = event.event_thumb;
  left.className = 'half';
  left.addEventListener('click', () => openModal(event.event_thumb, event.event_home_team_name));

  const right = document.createElement('img');
  right.src = event.event_thumb;
  right.className = 'half';
  right.addEventListener('click', () => openModal(event.event_thumb, event.event_away_team_name));

  thumb.appendChild(left);
  thumb.appendChild(right);

  const names = document.createElement('div');
  names.className = 'team-names';
  names.innerHTML = `<div>${event.event_home_team_name}</div><div>${event.event_away_team_name}</div>`;

  const info = document.createElement('div');
  info.innerHTML = `
    <p><strong>${event.sport_name}</strong></p>
    <p><img src="${event.league_logo}" height="25" /></p>
    <p><strong>Date:</strong> ${formatDate(event.event_timestamp_est)}</p>
    <p><strong>Venue:</strong> ${event.event_venue}</p>
    <p><strong>League:</strong> ${event.league_name || 'N/A'}</p>
    <p><strong>Match:</strong> ${event.event_home_team_name} vs ${event.event_away_team_name}</p>
  `;

  card.appendChild(thumb);
  card.appendChild(names);
  card.appendChild(info);

  eventsContainer.appendChild(card);
}

function openModal(imgUrl, teamName) {
  modalImg.src = imgUrl;
  modalTeam.textContent = teamName;
  modal.classList.remove('hidden');
}

modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
});

function showEvents(events, reset = false) {
  if (reset) {
    eventsContainer.innerHTML = '';
    displayedCount = 0;
  }

  const remaining = events.slice(displayedCount, displayedCount + EVENTS_LIMIT);
  remaining.forEach(renderEvent);
  displayedCount += remaining.length;

  loadMoreBtn.classList.toggle('hidden', displayedCount >= events.length);
}

function filterToday(events) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return events.filter(e => {
    const d = new Date(e.event_timestamp_est);
    return d >= today && d < tomorrow;
  });
}

function searchAndDisplay(query = '') {
  const lower = query.toLowerCase();
  filteredEvents = allEvents.filter(e =>
    e.event_home_team_name.toLowerCase().includes(lower) ||
    e.event_away_team_name.toLowerCase().includes(lower)
  );

  const todayFiltered = filterToday(filteredEvents);

  if (todayFiltered.length > 0) {
    showEvents(todayFiltered, true);
  } else {
    eventsContainer.innerHTML = `<p>No results for today.</p>`;
    showEvents(filteredEvents, false);
  }
}

accessBtn.addEventListener('click', async () => {
  if (accessCodeInput.value.trim() !== ACCESS_CODE) {
    alert('Incorrect access code.');
    return;
  }

  accessSection.classList.add('hidden');
  mainSection.classList.remove('hidden');

  const snapshot = await getDocs(query(collection(db, 'events'), orderBy('event_timestamp_est')));
  allEvents = snapshot.docs.map(doc => doc.data());
  searchAndDisplay();
});

searchInput.addEventListener('input', () => {
  searchAndDisplay(searchInput.value);
});

loadMoreBtn.addEventListener('click', () => {
  showEvents(filteredEvents);
});
