// js/straightpicks.js
(() => {
  // This module handles the straight pick flow (single pick)
  // Triggered after wager and unit selection, leads to note or hype screen

  document.addEventListener("unitSelectionCompleted", () => {
    // Straight pick flow, go directly to notes
    document.dispatchEvent(new CustomEvent("notesScreenStart"));
  });
})();
