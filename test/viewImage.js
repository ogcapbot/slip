import { 
  getFirestore, collection, query, where, getDocs, orderBy 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { app } from "./firebaseInit.js";

const db = getFirestore(app);

function getEasternDateStringMMDDYYYY() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function createModal() {
  const modalOverlay = document.createElement("div");
  Object.assign(modalOverlay.style, {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "none",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    flexDirection: "column",
    overflowY: "auto",
  });

  const modalContent = document.createElement("div");
  Object.assign(modalContent.style, {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "15px",
    textAlign: "center",
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  });

  const modalImage = document.createElement("img");
  Object.assign(modalImage.style, {
    width: "300px",
    maxWidth: "100%",
    borderRadius: "6px",
  });

  const modalCanvas = document.createElement("canvas");
  modalCanvas.style.display = "none";
  modalCanvas.style.borderRadius = "6px";
  modalCanvas.style.width = "300px";
  modalCanvas.style.maxWidth = "100%";

  // Container for team buttons
  const teamButtonsContainer = document.createElement("div");
  Object.assign(teamButtonsContainer.style, {
    marginTop: "12px",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  });

  // Team buttons
  const awayTeamButton = document.createElement("button");
  const homeTeamButton = document.createElement("button");
  Object.assign(awayTeamButton.style, homeTeamButton.style, {
    flex: "1",
    padding: "8px",
    cursor: "pointer",
  });

  teamButtonsContainer.appendChild(awayTeamButton);
  teamButtonsContainer.appendChild(homeTeamButton);

  // Chosen team display
  const chosenTeamDisplay = document.createElement("div");
  Object.assign(chosenTeamDisplay.style, {
    marginTop: "10px",
    fontWeight: "bold",
    fontSize: "1.2rem",
    whiteSpace: "pre-line",
    display: "none",
  });

  // Units dropdown
  const unitSelect = document.createElement("select");
  unitSelect.style.marginTop = "15px";
  unitSelect.style.padding = "8px";
  unitSelect.style.fontSize = "1rem";
  unitSelect.style.width = "150px";
  unitSelect.style.display = "none";

  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy to Clipboard";
  Object.assign(copyButton.style, {
    marginTop: "12px",
    padding: "8px 16px",
    fontSize: "1rem",
    cursor: "pointer",
    display: "none",
  });

  const buttonsDiv = document.createElement("div");
  Object.assign(buttonsDiv.style, {
    marginTop: "15px",
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  });

  const okButton = document.createElement("button");
  okButton.textContent = "OK";
  Object.assign(okButton.style, { padding: "8px 16px", fontSize: "1rem", cursor: "pointer" });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  Object.assign(cancelButton.style, { padding: "8px 16px", fontSize: "1rem", cursor: "pointer" });

  buttonsDiv.appendChild(okButton);
  buttonsDiv.appendChild(cancelButton);

  modalContent.appendChild(modalImage);
  modalContent.appendChild(modalCanvas);
  modalContent.appendChild(teamButtonsContainer);
  modalContent.appendChild(chosenTeamDisplay);
  modalContent.appendChild(unitSelect);
  modalContent.appendChild(copyButton);
  modalContent.appendChild(buttonsDiv);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  let originalImage = null;
  let selectedUnit = null;
  let unitsList = [];
  let chosenTeam = null;

  async function loadUnits() {
    if (unitsList.length) return unitsList;
    const unitsCol = collection(db, "Units");
    const q = query(unitsCol, orderBy("Rank"));
    const snapshot = await getDocs(q);
    unitsList = snapshot.docs
      .map(doc => doc.data())
      .filter(u => u["Unit Fractions"])
      .map(u => u["Unit Fractions"]);
    console.log("[Modal] Loaded units:", unitsList);
    return unitsList;
  }

  function drawCanvasWithUnit(unitText) {
    const img = originalImage;
    const canvas = modalCanvas;
    const ctx = canvas.getContext("2d");

    const scale = 300 / img.naturalWidth;
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale + 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height - 40);

    ctx.fillStyle = "white";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    ctx.fillStyle = "black";
    ctx.font = "bold 20px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(unitText, canvas.width / 2, canvas.height - 20);
  }

  function resetModalState() {
    chosenTeam = null;
    selectedUnit = null;

    teamButtonsContainer.style.display = "flex";
    unitSelect.style.display = "none";
    copyButton.style.display = "none";
    chosenTeamDisplay.style.display = "none";

    chosenTeamDisplay.textContent = "";
    unitSelect.innerHTML = "";
    modalImage.style.display = "block";
    modalCanvas.style.display = "none";
  }

  teamButtonsContainer.addEventListener("click", async (event) => {
    if (event.target === awayTeamButton || event.target === homeTeamButton) {
      chosenTeam = event.target.textContent;

      // Hide team buttons, show chosen team text
      teamButtonsContainer.style.display = "none";
      chosenTeamDisplay.textContent = chosenTeam;
      chosenTeamDisplay.style.display = "block";

      // Show units dropdown now
      const units = await loadUnits();
      if (units.length > 0) {
        unitSelect.innerHTML = "";
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Select Units";
        defaultOption.value = "";
        unitSelect.appendChild(defaultOption);

        units.forEach(unit => {
          const option = document.createElement("option");
          option.value = unit;
          option.textContent = unit;
          unitSelect.appendChild(option);
        });

        unitSelect.style.display = "inline-block";
      }
    }
  });

  unitSelect.addEventListener("change", () => {
    selectedUnit = unitSelect.value;
    if (!selectedUnit) return;

    unitSelect.style.display = "none";
    modalImage.style.display = "none";
    modalCanvas.style.display = "block";
    copyButton.style.display = "inline-block";

    drawCanvasWithUnit(`${chosenTeam}\n${selectedUnit}`);
  });

  copyButton.addEventListener("click", async () => {
    try {
      modalCanvas.toBlob(async blob => {
        if (!blob) throw new Error("Canvas is empty");
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        alert("Image copied to clipboard!");
      });
    } catch (err) {
      alert("Failed to copy image: " + err.message);
    }
  });

  function closeModal() {
    modalOverlay.style.display = "none";
    modalImage.src = "";
    resetModalState();
  }

  okButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", e => {
    if (e.target === modalOverlay) closeModal();
  });

  async function show(src, awayTeam, homeTeam) {
    modalOverlay.style.display = "flex";
    resetModalState();

    modalImage.crossOrigin = "anonymous";
    modalImage.src = src;

    awayTeamButton.textContent = awayTeam;
    homeTeamButton.textContent = homeTeam;

    await new Promise((res, rej) => {
      modalImage.onload = () => res();
      modalImage.onerror = () => rej(new Error("Image failed to load"));
    });

    originalImage = modalImage;
  }

  return {
    show,
  };
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

  images.forEach(item => {
    const imgBtn = document.createElement("img");
    imgBtn.src = item.strThumb;
    imgBtn.alt = "";
    Object.assign(imgBtn.style, {
      cursor: "pointer",
      borderRadius: "4px",
      objectFit: "cover",
      width: "125px",
      height: "auto",
    });

    imgBtn.addEventListener("click", () => {
      modal.show(item.strThumb, item.strAwayTeam, item.strHomeTeam);
    });

    grid.appendChild(imgBtn);
  });

  return grid;
}

