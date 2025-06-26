// js/note.js
(() => {
  const notesChoiceSection = document.getElementById("notesChoiceSection");
  const notesInputSection = document.getElementById("notesInputSection");
  const notesInput = document.getElementById("notesInput");
  const submitNoteBtn = document.getElementById("submitNoteBtn");
  const charCount = document.getElementById("charCount");

  document.addEventListener("notesScreenStart", () => {
    notesChoiceSection.classList.remove("hidden");
    notesInputSection.classList.add("hidden");
    notesInput.value = "";
    charCount.textContent = "Remaining: 100";
  });

  document.getElementById("yesNoteBtn").addEventListener("click", () => {
    notesChoiceSection.classList.add("hidden");
    notesInputSection.classList.remove("hidden");
    document.getElementById("notesHeaderRow").style.display = "flex";
    submitNoteBtn.classList.remove("hidden");
    notesInput.focus();
  });

  document.getElementById("noNoteBtn").addEventListener("click", () => {
    notesChoiceSection.classList.add("hidden");
    notesInputSection.classList.add("hidden");
    window.AppState.latestNote = "N/A";
    document.dispatchEvent(new CustomEvent("showHypePhraseScreen"));
  });

  submitNoteBtn.addEventListener("click", () => {
    const note = notesInput.value.trim() || "N/A";
    window.AppState.latestNote = note;
    notesInputSection.classList.add("hidden");
    document.dispatchEvent(new CustomEvent("showHypePhraseScreen"));
  });

  notesInput.addEventListener("input", e => {
    const remaining = 100 - e.target.value.length;
    charCount.textContent = `Remaining: ${remaining}`;
  });
})();
