import { 
  getFirestore, collection, query, where, getDocs, orderBy 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { app } from "./firebaseInit.js";

const db = getFirestore(app);
const FIREBASE_STORAGE_BASE_URL = "https://firebasestorage.googleapis.com/v0/b/ogcapperbets.firebasestorage.app/o/";

// Returns Eastern Time date string in MM/DD/YYYY format
function getEasternDateStringMMDDYYYY() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseEasternDate(mmddyyyy) {
  if (!mmddyyyy) return null;
  const [month, day, year] = mmddyyyy.split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function diffDays(date1, date2) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / msPerDay);
}

function createModal() {
  // Your full original modal code here unchanged
  // ...
  // (Copy your modal code exactly here, omitted for brevity)
}

function createImageGrid(images, modal) {
  const grid = document.createElement("div");
  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "6px",
    maxWidth: "400px",
    margin: "0 auto",
  });

  images.forEach((docData) => {
    let imgSrc;
    if (docData.firebaseStoragePath) {
      imgSrc = FIREBASE_STORAGE_BASE_URL + encodeURIComponent(docData.firebaseStoragePath) + "?alt=media";
    } else if (docData.strThumb) {
      imgSrc = docData.strThumb;
    } else {
      return;
    }

    const imgBtn = document.createElement("img");
    imgBtn.src = imgSrc;
    imgBtn.alt = "";
    Object.assign(imgBtn.style, {
      cursor: "pointer",
      borderRadius: "4px",
      objectFit: "cover",
      width: "125px",
      height: "auto",
    });

    imgBtn.addEventListener("click", () => {
      modal.show(imgSrc);
    });

    grid.appendChild(imgBtn);
  });

  return grid;
}

// Helper: Get league badge image from first event's firebaseStoragePath or strThumb
function getLeagueImageSrc(leagueName, leaguesGrouped) {
  const events = leaguesGrouped[leagueName] || [];
  if (events.length === 0) return "";
  const firstEvent = events[0];
  if (firstEvent.firebaseStoragePath) {
    return FIREBASE_STORAGE_BASE_URL + encodeURIComponent(firstEvent.firebaseStoragePath) + "?alt=media";
  } else if (firstEvent.strThumb) {
    return firstEvent.strThumb;
  }
  return "";
}

// Create league badge grid using first event's image instead of strLeagueBadge
function createLeagueBadgeGridSimple(leagues, onLeagueClick, leaguesGrouped) {
  const grid = document.createElement("div");
  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    maxWidth: "400px",
    margin: "0 auto",
    justifyItems: "center",
  });

  leagues.forEach(({ strLeague }) => {
    const containerDiv = document.createElement("div");
    containerDiv.style.textAlign = "center";

    const imgBtn = document.createElement("img");
    imgBtn.src = getLeagueImageSrc(strLeague, leaguesGrouped);
    imgBtn.alt = strLeague;
    imgBtn.title = strLeague;
    Object.assign(imgBtn.style, {
      cursor: "pointer",
      width: "100px",
      height: "100px",
      objectFit: "contain",
      borderRadius: "8px",
      border: "1px solid #ccc",
      backgroundColor: "#fff",
      padding: "5px",
      display: "block",
      margin: "0 auto",
    });

    imgBtn.addEventListener("click", () => onLeagueClick(strLeague));

    containerDiv.appendChild(imgBtn);
    grid.appendChild(containerDiv);
  });

  return grid;
}

function createLeagueBadgeGrid(leagues, onLeagueClick, leaguesGrouped) {
  const grid = document.createElement("div");
  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    maxWidth: "400px",
    margin: "0 auto",
    justifyItems: "center",
  });

  leagues.forEach(({ strLeague }) => {
    const container = document.createElement("div");
    container.style.textAlign = "center";

    const imgBtn = document.createElement("img");
    imgBtn.src = getLeagueImageSrc(strLeague, leaguesGrouped);
    imgBtn.alt = strLeague;
    imgBtn.title = strLeague;
    Object.assign(imgBtn.style, {
      cursor: "pointer",
      width: "100px",
      height: "100px",
      objectFit: "contain",
      borderRadius: "8px",
      border: "1px solid #ccc",
      backgroundColor: "#fff",
      padding: "5px",
      display: "block",
      margin: "0 auto",
    });

    imgBtn.addEventListener("click", () => onLeagueClick(strLeague));
    container.appendChild(imgBtn);

    const nextGameDate = getNextGameDateForLeague(strLeague, leaguesGrouped);
    const nextGameText = formatNextGameString(nextGameDate);

    const nextGameLabel = document.createElement("div");
    nextGameLabel.textContent = "Next Game: " + nextGameText;
    nextGameLabel.style.fontSize = "0.8rem";
    nextGameLabel.style.marginTop = "4px";
    nextGameLabel.style.fontWeight = "600";
    nextGameLabel.style.color = "#333";

    container.appendChild(nextGameLabel);

    grid.appendChild(container);
  });

  return grid;
}

