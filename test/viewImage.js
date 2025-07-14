import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Initialize Firebase (assuming your firebaseInit.js is loaded separately)

// Firestore instance
const db = getFirestore();

// Global state
let units = [];
let modalElements = {};
let currentDoc = null;

console.log("[Load] Starting to load images...");

async function loadImages() {
  try {
    // Clear any previous content
    document.querySelector("main")?.remove();
    const main = document.createElement("main");
    document.body.insertBefore(main, document.querySelector("footer"));

    // Today's date string MM/DD/YYYY
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(
      today.getDate()
    ).padStart(2, "0")}/${today.getFullYear()}`;
    console.log("[Load] Eastern Time today's date (MM/DD/YYYY):", todayStr);

    // Query documents for today's date, filtering out strStatus 'FT' and ensuring required fields exist
    const q = query(
      collection(db, "gameEvents_1"),
      where("dateEastern", "==", todayStr)
    );
    const snapshot = await getDocs(q);

    const docs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (
        data.strSport &&
        data.strThumb &&
        data.strLeague &&
        data.strLeagueBadge &&
        data.strAwayTeam &&
        data.strHomeTeam &&
        data.strStatus !== "FT"
      ) {
        docs.push({ id: doc.id, ...data });
      } else {
        console.warn(
          `[Load] Skipping doc missing required fields or finished: ${doc.id}`
        );
      }
    });

    console.log("[Load] Filtered docs:", docs.length);

    // Sort by sport, league, then strThumb (alphabetical)
    docs.sort((a, b) => {
      if (a.strSport !== b.strSport)
        return a.strSport.localeCompare(b.strSport);
      if (a.strLeague !== b.strLeague)
        return a.strLeague.localeCompare(b.strLeague);
      return a.strThumb.localeCompare(b.strThumb);
    });

    // Group by sport then league
    const grouped = {};
    for (const doc of docs) {
      if (!grouped[doc.strSport]) grouped[doc.strSport] = {};
      if (!grouped[doc.strSport][doc.strLeague])
        grouped[doc.strSport][doc.strLeague] = [];
      grouped[doc.strSport][doc.strLeague].push(doc);
    }

    console.log("[Load] Grouped by sport and league:", Object.keys(grouped));

    // Show sports with league badges first
    showSportsAndLeagues(grouped, main);

    // Load units for modal usage
    await loadUnits();

  } catch (error) {
    console.error("[Load] Error loading images:", error);
    displayError(`Error loading images: ${error.message}`);
  }
}

function displayError(msg) {
  const main = document.querySelector("main") || document.createElement("main");
  main.innerHTML = `<p style="color:red;">${msg}</p>`;
  if (!document.querySelector("main")) document.body.insertBefore(main, document.querySelector("footer"));
}

function showSportsAndLeagues(grouped, container) {
  container.innerHTML = ""; // clear container

  for (const sport of Object.keys(grouped)) {
    // Sport title
    const sportTitle = document.createElement("h2");
    sportTitle.textContent = sport;
    sportTitle.style.textAlign = "center";
    sportTitle.style.marginTop = "2rem";
    container.appendChild(sportTitle);

    // League container grid
    const leagueGrid = document.createElement("div");
    leagueGrid.style.display = "grid";
    leagueGrid.style.gridTemplateColumns = "repeat(auto-fit,minmax(100px,1fr))";
    leagueGrid.style.gap = "10px";
    leagueGrid.style.justifyItems = "center";
    leagueGrid.style.marginBottom = "3rem";
    container.appendChild(leagueGrid);

    for (const league of Object.keys(grouped[sport])) {
      const leagueData = grouped[sport][league][0]; // first doc to get badge, league name

      const leagueBtn = document.createElement("button");
      leagueBtn.style.border = "none";
      leagueBtn.style.background = "none";
      leagueBtn.style.cursor = "pointer";
      leagueBtn.style.padding = "0";
      leagueBtn.style.textAlign = "center";
      leagueBtn.style.display = "flex";
      leagueBtn.style.flexDirection = "column";
      leagueBtn.style.alignItems = "center";

      // League badge image
      const badgeImg = document.createElement("img");
      badgeImg.src = leagueData.strLeagueBadge;
      badgeImg.alt = league;
      badgeImg.style.width = "80px";
      badgeImg.style.borderRadius = "8px";
      badgeImg.style.marginBottom = "5px";

      // League text label
      const leagueLabel = document.createElement("span");
      leagueLabel.textContent = league;
      leagueLabel.style.fontWeight = "600";
      leagueLabel.style.fontSize = "0.9rem";
      leagueLabel.style.maxWidth = "100px";
      leagueLabel.style.wordWrap = "break-word";

      leagueBtn.appendChild(badgeImg);
      leagueBtn.appendChild(leagueLabel);
      leagueGrid.appendChild(leagueBtn);

      // Click to show events for this league
      leagueBtn.addEventListener("click", () => {
        showEventsForLeague(sport, league, grouped[sport][league], container);
      });
    }
  }
}

function showEventsForLeague(sport, league, events, container) {
  container.innerHTML = ""; // clear container

  // Back button + league badge + title container
  const backBtn = document.createElement("button");
  backBtn.textContent = "← Back to leagues";
  backBtn.style.marginBottom = "10px";
  backBtn.style.padding = "6px 12px";
  backBtn.style.fontSize = "1rem";
  backBtn.style.cursor = "pointer";
  backBtn.addEventListener("click", () => loadImages());
  container.appendChild(backBtn);

  // League badge and title container
  const headerDiv = document.createElement("div");
  headerDiv.style.textAlign = "center";
  headerDiv.style.marginBottom = "1rem";

  const leagueBadge = document.createElement("img");
  leagueBadge.src = events[0].strLeagueBadge;
  leagueBadge.alt = league;
  leagueBadge.style.width = "250px";
  leagueBadge.style.borderRadius = "8px";
  leagueBadge.style.marginBottom = "0.5rem";

  const title = document.createElement("h3");
  title.textContent = `${sport} - ${league}`;
  title.style.margin = "0";

  headerDiv.appendChild(leagueBadge);
  headerDiv.appendChild(title);
  container.appendChild(headerDiv);

  // Events grid container
  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(3, 1fr)";
  grid.style.gap = "8px";
  grid.style.maxWidth = "400px";
  grid.style.margin = "0 auto";
  container.appendChild(grid);

  for (const event of events) {
    if (!event.strThumb) continue;

    const img = document.createElement("img");
    img.src = event.strThumb;
    img.alt = event.strSport;
    img.width = 125;
    img.style.cursor = "pointer";
    img.style.borderRadius = "4px";
    img.style.objectFit = "cover";

    img.addEventListener("click", () => openModal(event));

    grid.appendChild(img);
  }
}

// Load Units collection ordered by Rank
async function loadUnits() {
  try {
    const unitsSnap = await getDocs(
      query(collection(db, "Units"), orderBy("Rank", "asc"))
    );
    units = [];
    unitsSnap.forEach((doc) => {
      const data = doc.data();
      if (data["Unit Fractions"]) {
        units.push(data["Unit Fractions"]);
      }
    });
    console.log("[Modal] Loaded units:", units);
  } catch (err) {
    console.error("[Modal] Error loading units:", err);
  }
}

// Modal elements container to avoid recreating
function createModal() {
  if (modalElements.container) return modalElements.container;

  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.backgroundColor = "rgba(0,0,0,0.6)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "9999";

  const content = document.createElement("div");
  content.style.backgroundColor = "white";
  content.style.padding = "15px";
  content.style.borderRadius = "10px";
  content.style.textAlign = "center";
  content.style.width = "300px";
  content.style.maxWidth = "90vw";
  content.style.position = "relative";

  modal.appendChild(content);

  document.body.appendChild(modal);

  modalElements = {
    container: modal,
    content,
  };

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  return modalElements.container;
}

function openModal(doc) {
  currentDoc = doc;

  const modal = createModal();
  const { content } = modalElements;
  content.innerHTML = "";

  // Image
  const img = document.createElement("img");
  img.src = doc.strThumb;
  img.alt = doc.strSport;
  img.style.width = "100%";
  img.style.borderRadius = "8px";
  img.style.objectFit = "cover";
  content.appendChild(img);

  // Teams buttons container
  const teamsContainer = document.createElement("div");
  teamsContainer.style.display = "flex";
  teamsContainer.style.justifyContent = "space-between";
  teamsContainer.style.marginTop = "12px";
  teamsContainer.style.marginBottom = "12px";
  content.appendChild(teamsContainer);

  // Away team button (left)
  const awayBtn = document.createElement("button");
  awayBtn.textContent = doc.strAwayTeam;
  awayBtn.style.flex = "1";
  awayBtn.style.marginRight = "6px";
  awayBtn.style.padding = "8px 0";
  awayBtn.style.fontSize = "1rem";
  awayBtn.style.cursor = "pointer";
  teamsContainer.appendChild(awayBtn);

  // Home team button (right)
  const homeBtn = document.createElement("button");
  homeBtn.textContent = doc.strHomeTeam;
  homeBtn.style.flex = "1";
  homeBtn.style.marginLeft = "6px";
  homeBtn.style.padding = "8px 0";
  homeBtn.style.fontSize = "1rem";
  homeBtn.style.cursor = "pointer";
  teamsContainer.appendChild(homeBtn);

  // Selected team display (hidden initially)
  const selectedTeamDisplay = document.createElement("div");
  selectedTeamDisplay.style.margin = "10px 0";
  selectedTeamDisplay.style.fontWeight = "bold";
  selectedTeamDisplay.style.fontSize = "1.2rem";
  selectedTeamDisplay.style.display = "none";
  content.appendChild(selectedTeamDisplay);

  // Units dropdown container (hidden initially)
  const unitsContainer = document.createElement("div");
  unitsContainer.style.marginTop = "10px";
  unitsContainer.style.display = "none";
  content.appendChild(unitsContainer);

  const unitsSelect = document.createElement("select");
  unitsSelect.style.width = "100%";
  unitsSelect.style.fontSize = "1rem";
  unitsSelect.style.padding = "6px";
  unitsSelect.style.borderRadius = "6px";
  unitsSelect.style.border = "1px solid #ccc";

  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select Unit";
  defaultOption.value = "";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  unitsSelect.appendChild(defaultOption);

  units.forEach((unit) => {
    const option = document.createElement("option");
    option.textContent = unit;
    option.value = unit;
    unitsSelect.appendChild(option);
  });

  unitsContainer.appendChild(unitsSelect);

  // Selected unit display (hidden initially)
  const selectedUnitDisplay = document.createElement("div");
  selectedUnitDisplay.style.margin = "10px 0 0";
  selectedUnitDisplay.style.fontWeight = "bold";
  selectedUnitDisplay.style.fontSize = "1.2rem";
  selectedUnitDisplay.style.display = "none";
  content.appendChild(selectedUnitDisplay);

  // Buttons container
  const btnContainer = document.createElement("div");
  btnContainer.style.marginTop = "15px";
  btnContainer.style.display = "flex";
  btnContainer.style.justifyContent = "space-around";
  content.appendChild(btnContainer);

  const okBtn = document.createElement("button");
  okBtn.textContent = "OK";
  okBtn.style.padding = "8px 18px";
  okBtn.style.fontSize = "1rem";
  okBtn.style.cursor = "pointer";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.padding = "8px 18px";
  cancelBtn.style.fontSize = "1rem";
  cancelBtn.style.cursor = "pointer";

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy to Clipboard";
  copyBtn.style.padding = "8px 18px";
  copyBtn.style.fontSize = "1rem";
  copyBtn.style.cursor = "pointer";
  copyBtn.style.marginBottom = "10px";
  copyBtn.style.width = "100%";

  btnContainer.appendChild(okBtn);
  btnContainer.appendChild(cancelBtn);

  // Initial state: show team buttons, hide units dropdown and selected displays
  teamsContainer.style.display = "flex";
  unitsContainer.style.display = "none";
  selectedTeamDisplay.style.display = "none";
  selectedUnitDisplay.style.display = "none";

  // Team button click handlers
  awayBtn.onclick = () => {
    selectedTeamDisplay.textContent = doc.strAwayTeam;
    selectedTeamDisplay.style.display = "block";
    teamsContainer.style.display = "none";
    unitsContainer.style.display = "block";
  };

  homeBtn.onclick = () => {
    selectedTeamDisplay.textContent = doc.strHomeTeam;
    selectedTeamDisplay.style.display = "block";
    teamsContainer.style.display = "none";
    unitsContainer.style.display = "block";
  };

  // Units dropdown change handler
  unitsSelect.onchange = () => {
    selectedUnitDisplay.textContent = unitsSelect.value;
    selectedUnitDisplay.style.display = "block";
    unitsContainer.style.display = "none";
  };

  // Copy to Clipboard handler
  copyBtn.onclick = async () => {
    try {
      const dataUrl = await htmlToImage(content);
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      alert("Image copied to clipboard!");
    } catch (err) {
      alert("Failed to copy image: " + err.message);
    }
  };

  // Append copy button below unit display
  content.insertBefore(copyBtn, btnContainer);

  okBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;

  modalElements.container.style.display = "flex";
}

function closeModal() {
  if (modalElements.container) {
    modalElements.container.style.display = "none";
  }
}

// html-to-image utility (using html-to-image library)
// Minimal implementation:
function htmlToImage(element) {
  return new Promise((resolve, reject) => {
    import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.23/dist/html-to-image.min.js")
      .then(({ toPng }) => {
        toPng(element, { cacheBust: true })
          .then((dataUrl) => resolve(dataUrl))
          .catch((err) => reject(err));
      })
      .catch((err) => reject(err));
  });
}

// Start
loadImages();

