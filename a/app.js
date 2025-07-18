import { db } from './firebase-config.js';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  startAfter,
  limit
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const ACCESS_CODE = 'yourAccessCode'; // Replace with your desired access code

const accessScreen = document.getElementById('access-screen');
const appScreen = document.getElementById('app-screen');
const accessInput = document.getElementById('access-code');
const accessBtn = document.getElementById('access-submit');
const accessError = document.getElementById('access-error');
const searchInput = document.getElementById('search-input');
const results = document.getElementById('results');
const loadMoreBtn = document.getElementById('load-more');

const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-image');
const modalTeam = document.getElementById('modal-team');
const modalClose = document.getElementById('modal-close');

let allResults = [];
let displayed = 0;
const pageSize = 5;

// Date helpers
const isToday = (timestamp) => {
  const today = new Date();
  const date = new Date(timestamp);
  return date.toDateString() === today.toDateString();
};

// Load users and validate access code
accessBtn.addEventListener('click', async () => {
  const code = accessInput.value.trim();
  const snapshot = await getDocs(collection(db, 'Users'));
  const valid = snapshot.docs.some(doc => doc.data().access_code === code);
  if (valid || code === ACCESS_CODE) {
    accessScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    loadTodayEvents();
  } else {
    accessError.textContent = 'Invalid access code.';
  }
});

async function loadTodayEvents(search = '') {
  const q = query(collection(db, 'event_data'), orderBy('event_timestamp_est'));
  const snapshot = await getDocs(q);
  const data = snapshot.docs
    .map(doc => doc.data())
    .filter(e => isToday(e.event_timestamp_est))
    .filter(e =>
      e.event_home_team_name.toLowerCase().includes(search) ||
      e.event_away_team_name.toLowerCase().includes(search)
    );

  allResults = data;
  displayed = 0;
  results.innerHTML = '';

  if (data.length === 0) {
    results.innerHTML = `<p>No results for today.</p>`;
    checkFutureEvents(search);
  } else {
    renderNextBatch();
  }
}

function renderNextBatch() {
  const next = allResults.slice(displayed, displayed + pageSize);
  next.forEach(renderEventCard);
  displayed += next.length;

  loadMoreBtn.classList.toggle('hidden', displayed >= allResults.length);
}

loadMoreBtn.addEventListener('click', renderNextBatch);

searchInput.addEventListener('input', (e) => {
  loadTodayEvents(e.target.value.toLowerCase());
});

async function checkFutureEvents(search = '') {
  const q = query(collection(db, 'event_data'), orderBy('event_timestamp_est'));
  const snapshot = await getDocs(q);
  const data = snapshot.docs
    .map(doc => doc.data())
    .filter(e =>
      !isToday(e.event_timestamp_est) &&
      (e.event_home_team_name.toLowerCase().includes(search) ||
       e.event_away_team_name.toLowerCase().includes(search))
    );
  if (data.length > 0) {
    allResults = data;
    displayed = 0;
    loadMoreBtn.classList.remove('hidden');
  }
}

function renderEventCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card';

  const thumb = document.createElement('div');
  thumb.className = 'event-thumb';

  const left = document.createElement('img');
  const right = document.createElement('img');
  left.src = right.src = event.event_img_thumb;

  left.addEventListener('click', () =>
    openModal(event.event_img_thumb, event.event_home_team_name));
  right.addEventListener('click', () =>
    openModal(event.event_img_thumb, event.event_away_team_name));

  thumb.appendChild(left);
  thumb.appendChild(right);

  const names = document.createElement('div');
  names.className = 'event-names';
  names.innerHTML = `
    <div>${event.event_home_team_name}</div>
    <div>${event.event_away_team_name}</div>
  `;

  card.appendChild(thumb);
  card.appendChild(names);
  results.appendChild(card);
}

function openModal(img, team) {
  modalImg.src = img;
  modalTeam.textContent = team;
  modal.classList.remove('hidden');
}

modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
});

document.getElementById('modal-send').addEventListener('click', () => {
  alert('Send functionality not implemented yet');
});
