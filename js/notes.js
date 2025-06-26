document.addEventListener("DOMContentLoaded", () => {
  const yesNoteBtn = document.getElementById("yesNoteBtn");
  const noNoteBtn = document.getElementById("noNoteBtn");
  const submitNoteBtn = document.getElementById("submitNoteBtn");
  const notesInput = document.getElementById("notesInput");

  yesNoteBtn.addEventListener("click", () => {
    document.getElementById("notesChoiceSection").classList.add("hidden");
    document.getElementById("notesInputSection").classList.remove("hidden");
    document.getElementById("notesHeaderRow").style.display = "flex";
    submitNoteBtn.classList.remove("hidden");
    notesInput.value = "";
    document.getElementById("charCount").textContent = "Remaining: 100";
    notesInput.focus();
  });

  noNoteBtn.addEventListener("click", () => {
    document.getElementById("notesChoiceSection").classList.add("hidden");
    showHypePhraseStep();
  });

  submitNoteBtn.addEventListener("click", () => {
    const note = notesInput.value.trim();
    document.getElementById("notesInputSection").classList.add("hidden");
    window.latestNote = note || "N/A";
    showHypePhraseStep();
  });

  notesInput.addEventListener("input", (e) => {
    const remaining = 100 - e.target.value.length;
    document.getElementById("charCount").textContent = `Remaining: ${remaining}`;
  });
});
