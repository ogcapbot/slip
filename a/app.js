import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// ✅ Your Firebase config — KEEP THIS AS YOU HAVE IT
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const accessBtn = document.getElementById("access-btn");
const accessScreen = document.getElementById("access-screen");
const appScreen = document.getElementById("app");

const searchInput = document.getElementById("search-input");
const eventList = document.getElementById("event-list");
const loadMoreBtn = document.getElementById("load-more");

let lastVisible = null;
let currentQuery = null;
let currentSearchTerm = "";
let hasMore = true;

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayTimestamp = today.getTime();

const EVENTS_PER_PAGE = 5;

accessBtn.addEventListener("click", () => {
  const code = document.getElementById("access-code").value.trim();
  if (code === "yourAccessCode") {
    accessScreen.style.display = "none";
    appScreen.style.display = "block";
    fetchEvents();
  } else {
    alert("Invalid access code.");
  }
});

searchInput.addEventListener("input", () => {
  eventList.innerHTML = "";
  lastVisible = null;
  currentSearchTerm = searchInput.value.trim().toLowerCase();
  fetchEvents();
});

loadMoreBtn.addEventListener("click", () => {
  if (hasMore) {
    fetchEvents(true);
  }
});

async function fetchEvents(isLoadMore = false) {
  let q = collection(db, "events");

  q = query(
    q,
    orderBy("event_timestamp_est"),
    ...(currentSearchTerm
      ? [where("search_team_names", "array-contains", currentSearchTerm)]
      : [where("event_timestamp_est", ">=", todayTimestamp)]),
    ...(lastVisible ? [startAfter(lastVisible)] : []),
    limit(EVENTS_PER_PAGE)
  );

  currentQuery = q;
  const snapshot = await getDocs(q);

  if (snapshot.empty && !isLoadMore) {
    eventList.innerHTML = "<p>No results for today.</p>";
    loadMoreBtn.style.display = "none";
    return;
  }

  snapshot.forEach(doc => renderEventCard(doc.data()));

  lastVisible = snapshot.docs[snapshot.docs.length - 1];
  hasMore = snapshot.docs.length === EVENTS_PER_PAGE;
  loadMoreBtn.style.display = hasMore ? "block" : "none";
}

function renderEventCard(data) {
  const card = document.createElement("div");
  card.className = "event-card";

  const imageRow = document.createElement("div");
  imageRow.className = "event-image";

  const leftSide = document.createElement("div");
  leftSide.className = "event-half";
  const rightSide = document.createElement("div");
  rightSide.className = "event-half";

  const img = document.createElement("img");
  img.src = data.event_image;
  img.alt = "Event Image";
  img.style.width = "100%";

  const img2 = img.cloneNode();

  leftSide.appendChild(img);
  rightSide.appendChild(img2);

  leftSide.addEventListener("click", () =>
    openModal(data.event_image, data.event_home_team_name)
  );
  rightSide.addEventListener("click", () =>
    openModal(data.event_image, data.event_away_team_name)
  );

  imageRow.appendChild(leftSide);
  imageRow.appendChild(rightSide);

  const names = document.createElement("div");
  names.className = "event-names";
  names.innerHTML = `
    <div>${data.event_home_team_name}</div>
    <div>${data.event_away_team_name}</div>
  `;

  const details = document.createElement("div");
  details.className = "event-details";
  const date = new Date(data.event_timestamp_est).toLocaleString();

  details.innerHTML = `
    <p><strong>${data.sport_name || "Event"}</strong></p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Venue:</strong> ${data.venue_name || "TBA"}</p>
    <p><strong>League:</strong> ${data.league_name || "N/A"}</p>
    <p><strong>Match:</strong> ${data.event_home_team_name} vs ${data.event_away_team_name}</p>
  `;

  card.appendChild(imageRow);
  card.appendChild(names);
  card.appendChild(details);
  eventList.appendChild(card);
}

function openModal(imageUrl, teamName) {
  document.getElementById("modal-image").src = imageUrl;
  document.getElementById("modal-team-name").textContent = teamName;
  document.getElementById("modal").classList.remove("hidden");
}

document.getElementById("modal-close").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});

document.getElementById("modal-send").addEventListener("click", () => {
  alert("Team selected!");
  document.getElementById("modal").classList.add("hidden");
});
