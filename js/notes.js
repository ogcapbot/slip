// notes.js

document.getElementById("yesNoteBtn").addEventListener("click", () => {
  document.getElementById("notesChoiceSection").classList.add("hidden");
  document.getElementById("notesInputSection").classList.remove("hidden");

  document.getElementById("notesHeaderRow").style.display = "flex";
  document.getElementById("submitNoteBtn").classList.remove("hidden");

  document.getElementById("notesInput").value = "";
  document.getElementById("charCount").textContent = "Remaining: 100";

  document.getElementById("notesInput").focus();
});

document.getElementById("noNoteBtn").addEventListener("click", () => {
  document.getElementById("notesChoiceSection").classList.add("hidden");
  showHypePhraseStep();
});

document.getElementById("submitNoteBtn").addEventListener("click", () => {
  const note = document.getElementById("notesInput").value.trim();
  document.getElementById("notesInputSection").classList.add("hidden");

  window.latestNote = note || "N/A";

  showHypePhraseStep();
});

document.getElementById("notesInput").addEventListener("input", (e) => {
  const remaining = 100 - e.target.value.length;
  document.getElementById("charCount").textContent = `Remaining: ${remaining}`;
});
