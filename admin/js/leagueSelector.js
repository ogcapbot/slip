import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadGames } from './gameSelector.js';  // Next step selector

const leagueSelect = document.getElementById("leagueSelect");
let leagueButtonsContainer = document.getElementById("leagueButtonsContainer");

if (!leagueButtonsContainer) {
  leagueButtonsContainer = document.createElement("div");
  leagueButtonsContainer.id = "leagueButtonsContainer";

  const leagueLabel = document.querySelector('label[for="leagueSelect"]');
  if (leagueLabel) {
    leagueLabel.parentNode.insertBefore(leagueButtonsContainer, leagueLabel.nextSibling);
  } else if (leagueSelect && leagueSelect.parentNode) {
    leagueSelect.parentNode.appendChild(leagueButtonsContainer);
  } else {
    document.body.appendChild(leagueButtonsContainer);
  }
}

// Hide the original leagueSelect dropdown but keep for compatibility
if (leagueSelect) {
  leagueSelect.style.display = "none";
}

let selectedLeague = null;

export async function loadLeagues(container = null, selectedSport = null) {
  const targetContainer = container || leagueButtonsContainer;

  targetContainer.innerHTML = "";
  selectedLeague = null;

  leagueSelect.innerHTML = '<option>Select a sport first</option>';
  leagueSelect.disabled = true;

  if (!selectedSport) {
    return; // No sport selected yet, nothing to do
  }

  targetContainer.textContent = "Loading leagues...";

  try {
    const q = query(collection(db, "GameCache"), where("leagueGroup", "==", selectedSport));
    const querySnapshot = await getDocs(q);

    const leaguesSet = new Set();
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.sportName) {
        leaguesSet.add(data.sportName);
      }
    });

    if (leaguesSet.size === 0) {
      targetContainer.textContent = "No leagues found";
      leagueSelect.innerHTML = '<option>No leagues found</option>';
      leagueSelect.disabled = true;
      return;
    }

    targetContainer.textContent = "";

    const leagues = Array.from(leaguesSet).sort((a, b) => a.localeCompare(b));

    targetContainer.style.display = "grid";
    targetContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
    targetContainer.style.gridAutoRows = "min-content";
    targetContainer.style.gap = "4px 6px";
    targetContainer.style.marginTop = "8px";
    targetContainer.style.alignItems = "start";

    leagues.forEach(league => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = league;
      btn.className = "pick-btn blue";

      btn.style.paddingTop = "6px";
      btn.style.paddingBottom = "6px";
      btn.style.marginTop = "2px";
      btn.style.marginBottom = "2px";

      btn.style.width = "100%";
      btn.style.minWidth = "0";
      btn.style.boxSizing = "border-box";

      btn.addEventListener("click", () => selectLeague(league));
      targetContainer.appendChild(btn);
    });
  } catch (error) {
    targetContainer.textContent = "Error loading leagues";
    console.error("Error loading leagues:", error);
  }
}

function selectLeague(league) {
  if (selectedLeague === league) return;

  selectedLeague = league;

  leagueButtonsContainer.innerHTML = "";
  leagueButtonsContainer.style.display = "block";

  const summaryLine = document.createElement("div");
  summaryLine.textContent = `Selected League: ${league}`;
  summaryLine.style.fontWeight = "700";
  summaryLine.style.fontSize = "11px";
  summaryLine.style.fontFamily = "Oswald, sans-serif";
  summaryLine.style.marginBottom = "6px";

  leagueButtonsContainer.appendChild(summaryLine);

  // Update hidden select for compatibility
  leagueSelect.innerHTML = "";
  const option = document.createElement("option");
  option.value = league;
  option.selected = true;
  leagueSelect.appendChild(option);
  leagueSelect.disabled = false;
  leagueSelect.dispatchEvent(new Event("change"));

  // Call next selector with the selected league
  loadGames(null, league);
}