function formatNextGameString(nextDate) {
  if (!nextDate) return "Unknown";

  const todayEasternStr = getEasternDateStringMMDDYYYY();
  const todayDate = parseEasternDate(todayEasternStr);
  const diff = diffDays(todayDate, nextDate);

  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `${diff} Days Away`;
  return "Unknown";
}

function getNextGameDateForLeague(leagueName, leaguesGrouped) {
  const todayEasternStr = getEasternDateStringMMDDYYYY();
  const todayDate = parseEasternDate(todayEasternStr);

  const events = leaguesGrouped[leagueName] || [];
  let nextDate = null;

  for (const ev of events) {
    if (!ev.dateEastern) continue;
    const eventDate = parseEasternDate(ev.dateEastern);
    if (eventDate >= todayDate) {
      if (nextDate === null || eventDate < nextDate) {
        nextDate = eventDate;
      }
    }
  }
  return nextDate;
}

function createSportSection(sportName, leaguesGrouped, modal) {
  const sportSection = document.createElement("section");
  Object.assign(sportSection.style, {
    marginBottom: "30px",
    maxWidth: "400px",
    marginLeft: "auto",
    marginRight: "auto",
  });

  const sportTitle = document.createElement("h4");
  sportTitle.textContent = sportName;
  sportTitle.style.fontFamily = "'Oswald', sans-serif";
  sportTitle.style.marginBottom = "10px";
  sportTitle.style.textAlign = "center";

  sportSection.appendChild(sportTitle);

  const contentContainer = document.createElement("div");
  sportSection.appendChild(contentContainer);

  const leagues = Object.keys(leaguesGrouped).map((leagueName) => {
    return { strLeague: leagueName };
  });

  function showLeagues() {
    contentContainer.innerHTML = "";
    const leagueGrid = createLeagueBadgeGrid(leagues, showLeagueEvents, leaguesGrouped);
    contentContainer.appendChild(leagueGrid);
    sportTitle.style.display = "";

    if (sportSection.parentElement) {
      Array.from(sportSection.parentElement.children).forEach(sibling => {
        sibling.style.display = "";
      });
    }
  }

  function showLeagueEvents(leagueName) {
    contentContainer.innerHTML = "";
    sportTitle.style.display = "none";

    if (sportSection.parentElement) {
      Array.from(sportSection.parentElement.children).forEach(sibling => {
        if (sibling !== sportSection) {
          sibling.style.display = "none";
        }
      });
    }

    const leagueEvents = leaguesGrouped[leagueName] || [];
    const leagueBadgeUrl = getLeagueImageSrc(leagueName, leaguesGrouped);

    const leagueBadgeImg = document.createElement("img");
    leagueBadgeImg.src = leagueBadgeUrl;
    leagueBadgeImg.alt = leagueName;
    leagueBadgeImg.style.width = "250px";
    leagueBadgeImg.style.display = "block";
    leagueBadgeImg.style.margin = "0 auto 4px auto";
    leagueBadgeImg.style.borderRadius = "12px";
    leagueBadgeImg.style.objectFit = "contain";

    const backBtn = document.createElement("button");
    backBtn.textContent = "← Back to leagues";
    Object.assign(backBtn.style, {
      marginBottom: "10px",
      cursor: "pointer",
      padding: "6px 12px",
      fontSize: "0.9rem",
      display: "block",
      marginLeft: "auto",
      marginRight: "auto",
    });
    backBtn.addEventListener("click", showLeagues);

    const leagueTitleText = document.createElement("h3");
    leagueTitleText.style.textAlign = "center";
    leagueTitleText.style.marginBottom = "20px";
    leagueTitleText.textContent = `${sportName} - ${leagueName}`;

    contentContainer.appendChild(leagueBadgeImg);
    contentContainer.appendChild(backBtn);
    contentContainer.appendChild(leagueTitleText);

    const eventsGrid = createImageGrid(leagueEvents, modal);
    contentContainer.appendChild(eventsGrid);
  }

  showLeagues();

  return sportSection;
}

