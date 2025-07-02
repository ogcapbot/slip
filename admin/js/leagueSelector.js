import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadGames } from './gameSelector.js';  // Next step selector

const leagueSelect = document.getElementById("leagueSelect");
let leagueButtonsContainer = document.getElementById("leagueButtonsContainer");

if (!leagueButtonsContainer) {
  console.log("[LeagueSelector] leagueButtonsContainer not found, creating new container.");
  leagueButtonsContainer = document.createElement("div");
  leagueButtonsContainer.id = "leagueButtonsContainer";

  const leagueLabel = document.querySelector('label[for="leagueSelect"]');
  if (leagueLabel) {
    console.log("[LeagueSelector] Inserting leagueButtonsContainer after label.");
    leagueLabel.parentNode.insertBefore(leagueButtonsContainer, leagueLabel.nextSibling);
  } else if (leagueSelect && leagueSelect.parentNode) {
    console.log("[LeagueSelector] Appending leagueButtonsContainer to leagueSelect parent.");
    leagueSelect.parentNode.appendChild(leagueButtonsContainer);
  } else {
    console.log("[LeagueSelector] Appending leagueButtonsContainer to document.body.");
    document.body.appendChild(leagueButtonsContainer);
  }
} else {
  console.log("[LeagueSelector] leagueButtonsContainer found.");
}

if (leagueSelect) {
  leagueSelect.style.display = "none";
  console.log("[LeagueSelector] leagueSelect dropdown hidden.");
}

let selectedLeague = null;

export async function loadLeagues(container = null, selectedSport = null) {
  const targetContainer = container || leagueButtonsContainer;

  console.log("[LeagueSelector] loadLeagues called with selectedSport:", selectedSport);
  targetContainer.innerHTML = "";
  selectedLeague = null;

  leagueSelect.innerHTML = '<option>Select a sport first</option>';
  leagueSelect.disabled = true;

  if (!selectedSport) {
    console.log("[LeagueSelector] No sport selected, exiting loadLeagues.");
    return; // No sport selected yet, nothing to do
  }

  targetContainer.textContent = "Loading leagues...";

  try {
    const q = query(collection(db, "GameCache"), where("leagueGroup", "==", selectedSport));
    console.log("[LeagueSelector] Querying GameCache for leagueGroup == ", selectedSport);
    const querySnapshot = await getDocs(q);

    console.log("[LeagueSelector] Retrieved league documents count:", querySnapshot.size);

    const leaguesSet = new Set();
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.sportName) {
        leaguesSet.add(data.sportName);
        console.log("[LeagueSelector] Found league:", data.sportName);
      }
    });

    if (leaguesSet.size === 0) {
      console.log("[LeagueSelector] No leagues found for sport:", selectedSport);
      targetContainer.textContent = "No leagues found";
      leagueSelect.innerHTML = '<option>No leagues found</option>';
      leagueSelect.disabled = true;
      return;
    }

    targetContainer.textContent = "";

    const leagues = Array.from(leaguesSet).sort((a, b) => a.localeCompare(b));
    console.log("[LeagueSelector] Sorted leagues:", leagues);

    targetContainer.style.display = "grid";
    targetContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
    targetContainer.style.gridAutoRows = "min-content";
    targetContainer.style.gap = "4px 6px";
    targetContainer.style.marginTop = "8px";
    targetContainer.style.alignItems = "start";

    leagues.forEach(league => {
      console.log("[LeagueSelector] Creating button for league:", league);
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

    console.log("[LeagueSelector] All league buttons created and appended.");

  } catch (error) {
    targetContainer.textContent = "Error loading leagues";
    console.error("[LeagueSelector] Error loading leagues:", error);
  }
}

function selectLeague(league) {
  console.log("[LeagueSelector] selectLeague called with:", league);
  if (selectedLeague === league) {
    console.log("[LeagueSelector] League already selected, ignoring:", league);
    return;
  }

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

  leagueSelect.innerHTML = "";
  const option = document.createElement("option");
  option.value = league;
  option.selected = true;
  leagueSelect.appendChild(option);
  leagueSelect.disabled = false;
  leagueSelect.dispatchEvent(new Event("change"));

  console.log("[LeagueSelector] Hidden select updated and change event dispatched.");

  // Call next selector with the selected league
  console.log("[LeagueSelector] Calling loadGames with league:", league);
  loadGames(null, league);
}

export function resetLeagueSelectorState() {
  console.log("[LeagueSelector] resetLeagueSelectorState called.");
  selectedLeague = null;
  if (leagueButtonsContainer) {
    leagueButtonsContainer.innerHTML = "";
  }
  if (leagueSelect) {
    leagueSelect.innerHTML = "";
    leagueSelect.dispatchEvent(new Event("change"));
  }
}
