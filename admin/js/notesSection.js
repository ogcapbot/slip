// admin/js/notesSection.js
const form = document.getElementById('pickForm');
const unitsSelect = document.getElementById('unitsSelect');
const submitButton = form.querySelector('button[type="submit"]');

// Create container for notes question
const notesContainer = document.createElement('div');
notesContainer.id = 'notesContainer';
notesContainer.style.marginTop = '15px';
notesContainer.style.display = 'none'; // hidden initially

// Question label
const questionLabel = document.createElement('label');
questionLabel.textContent = 'Do you want to provide Official Pick Notes/Comments?';
questionLabel.style.display = 'block';
questionLabel.style.marginBottom = '8px';

// Buttons container
const buttonsDiv = document.createElement('div');
buttonsDiv.style.display = 'flex';
buttonsDiv.style.gap = '12px';
buttonsDiv.style.marginBottom = '8px';

// Yes button
const yesBtn = document.createElement('button');
yesBtn.type = 'button';
yesBtn.textContent = 'Yes';
yesBtn.className = 'pick-btn blue';
yesBtn.style.flex = '1';

// No button
const noBtn = document.createElement('button');
noBtn.type = 'button';
noBtn.textContent = 'No';
noBtn.className = 'pick-btn blue';
noBtn.style.flex = '1';

// Character counter
const charCounter = document.createElement('div');
charCounter.style.textAlign = 'right';
charCounter.style.fontSize = '0.85rem';
charCounter.style.color = '#555';
charCounter.style.marginBottom = '4px';
charCounter.style.display = 'none'; // hidden initially

// Textarea for notes
const notesTextarea = document.createElement('textarea');
notesTextarea.rows = 2;
notesTextarea.maxLength = 100;
notesTextarea.style.width = '100%';
notesTextarea.style.resize = 'none';
notesTextarea.style.display = 'none'; // hidden initially
notesTextarea.placeholder = 'Enter your notes/comments here (max 100 chars)';

// Append buttons to buttonsDiv
buttonsDiv.appendChild(yesBtn);
buttonsDiv.appendChild(noBtn);

// Append all to notesContainer
notesContainer.appendChild(questionLabel);
notesContainer.appendChild(buttonsDiv);
notesContainer.appendChild(charCounter);
notesContainer.appendChild(notesTextarea);

// Insert notesContainer right after unitsSelect in DOM
unitsSelect.parentNode.insertBefore(notesContainer, unitsSelect.nextSibling);

// State variables
let notesSelected = null; // 'yes' or 'no'

// Helper to clear button states
function clearButtonStates() {
  yesBtn.classList.remove('green');
  yesBtn.classList.add('blue');
  noBtn.classList.remove('green');
  noBtn.classList.add('blue');
}

// Show the notesContainer when appropriate (after units selected)
unitsSelect.addEventListener('change', () => {
  // Only show notesContainer if unitsSelect has a value
  if (unitsSelect.value) {
    notesContainer.style.display = 'block';
    submitButton.disabled = true; // disable submit until notes question answered
    resetNotesSection();
  } else {
    notesContainer.style.display = 'none';
    submitButton.disabled = true;
    resetNotesSection();
  }
});

// Reset notes section UI
function resetNotesSection() {
  clearButtonStates();
  notesSelected = null;
  notesTextarea.value = '';
  notesTextarea.style.display = 'none';
  charCounter.style.display = 'none';
  submitButton.disabled = true;
}

// Handle No button click
noBtn.addEventListener('click', () => {
  clearButtonStates();
  noBtn.classList.remove('blue');
  noBtn.classList.add('green');

  notesSelected = 'no';
  notesTextarea.style.display = 'none';
  charCounter.style.display = 'none';

  // Enable submit, no notes to input
  submitButton.disabled = false;
});

// Handle Yes button click
yesBtn.addEventListener('click', () => {
  clearButtonStates();
  yesBtn.classList.remove('blue');
  yesBtn.classList.add('green');

  notesSelected = 'yes';
  notesTextarea.style.display = 'block';
  charCounter.style.display = 'block';

  notesTextarea.focus();
  submitButton.disabled = true; // disable submit until textarea input

  updateCharCounter(); // init counter
});

// Update character counter display
function updateCharCounter() {
  const remaining = 100 - notesTextarea.value.length;
  charCounter.textContent = `${remaining} characters left`;

  // Enable submit if textarea has text, disable if empty
  submitButton.disabled = notesTextarea.value.trim().length === 0;
}

// Listen for textarea input changes
notesTextarea.addEventListener('input', () => {
  updateCharCounter();
});

// Exported function to get notes data for submit
function getNotesData() {
  if (notesSelected === 'yes') {
    return notesTextarea.value.trim();
  }
  return null;
}

// Export init function to allow manual reset if needed
function reset() {
  resetNotesSection();
  notesContainer.style.display = 'none';
}

export { getNotesData, reset };
