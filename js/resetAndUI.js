// resetAndUI.js

function resetSearch() {
  matches = [];
  currentMatchIndex = 0;
  selectedMatch = null;
  window.overrideTeamName = null;
  window.selectedHypeRow = null;
  window.selectedHypePostTitle = null;
  window.selectedHypeNote = null;
  window.latestNote = null;
  window.overrideTitle = null;
  window.currentWagerWithNum = null;

  document.getElementById("teamSearch").value = "";
  const wagerDropdown = document.getElementById("wagerDropdown");
  if (wagerDropdown) wagerDropdown.selectedIndex = 0;

  const wagerTypeInput = document.getElementById("wagerType");
  if (wagerTypeInput) wagerTypeInput.value = "";

  const unitDropdown = document.getElementById("unitDropdown");
  if (unitDropdown) unitDropdown.selectedIndex = 0;

  document.getElementById("notesInput").value = "";

  document.getElementById("searchError").textContent = "";
  const wagerError = document.getElementById("wagerError");
  if (wagerError) wagerError.textContent = "";
  const unitDropdownError = document.getElementById("unitDropdownError");
  if (unitDropdownError) unitDropdownError.textContent = "";
  const numInputError = document.getElementById("numInputError");
  if (numInputError) numInputError.textContent = "";

  const toHide = [
    "gameSuggestion",
    "customInputSection",
    "unitDropdownSection",
    "notesChoiceSection",
    "notesInputSection",
    "confirmOutput",
    "submitNoteBtn",
    "hypePhraseStep"
  ];
  toHide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  const hypeASelect = document.getElementById("hypeASelect");
  if (hypeASelect) hypeASelect.selectedIndex = 0;
  const hypeBSelect = document.getElementById("hypeBSelect");
  if (hypeBSelect) {
    hypeBSelect.innerHTML = '<option value="">-- Select Energy of Hype Phrase --</option>';
    hypeBSelect.disabled = true;
  }
  const hypePhraseOutputs = document.getElementById("hypePhraseOutputs");
  if (hypePhraseOutputs) hypePhraseOutputs.innerHTML = "";

  const confirmOutput = document.getElementById("confirmOutput");
  if (confirmOutput) {
    confirmOutput.classList.add("hidden");
    confirmOutput.innerHTML = "";
  }
  const toggleBtn = document.getElementById("toggleImageBtn");
  if (toggleBtn) toggleBtn.remove();

  const postContainer = document.getElementById("postTitleDescContainer");
  postContainer.innerHTML = "";

  const inputLabel = document.getElementById("inputLabel");
  const teamSearch = document.getElementById("teamSearch");
  const searchBtn = document.getElementById("searchBtn");

  if (inputLabel) {
    inputLabel.classList.remove("hidden");
    inputLabel.style.display = "";
  }
  if (teamSearch) {
    teamSearch.classList.remove("hidden");
    teamSearch.style.display = "";
    teamSearch.focus();
  }
  if (searchBtn) {
    searchBtn.classList.remove("hidden");
    searchBtn.style.display = "";
  }

  const gameSuggestion = document.getElementById("gameSuggestion");
  if (gameSuggestion) gameSuggestion.classList.add("hidden");
}

document.getElementById("resetBtn").addEventListener("click", resetSearch);
