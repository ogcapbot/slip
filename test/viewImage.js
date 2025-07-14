import { db } from "./firebaseInit.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


let units = [];
let currentDoc = null;

const modalElements = {
  container: null,
  content: null,
};

window.onload = async () => {
  await loadUnits();
  await loadImages();
};

async function loadUnits() {
  const unitsCol = collection(db, "Units");
  const q = query(unitsCol, orderBy("Rank"));
  const snapshot = await getDocs(q);
  units = snapshot.docs.map(doc => doc.data()["Unit Fractions"]);
}

async function loadImages() {
  const imagesCol = collection(db, "gameEvents_1");
  const q = query(imagesCol, orderBy("strSport"), orderBy("strLeague"));
  const snapshot = await getDocs(q);
  const docs = snapshot.docs
    .map(doc => doc.data())
    .filter(doc => doc.strStatus !== "FT" && doc.strThumb && doc.strSport && doc.strLeague);

  const grouped = groupBySportAndLeague(docs);
  showSports(grouped);
}

function groupBySportAndLeague(docs) {
  const grouped = {};
  docs.forEach(doc => {
    if (!grouped[doc.strSport]) grouped[doc.strSport] = {};
    if (!grouped[doc.strSport][doc.strLeague]) grouped[doc.strSport][doc.strLeague] = [];
    grouped[doc.strSport][doc.strLeague].push(doc);
  });
  return grouped;
}

function showSports(groupedData) {
  const container = document.getElementById("imagesContainer");
  container.innerHTML = "";
  for (const sport in groupedData) {
    const sportSection = document.createElement("section");
    const sportTitle = document.createElement("h4");
    sportTitle.textContent = sport;
    sportSection.appendChild(sportTitle);

    const leaguesContainer = document.createElement("div");
    leaguesContainer.style.display = "flex";
    leaguesContainer.style.flexWrap = "wrap";
    leaguesContainer.style.gap = "12px";
    sportSection.appendChild(leaguesContainer);

    for (const league in groupedData[sport]) {
      const leagueData = groupedData[sport][league];
      const leagueImg = leagueData[0].strLeagueBadge;

      const leagueBtn = document.createElement("button");
      leagueBtn.style.border = "none";
      leagueBtn.style.background = "transparent";
      leagueBtn.style.cursor = "pointer";
      leagueBtn.style.padding = "4px";
      leagueBtn.style.borderRadius = "8px";

      const img = document.createElement("img");
      img.src = leagueImg;
      img.alt = league;
      img.style.width = "80px";
      img.style.height = "80px";
      img.style.objectFit = "contain";
      leagueBtn.appendChild(img);

      leagueBtn.onclick = () => {
        showLeagueEvents(sport, league, leagueData);
      };

      leaguesContainer.appendChild(leagueBtn);
    }

    container.appendChild(sportSection);
  }
}

function showLeagueEvents(sport, league, events) {
  const container = document.getElementById("imagesContainer");
  container.innerHTML = "";

  const backBtn = document.createElement("button");
  backBtn.textContent = "← Back to leagues";
  backBtn.style.marginBottom = "20px";
  backBtn.style.padding = "6px 12px";
  backBtn.style.cursor = "pointer";
  backBtn.onclick = () => loadImages();
  container.appendChild(backBtn);

  const header = document.createElement("h3");
  header.style.textAlign = "center";
  header.style.marginBottom = "20px";
  header.textContent = `${sport} - ${league}`;
  container.appendChild(header);

  const eventsGrid = document.createElement("div");
  eventsGrid.style.display = "grid";
  eventsGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))";
  eventsGrid.style.gap = "12px";
  container.appendChild(eventsGrid);

  events.forEach(event => {
    const eventBtn = document.createElement("button");
    eventBtn.style.border = "none";
    eventBtn.style.background = "transparent";
    eventBtn.style.padding = "0";
    eventBtn.style.cursor = "pointer";
    eventBtn.style.borderRadius = "8px";
    eventBtn.style.overflow = "hidden";

    const img = document.createElement("img");
    img.src = event.strThumb;
    img.alt = `${event.strAwayTeam} vs ${event.strHomeTeam}`;
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.objectFit = "cover";
    eventBtn.appendChild(img);

    eventBtn.onclick = () => openModal(event);
    eventsGrid.appendChild(eventBtn);
  });
}

function createModal() {
  if (!modalElements.container) {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.backgroundColor = "rgba(0,0,0,0.6)";
    container.style.display = "none";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.zIndex = "1000";

    const content = document.createElement("div");
    content.style.background = "#fff";
    content.style.borderRadius = "12px";
    content.style.padding = "16px";
    content.style.width = "320px";
    content.style.maxHeight = "90vh";
    content.style.overflowY = "auto";
    content.style.boxSizing = "border-box";
    content.style.textAlign = "center";
    container.appendChild(content);

    document.body.appendChild(container);

    modalElements.container = container;
    modalElements.content = content;
  }
  return modalElements;
}

