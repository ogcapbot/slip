import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const sportSelect = document.getElementById("sportSelect");
const leagueSelect = document.getElementById("leagueSelect");
const gameSelect = document.getElementById("gameSelect");

// Hide the original leagueSelect dropdown but keep it for compatibility
if (leagueSelect) {
  leagueSelect.style.display = "none";
}

let leagueButtonsContainer = document.getElementById("leagueButtonsContainer");
if (!leagueButtonsContainer) {
  leagueButtonsContainer = document.createElement("div");
  leagueButtonsContainer.id = "leagueButtonsContainer";

  // Insert the container after the league label
  const leagueLabel = document.querySelector('label[for="leagueSelect"]');
  if (leagueLabel) {
    leagueLabel.parentNode.insertBefore(leagueButtonsContainer, leagueLabel.nextSibling);
  } else {
    // fallback append to parent of leagueSelect or body
    if (leagueSelect && leagueSelect.parentNode) {
      leagueSelect.parentNode.appendChild(leagueButtonsContainer);
    } else {
      document.body.appendChild(leagueButtonsContainer);
    }
  }
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

  // Reset game select
  gameSelect.innerHTML = '<option>Select a league first</option>';
  gameSelect.disabled = true;

  if (!selectedSport) {
    leagueSelect.value = "";
    leagueSelect.disabled = true;
    return;
  }

  leagueSelect.disabled = true;
  leagueSelect.value = "";

  leagueButtonsContainer.textContent = "Loading leagues...";

  try {
    // Updated to use 'leagueGroup' field to filter by sport
    const q = query(collection(db, "GameCache"), where("leagueGroup", "==", selectedSport));
    const querySnapshot = await getDocs(q);

    const leaguesSet = new Set();
    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Use sportName field as league identifier
      if (data && data.sportName) {
        leaguesSet.add(data.sportName);
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
}

function resetLeagueSelection() {
  selectedLeague = null;

  if (changeLeagueBtn) {
    changeLeagueBtn.remove();
    changeLeagueBtn = null;
  }

  leagueSelect.innerHTML = '<option value="" disabled selected>Choose League</option>';
  leagueSelect.disabled = true;
  leagueSelect.dispatchEvent(new Event("change"));

  leagueButtonsContainer.innerHTML = "";
}

export default {};
