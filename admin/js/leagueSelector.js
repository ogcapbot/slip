// admin/js/leagueSelector.js
import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById("sportSelect");
const leagueSelect = document.getElementById("leagueSelect");
const gameSelect = document.getElementById("gameSelect");

const leagueButtonsContainer = document.getElementById("leagueButtonsContainer");
const gameButtonsContainer = document.getElementById("gameButtonsContainer");

// Hide the original leagueSelect dropdown but keep it for compatibility
if (leagueSelect) {
  leagueSelect.style.display = "none";
}

// Hide league buttons container initially if exists
if (leagueButtonsContainer) {
  leagueButtonsContainer.style.display = "none";
}

// Hide game select and buttons initially
if (gameSelect) {
  gameSelect.style.display = "none";
  gameSelect.disabled = true;
}
if (gameButtonsContainer) {
  gameButtonsContainer.style.display = "none";
}

let selectedLeague = null;
let changeLeagueBtn = null;

sportSelect.addEventListener("change", async () => {
  const selectedSport = sportSelect.value;
  leagueButtonsContainer.innerHTML = "";
  selectedLeague = null;
  if (changeLeagueBtn) {
    changeLeagueBtn.remove();
    changeLeagueBtn = null;
  }

  // Reset game select & hide game section
  gameSelect.innerHTML = '<option>Select a league first</option>';
  gameSelect.disabled = true;
  if (gameSelect) gameSelect.style.display = "none";
  if (gameButtonsContainer) gameButtonsContainer.style.display = "none";

  if (!selectedSport) {
    leagueSelect.value = "";
    leagueSelect.disabled = true;
    if (leagueSelect) leagueSelect.style.display = "none";
    if (leagueButtonsContainer) leagueButtonsContainer.style.display = "none";
    return;
  }

  leagueSelect.disabled = true;
  leagueSelect.value = "";
  leagueSelect.style.display = "none"; // Hide the select, show buttons only

  leagueButtonsContainer.textContent = "Loading leagues...";
  leagueButtonsContainer.style.display = "";

  try {
    const q = query(collection(db, "GameCache"), where("Sport", "==", selectedSport));
    const querySnapshot = await getDocs(q);

    const leaguesSet = new Set();
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.League) {
        leaguesSet.add(data.League);
      }
    });

    if (leaguesSet.size === 0) {
      leagueButtonsContainer.textContent = "No leagues found";
      leagueSelect.innerHTML = '<option>No leagues found</option>';
      leagueSelect.disabled = true;
      return;
    }

    leagueButtonsContainer.textContent = "";

    const leagues = Array.from(leaguesSet).sort((a, b) => a.localeCompare(b));

    // Style container as 3-column CSS grid with tight gaps
    leagueButtonsContainer.style.display = "grid";
    leagueButtonsContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
    leagueButtonsContainer.style.gridAutoRows = "min-content";
    leagueButtonsContainer.style.gap = "4px 6px"; // vertical 4px, horizontal 6px
    leagueButtonsContainer.style.marginTop = "8px";
    leagueButtonsContainer.style.alignItems = "start";

    // Create and append league buttons
    leagues.forEach(league => {
      leagueButtonsContainer.appendChild(createLeagueButton(league));
    });
  } catch (error) {
    leagueButtonsContainer.textContent = "Error loading leagues";
    console.error("Error loading leagues:", error);
  }
});

function createLeagueButton(league) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = league;
  btn.className = "pick-btn blue";

  // Reduced padding and margin for tighter vertical spacing like sport buttons
  btn.style.paddingTop = "6px";
  btn.style.paddingBottom = "6px";
  btn.style.marginTop = "2px";
  btn.style.marginBottom = "2px";

  btn.style.width = "100%";
  btn.style.minWidth = "0";
  btn.style.boxSizing = "border-box";

  btn.addEventListener("click", () => selectLeague(btn, league));

  return btn;
}

function selectLeague(button, league) {
  if (selectedLeague === league) return;

  selectedLeague = league;

  // Update hidden dropdown for form compatibility
  leagueSelect.innerHTML = "";
  const option = document.createElement("option");
  option.value = league;
  option.selected = true;
  leagueSelect.appendChild(option);
  leagueSelect.disabled = false;
  leagueSelect.style.display = "none"; // keep hidden, use buttons only
  leagueSelect.dispatchEvent(new Event("change"));

  // Clear and rebuild leagueButtonsContainer with only selected and change button
  leagueButtonsContainer.innerHTML = "";

  leagueButtonsContainer.style.display = "grid";
  leagueButtonsContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
  leagueButtonsContainer.style.gridAutoRows = "min-content";
  leagueButtonsContainer.style.gap = "4px 6px";
  leagueButtonsContainer.style.marginTop = "8px";
  leagueButtonsContainer.style.alignItems = "start";

  // Selected league button green, first grid cell
  const selectedBtn = createLeagueButton(league);
  selectedBtn.classList.remove("blue");
  selectedBtn.classList.add("green");
  leagueButtonsContainer.appendChild(selectedBtn);

  // Invisible placeholder button for middle cell
  const placeholderBtn = createLeagueButton("");
  placeholderBtn.style.visibility = "hidden";
  placeholderBtn.style.pointerEvents = "none";
  placeholderBtn.style.margin = "0";
  placeholderBtn.style.padding = "0";
  placeholderBtn.style.height = selectedBtn.offsetHeight ? selectedBtn.offsetHeight + "px" : "36px";
  leagueButtonsContainer.appendChild(placeholderBtn);

  // Change League button in third grid cell
  if (!changeLeagueBtn) {
    changeLeagueBtn = document.createElement("button");
    changeLeagueBtn.type = "button";
    changeLeagueBtn.textContent = "Change League";
    changeLeagueBtn.className = "pick-btn blue";
    changeLeagueBtn.style.minWidth = "120px";
    changeLeagueBtn.style.width = "100%";
    changeLeagueBtn.style.boxSizing = "border-box";
    changeLeagueBtn.style.alignSelf = "flex-start";
    changeLeagueBtn.style.marginTop = "0";

    changeLeagueBtn.addEventListener("click", () => {
      resetLeagueSelection();
    });
  }
  leagueButtonsContainer.appendChild(changeLeagueBtn);

  // Show game select and game buttons container
  if (gameSelect) {
    gameSelect.style.display = '';
    gameSelect.disabled = false;
  }
  if (gameButtonsContainer) {
    gameButtonsContainer.style.display = '';
  }
}

function resetLeagueSelection() {
  selectedLeague = null;

  if (changeLeagueBtn) {
    changeLeagueBtn.remove();
    changeLeagueBtn = null;
  }

  leagueSelect.innerHTML = '<option value="" disabled selected>Choose League</option>';
  leagueSelect.disabled = true;
  leagueSelect.style.display = 'none';
  leagueSelect.dispatchEvent(new Event("change"));

  leagueButtonsContainer.innerHTML = "";
  leagueButtonsContainer.style.display = "none";

  // Hide game select and buttons too
  if (gameSelect) {
    gameSelect.style.display = "none";
    gameSelect.disabled = true;
  }
  if (gameButtonsContainer) {
    gameButtonsContainer.style.display = "none";
  }
}

export default {};