function openModal(doc) {
  currentDoc = doc;
  const modal = createModal();
  const { container, content } = modal;

  content.innerHTML = "";

  const img = document.createElement("img");
  img.src = doc.strThumb;
  img.alt = `${doc.strAwayTeam} vs ${doc.strHomeTeam}`;
  img.style.width = "100%";
  img.style.borderRadius = "8px";
  img.style.objectFit = "cover";
  content.appendChild(img);

  const teamsContainer = document.createElement("div");
  teamsContainer.style.display = "flex";
  teamsContainer.style.justifyContent = "space-between";
  teamsContainer.style.marginTop = "12px";
  teamsContainer.style.marginBottom = "12px";
  content.appendChild(teamsContainer);

  const homeBtn = document.createElement("button");
  homeBtn.textContent = doc.strHomeTeam;
  homeBtn.style.flex = "1";
  homeBtn.style.marginRight = "6px";
  homeBtn.style.padding = "6px 0";
  homeBtn.style.fontSize = "0.9rem";
  homeBtn.style.cursor = "pointer";
  homeBtn.style.whiteSpace = "nowrap";

  const awayBtn = document.createElement("button");
  awayBtn.textContent = doc.strAwayTeam;
  awayBtn.style.flex = "1";
  awayBtn.style.marginLeft = "6px";
  awayBtn.style.padding = "6px 0";
  awayBtn.style.fontSize = "0.9rem";
  awayBtn.style.cursor = "pointer";
  awayBtn.style.whiteSpace = "nowrap";

  // Flip buttons: awayBtn left, homeBtn right
  teamsContainer.appendChild(awayBtn);
  teamsContainer.appendChild(homeBtn);

  const selectedTeamDisplay = document.createElement("div");
  selectedTeamDisplay.style.margin = "10px 0 0";
  selectedTeamDisplay.style.fontWeight = "bold";
  selectedTeamDisplay.style.fontSize = "1.2rem";
  selectedTeamDisplay.style.display = "none";
  content.appendChild(selectedTeamDisplay);

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

  units.forEach(unit => {
    const option = document.createElement("option");
    option.textContent = unit;
    option.value = unit;
    unitsSelect.appendChild(option);
  });

  unitsContainer.appendChild(unitsSelect);

  const selectedUnitDisplay = document.createElement("div");
  selectedUnitDisplay.style.margin = "10px 0 0";
  selectedUnitDisplay.style.fontWeight = "bold";
  selectedUnitDisplay.style.fontSize = "1.2rem";
  selectedUnitDisplay.style.display = "none";
  content.appendChild(selectedUnitDisplay);

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy to Clipboard";
  copyBtn.style.padding = "8px 18px";
  copyBtn.style.fontSize = "1rem";
  copyBtn.style.cursor = "pointer";
  copyBtn.style.margin = "10px auto 0";
  copyBtn.style.display = "none";
  copyBtn.style.width = "100%";
  content.appendChild(copyBtn);

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

  btnContainer.appendChild(okBtn);
  btnContainer.appendChild(cancelBtn);

  teamsContainer.style.display = "flex";
  unitsContainer.style.display = "none";
  selectedTeamDisplay.style.display = "none";
  selectedUnitDisplay.style.display = "none";
  copyBtn.style.display = "none";

  homeBtn.onclick = () => {
    selectedTeamDisplay.textContent = doc.strHomeTeam;
    selectedTeamDisplay.style.display = "block";
    teamsContainer.style.display = "none";
    unitsContainer.style.display = "block";
  };
  awayBtn.onclick = () => {
    selectedTeamDisplay.textContent = doc.strAwayTeam;
    selectedTeamDisplay.style.display = "block";
    teamsContainer.style.display = "none";
    unitsContainer.style.display = "block";
  };

  unitsSelect.onchange = () => {
    selectedUnitDisplay.textContent = unitsSelect.value;
    selectedUnitDisplay.style.display = "block";
    unitsContainer.style.display = "none";
    copyBtn.style.display = "block";
  };

  copyBtn.onclick = async () => {
    try {
      const module = await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.23/lib/html-to-image.min.js");
      const dataUrl = await module.toPng(content, { cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      alert("Image copied to clipboard!");
    } catch (err) {
      alert("Failed to copy image: " + err.message);
    }
  };

  okBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;

  container.style.display = "flex";
}

function closeModal() {
  if (modalElements.container) {
    modalElements.container.style.display = "none";
    modalElements.content.innerHTML = "";
  }
}
