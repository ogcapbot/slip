import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
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
  });

  const modalContent = document.createElement("div");
  Object.assign(modalContent.style, {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "15px",
    textAlign: "center",
    maxWidth: "90vw",
    maxHeight: "90vh",
  });

  const modalImage = document.createElement("img");
  Object.assign(modalImage.style, {
    width: "300px",
    maxWidth: "100%",
    borderRadius: "6px",
  });

  const buttonsDiv = document.createElement("div");
  Object.assign(buttonsDiv.style, {
    marginTop: "10px",
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
  modalContent.appendChild(buttonsDiv);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  function closeModal() {
    modalOverlay.style.display = "none";
    modalImage.src = "";
  }

  okButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", e => {
    if (e.target === modalOverlay) closeModal();
  });

  return {
    show: (src) => {
      modalImage.src = src;
      modalOverlay.style.display = "flex";
    },
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

  images.forEach(({ strThumb }) => {
    const imgBtn = document.createElement("img");
    imgBtn.src = strThumb;
    imgBtn.alt = "";
    Object.assign(imgBtn.style, {
      cursor: "pointer",
      borderRadius: "4px",
      objectFit: "cover",
      width: "125px",
      height: "auto",
    });

    imgBtn.addEventListener("click", () => {
      modal.show(strThumb);
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

    if (sportSection.parentElement) {
      Array.from(sportSection.parentElement.children).forEach(sibling => {
        sibling.style.display = "";
      });
    }
  }

  function showLeagueEvents(leagueName) {
    contentContainer.innerHTML = "";

    if (sportSection.parentElement) {
      Array.from(sportSection.parentElement.children).forEach(sibling => {
        if (sibling !== sportSection) {
          sibling.style.display = "none";
        }
      });
    }

    const backBtn = document.createElement("button");
    backBtn.textContent = "← Back to leagues";
    Object.assign(backBtn.style, {
      marginBottom: "12px",
      cursor: "pointer",
      padding: "6px 12px",
      fontSize: "0.9rem",
    });
    backBtn.addEventListener("click", showLeagues);

    contentContainer.appendChild(backBtn);

    const events = leaguesGrouped[leagueName] || [];
    const eventsGrid = createImageGrid(events, modal);
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