async function loadImages() {
  console.log("[Load] Starting to load images...");

  const container = document.createElement("div");
  Object.assign(container.style, {
    maxWidth: "400px",
    margin: "20px auto",
    padding: "0 5px",
  });
  document.body.insertBefore(container, document.querySelector("footer"));

  const modal = createModal();

  const todayStr = getEasternDateStringMMDDYYYY();
  console.log("[Load] Eastern Time today's date (MM/DD/YYYY):", todayStr);
  const todayDate = parseEasternDate(todayStr);

  try {
    const collRef = collection(db, "gameEvents_1");
    const querySnapshot = await getDocs(collRef);

    console.log("[Load] Documents found:", querySnapshot.size);

    if (querySnapshot.empty) {
      console.warn("[Load] No documents found for today.");
      const noDataMsg = document.createElement("p");
      noDataMsg.textContent = "No games found for today.";
      container.appendChild(noDataMsg);
      return;
    }

    const docs = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.strSport &&
        data.strLeague &&
        data.strLeagueBadge &&
        (data.firebaseStoragePath || data.strThumb) &&
        data.strStatus !== "FT"
      ) {
        docs.push(data);
      } else {
        console.warn("[Load] Skipping doc missing required fields or finished:", doc.id);
      }
    });

    console.log("[Load] Filtered docs:", docs.length);

    docs.sort((a, b) => {
      const sportA = a.strSport.toLowerCase();
      const sportB = b.strSport.toLowerCase();
      if (sportA < sportB) return -1;
      if (sportA > sportB) return 1;
      const leagueA = a.strLeague.toLowerCase();
      const leagueB = b.strLeague.toLowerCase();
      if (leagueA < leagueB) return -1;
      if (leagueA > leagueB) return 1;
      const imgA = (a.firebaseStoragePath || a.strThumb || "").toLowerCase();
      const imgB = (b.firebaseStoragePath || b.strThumb || "").toLowerCase();
      if (imgA < imgB) return -1;
      if (imgA > imgB) return 1;
      return 0;
    });

    console.log("[Load] Sorted docs");

    const groupedBySport = docs.reduce((acc, curr) => {
      if (!acc[curr.strSport]) acc[curr.strSport] = {};
      if (!acc[curr.strSport][curr.strLeague]) acc[curr.strSport][curr.strLeague] = [];
      acc[curr.strSport][curr.strLeague].push(curr);
      return acc;
    }, {});

    console.log("[Load] Grouped by sport and league:", Object.keys(groupedBySport));

    // Build map of all unique leagues for easy access:
    const allLeaguesMap = new Map();

    for (const sportName in groupedBySport) {
      const leaguesGroup = groupedBySport[sportName];
      for (const leagueName in leaguesGroup) {
        if (!allLeaguesMap.has(leagueName)) {
          const badge = getLeagueImageSrc(leagueName, leaguesGroup);
          allLeaguesMap.set(leagueName, { 
            strLeague: leagueName, 
            strLeagueBadge: badge, // Not used for image src, kept for reference
            sportName, 
            leaguesGroupedRef: groupedBySport[sportName] 
          });
        }
      }
    }

    // Categorize leagues by next game date
    const leaguesToday = [];
    const leaguesTomorrow = [];
    const leaguesOthers = [];

    allLeaguesMap.forEach(({ strLeague, strLeagueBadge, sportName, leaguesGroupedRef }) => {
      const nextDate = getNextGameDateForLeague(strLeague, leaguesGroupedRef);
      if (!nextDate) {
        leaguesOthers.push({ strLeague, strLeagueBadge, sportName, leaguesGroupedRef });
        return;
      }
      const diff = diffDays(todayDate, nextDate);
      if (diff === 0) leaguesToday.push({ strLeague, strLeagueBadge, sportName, leaguesGroupedRef });
      else if (diff === 1) leaguesTomorrow.push({ strLeague, strLeagueBadge, sportName, leaguesGroupedRef });
      else leaguesOthers.push({ strLeague, strLeagueBadge, sportName, leaguesGroupedRef });
    });

    leaguesToday.sort((a, b) => a.strLeague.localeCompare(b.strLeague));
    leaguesTomorrow.sort((a, b) => a.strLeague.localeCompare(b.strLeague));
    leaguesOthers.sort((a, b) => a.strLeague.localeCompare(b.strLeague));

    // Click handler to load a league's games, clearing container and showing events grid
    function onLeagueClick(leagueName) {
      container.innerHTML = ""; // clear all

      // Find sport of this league:
      const leagueData = allLeaguesMap.get(leagueName);
      if (!leagueData) return;

      const { sportName, leaguesGroupedRef } = leagueData;
      const leagueEvents = leaguesGroupedRef[leagueName] || [];

      // Title + Back button
      const backBtn = document.createElement("button");
      backBtn.textContent = "← Back to Main";
      backBtn.style.display = "block";
      backBtn.style.margin = "10px auto";
      backBtn.style.cursor = "pointer";
      backBtn.style.padding = "6px 12px";
      backBtn.style.fontSize = "1rem";
      backBtn.addEventListener("click", () => {
        container.innerHTML = "";
        loadImages();
      });

      const leagueTitle = document.createElement("h3");
      leagueTitle.textContent = `${sportName} - ${leagueName}`;
      leagueTitle.style.textAlign = "center";
      leagueTitle.style.marginBottom = "20px";
      leagueTitle.style.fontFamily = "'Oswald', sans-serif";

      container.appendChild(backBtn);
      container.appendChild(leagueTitle);

      // Create and append event images grid for this league (click opens modal)
      const eventsGrid = createImageGrid(leagueEvents, modal);
      container.appendChild(eventsGrid);
    }

    // Helper: Create simple league badge grid with click to load league's games
    function createSimpleLeagueGrid(leagues) {
      const grid = document.createElement("div");
      Object.assign(grid.style, {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "10px",
        maxWidth: "400px",
        margin: "0 auto",
        justifyItems: "center",
      });

      leagues.forEach(({ strLeague }) => {
        const containerDiv = document.createElement("div");
        containerDiv.style.textAlign = "center";

        const imgBtn = document.createElement("img");
        imgBtn.src = getLeagueImageSrc(strLeague, groupedBySport[strLeague] || {});
        imgBtn.alt = strLeague;
        imgBtn.title = strLeague;
        Object.assign(imgBtn.style, {
          cursor: "pointer",
          width: "100px",
          height: "100px",
          objectFit: "contain",
          borderRadius: "8px",
          border: "1px solid #ccc",
          backgroundColor: "#fff",
          padding: "5px",
          display: "block",
          margin: "0 auto",
        });

        imgBtn.addEventListener("click", () => onLeagueClick(strLeague));

        containerDiv.appendChild(imgBtn);
        grid.appendChild(containerDiv);
      });

      return grid;
    }

    // Create Today and Tomorrow sections with no next game text below badges
    function createSection(title, leagues) {
      const section = document.createElement("section");
      Object.assign(section.style, {
        maxWidth: "400px",
        margin: "20px auto",
      });

      const header = document.createElement("h3");
      header.textContent = title;
      header.style.textAlign = "center";
      header.style.fontFamily = "'Oswald', sans-serif";
      header.style.marginBottom = "12px";

      section.appendChild(header);

      if (leagues.length === 0) {
        const noGamesText = document.createElement("p");
        noGamesText.textContent = "No games found.";
        noGamesText.style.textAlign = "center";
        section.appendChild(noGamesText);
      } else {
        const leagueGrid = createSimpleLeagueGrid(leagues);
        section.appendChild(leagueGrid);
      }

      return section;
    }

    const todaySection = createSection("Games Today", leaguesToday);
    const tomorrowSection = createSection("Games Tomorrow", leaguesTomorrow);

    container.appendChild(todaySection);
    container.appendChild(tomorrowSection);

    const showAllBtn = document.createElement("button");
    showAllBtn.textContent = "Show All";
    Object.assign(showAllBtn.style, {
      display: "block",
      margin: "20px auto",
      padding: "10px 20px",
      fontSize: "1rem",
      cursor: "pointer",
    });
    container.appendChild(showAllBtn);

    const allSportsContainer = document.createElement("div");
    container.appendChild(allSportsContainer);

    showAllBtn.addEventListener("click", () => {
      allSportsContainer.innerHTML = "";
      for (const sport in groupedBySport) {
        const sportSection = createSportSection(sport, groupedBySport[sport], modal);
        allSportsContainer.appendChild(sportSection);
      }
      showAllBtn.style.display = "none";
    });

  } catch (error) {
    console.error("[Load] Error loading images:", error);
    const errorMsg = document.createElement("p");
    errorMsg.style.color = "red";
    errorMsg.textContent = `Error loading images: ${error.message}`;
    container.appendChild(errorMsg);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadImages();
});