function createLeagueBadgeGrid(leagues, onLeagueClick) {
  const grid = document.createElement("div");
  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    maxWidth: "400px",
    margin: "0 auto",
    justifyItems: "center",
  });

  leagues.forEach(({ strLeague, strLeagueBadge }) => {
    const imgBtn = document.createElement("img");
    imgBtn.src = strLeagueBadge || "";
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
    });

    imgBtn.addEventListener("click", () => onLeagueClick(strLeague));
    grid.appendChild(imgBtn);
  });

  return grid;
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

  const leagues = Object.entries(leaguesGrouped).map(([leagueName, events]) => {
    const badge = events[0]?.strLeagueBadge || "";
    return { strLeague: leagueName, strLeagueBadge: badge };
  });

  function showLeagues() {
    contentContainer.innerHTML = "";
    const leagueGrid = createLeagueBadgeGrid(leagues, showLeagueEvents);
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
    const leagueBadgeUrl = leagueEvents.length ? leagueEvents[0].strLeagueBadge : "";

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

  try {
    const collRef = collection(db, "gameEvents_1");
    const q = query(collRef, where("dateEastern", "==", todayStr));
    const querySnapshot = await getDocs(q);

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
        data.strThumb &&
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
      const thumbA = a.strThumb.toLowerCase();
      const thumbB = b.strThumb.toLowerCase();
      if (thumbA < thumbB) return -1;
      if (thumbA > thumbB) return 1;
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

    for (const sport in groupedBySport) {
      const sportSection = createSportSection(sport, groupedBySport[sport], modal);
      container.appendChild(sportSection);
    }

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
