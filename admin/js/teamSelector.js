// teamSelector.js
// Loads teams for selected game, handles team selection,
// updates summary display, hides buttons, and moves to next step (wager input).

import { db } from "../firebaseInit.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { loadWager } from './wagerSelector.js';  // next step after team selection

const teamSelect = document.getElementById("teamSelect");
let teamButtonsContainer = document.getElementById("teamButtonsContainer");

if (!teamButtonsContainer) {
  teamButtonsContainer = document.createElement("div");
  teamButtonsContainer.id = "teamButtonsContainer";

  const teamLabel = document.querySelector('label[for="teamSelect"]');
  if (teamLabel) {
    teamLabel.parentNode.insertBefore(teamButtonsContainer, teamLabel.nextSibling);
  } else if (teamSelect && teamSelect.parentNode) {
    teamSelect.parentNode.insertBefore(teamButtonsContainer, teamSelect.nextSibling);
  } else {
    document.body.appendChild(teamButtonsContainer);
  }
}

if (teamSelect) {
  teamSelect.style.display = "none";
}

let selectedTeam = null;

/**
 * Loads team buttons for the selected game.
 * @param {HTMLElement|null} container Optional override container.
 * @param {Object|null} selectedGameData Game data containing teams.
 */
export async function loadTeams(container = null, selectedGameData = null) {
  const targetContainer = container || teamButtonsContainer;

  console.log('[teamSelector.js:33] loadTeams called with selectedGameData:', selectedGameData);

  targetContainer.innerHTML = "";
  selectedTeam = null;

  if (teamSelect) {
    teamSelect.innerHTML = '<option>Select a game first</option>';
    teamSelect.disabled = true;
  }

  if (!selectedGameData) {
    targetContainer.textContent = "No game selected.";
    console.warn('[teamSelector.js:43] No game data provided to load teams.');
    return;
  }

  targetContainer.textContent = "Loading teams...";

  try {
    // Extract teams from game data: homeTeam and awayTeam
    const teams = [];
    if (selectedGameData.homeTeam) teams.push(selectedGameData.homeTeam);
    if (selectedGameData.awayTeam) teams.push(selectedGameData.awayTeam);

    if (teams.length === 0) {
      targetContainer.textContent = "No teams found";
      if (teamSelect) {
        teamSelect.innerHTML = '<option>No teams found</option>';
        teamSelect.disabled = true;
      }
      console.warn('[teamSelector.js:60] No teams found in game data.');
      return;
    }

    targetContainer.textContent = "";

    targetContainer.style.display = "grid";
    targetContainer.style.gridTemplateColumns = "repeat(2, 1fr)";
    targetContainer.style.gap = "4px 6px";
    targetContainer.style.marginTop = "8px";
    targetContainer.style.alignItems = "start";

    teams.forEach(team => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = team;
      btn.className = "pick-btn blue";
      btn.style.width = "100%";
      btn.style.minWidth = "0";
      btn.style.boxSizing = "border-box";

      btn.addEventListener("click", () => {
        selectTeam(team, selectedGameData);
      });

      targetContainer.appendChild(btn);
      console.log(`[teamSelector.js:80] Created button for team: ${team}`);
    });

    if (teamSelect) {
      teamSelect.disabled = false;
    }

    console.log('[teamSelector.js:86] All team buttons created and appended.');

  } catch (error) {
    console.error('[teamSelector.js:89] Error loading teams:', error);
    targetContainer.textContent = "Error loading teams";
  }
}

/**
 * Handles team selection:
 * - Updates summary
 * - Hides team buttons container
 * - Updates hidden select
 * - Calls next step loader (wager)
 * @param {string} team Selected team name
 * @param {Object} selectedGameData The game data object for reference in next steps
 */
function selectTeam(team, selectedGameData) {
  if (selectedTeam === team) {
    console.log('[teamSelector.js:102] Selected team is the same as current; ignoring.');
    return;
  }

  selectedTeam = team;
  console.log(`[teamSelector.js:107] selectTeam called for team: ${team}`);

  // Clear team buttons container and show summary line
  if (teamButtonsContainer) {
    teamButtonsContainer.innerHTML = "";
    teamButtonsContainer.style.display = "block";

    const summaryLine = document.createElement("div");
    summaryLine.textContent = `Selected Team: ${team}`;
    summaryLine.style.fontWeight = "700";
    summaryLine.style.fontSize = "11px";
    summaryLine.style.fontFamily = "Oswald, sans-serif";
    summaryLine.style.marginBottom = "6px";

    teamButtonsContainer.appendChild(summaryLine);
    console.log('[teamSelector.js:120] Team summary updated.');
  } else {
    console.warn('[teamSelector.js:123] teamButtonsContainer not found.');
  }

  // Update hidden select for compatibility
  if (teamSelect) {
    teamSelect.innerHTML = "";
    const option = document.createElement("option");
    option.value = team;
    option.selected = true;
    teamSelect.appendChild(option);
    teamSelect.disabled = false;
    teamSelect.dispatchEvent(new Event("change"));
    console.log('[teamSelector.js:133] Hidden teamSelect updated and change event dispatched.');
  }

  // Hide team buttons container (progress UI flow)
  teamButtonsContainer.style.display = "none";

  // Proceed to next step: load wager selector with current game and team
  // You can modify loadWager to accept parameters as needed
  if (typeof loadWager === "function") {
    console.log('[teamSelector.js:141] Calling loadWager with selectedGameData and team.');
    loadWager(null, selectedGameData, team);
  } else {
    console.warn('[teamSelector.js:144] loadWager function not found or not imported.');
  }
}
