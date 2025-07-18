import { app, db } from './firebase-config.js';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// ✅ DOM Elements
const accessBtn = document.getElementById("access-btn");
const accessScreen = document.getElementById("access-screen");
const appScreen = document.getElementById("app");
const searchInput = document.getElementById("search-input");
const resultsDiv = document.getElementById("results");
const loadMoreBtn = document.getElementById("load-more");

let lastVisible = null;
let currentQuery = null;
let currentSearchTerm = "";

accessBtn.addEventListener("click", () => {
  accessScreen.style.display = "none";
  appScreen.style.display = "block";
  fetchEventsForToday();
});

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function fetchEventsForToday(searchTerm = "") {
  resultsDiv.innerHTML = "";
  const { start, end } = getTodayBounds();
  const eventsRef = collection(db, "events");

  let q = query(
    eventsRef,
    where("event_timestamp_est", ">=", start),
    where("event_timestamp_est", "<=", end),
    orderBy("event_timestamp_est"),
    limit(5)
  );

  if (searchTerm) {
    q = query(
      eventsRef,
      where("event_timestamp_est", ">=", start),
      where("event_timestamp_est", "<=", end),
      where("searchTerms", "array-contains", searchTerm.toLowerCase()),
      orderBy("event_timestamp_est"),
      limit(5)
    );
  }

  currentQuery = q;
  currentSearchTerm = searchTerm;
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    resultsDiv.innerHTML = `
      <p>No results for today.</p>
      <button id="load-more">Load More</button>
    `;
    document.getElementById("load-more").addEventListener("click", loadMoreEvents);
    return;
  }

  snapshot.forEach(doc => {
    const event = doc.data();
    resultsDiv.innerHTML += renderEventCard(event);
  });

  lastVisible = snapshot.docs[snapshot.docs.length - 1];

  if (snapshot.size === 5) {
    resultsDiv.innerHTML += `<button id="load-more">Load More</button>`;
    document.getElementById("load-more").addEventListener("click", loadMoreEvents);
  }
}

async function loadMoreEvents() {
  const eventsRef = collection(db, "events");
  let q = query(
    eventsRef,
    orderBy("event_timestamp_est"),
    startAfter(lastVisible),
    limit(5)
  );

  if (currentSearchTerm) {
    q = query(
      eventsRef,
      where("searchTerms", "array-contains", currentSearchTerm.toLowerCase()),
      orderBy("event_timestamp_est"),
      startAfter(lastVisible),
      limit(5)
    );
  }

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return;
  }

  snapshot.forEach(doc => {
    const event = doc.data();
    resultsDiv.innerHTML += renderEventCard(event);
  });

  lastVisible = snapshot.docs[snapshot.docs.length - 1];

  if (snapshot.size < 5) {
    const loadMoreBtn = document.getElementById("load-more");
    if (loadMoreBtn) loadMoreBtn.remove();
  }
}

function renderEventCard(event) {
  return `
    <div class="event-card">
      <img src="${event.image}" alt="Event Image" />
      <h3>${event.team_home} vs ${event.team_away}</h3>
      <p><strong>Date:</strong> ${new Date(event.event_timestamp_est).toLocaleString()}</p>
      <p><strong>Venue:</strong> ${event.venue}</p>
      <p><strong>League:</strong> ${event.league}</p>
    </div>
  `;
}

searchInput.addEventListener("input", debounceSearch);

function debounceSearch(e) {
  clearTimeout(debounceSearch.timer);
  debounceSearch.timer = setTimeout(() => {
    fetchEventsForToday(e.target.value.trim());
  }, 300);
}
