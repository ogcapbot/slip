(() => {
  document.addEventListener("unitSelectionCompleted", () => {
    if (window.AppState.pickType === "straight") {
      document.dispatchEvent(new CustomEvent("notesScreenStart"));
    }
  });
})();
