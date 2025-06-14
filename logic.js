let wagerCount = 0;
let capperName = '';
let unitOptions = [];

function verifyAccessCode() {
  const code = document.getElementById('accessCode').value.trim();
  document.getElementById('accessMessage').textContent = 'Verifying...';

  fetch(
    `https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec`,
    {
      method: 'POST',
      body: JSON.stringify({ accessCode: code }),
    }
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        capperName = data.name;
        unitOptions = data.unitOptions;
        showForm();
        populateUnits();
      } else {
        document.getElementById('accessMessage').textContent =
          'Invalid code. Try again.';
      }
    })
    .catch(() => {
      document.getElementById('accessMessage').textContent =
        'Error connecting to server.';
    });
}

function showForm() {
  document.getElementById('access-code-section').style.display = 'none';
  document.getElementById('wagerForm').style.display = 'block';
  addWager();
}

function populateUnits() {
  const unitDropdown = document.getElementById('unitSize');
  unitOptions.forEach((amt) => {
    const option = document.createElement('option');
    option.value = amt;
    option.textContent = `$${amt}`;
    unitDropdown.appendChild(option);
  });
  unitDropdown.value = '100';
}

function addWager() {
  wagerCount++;
  const container = document.createElement('div');
  container.className = 'wagerBlock';
  container.id = `wager-${wagerCount}`;
  container.innerHTML = `
    <label for="wagerInput-${wagerCount}">Wager ${wagerCount}:</label>
    <input type="text" id="wagerInput-${wagerCount}" name="wagerInput-${wagerCount}" placeholder="e.g. Racing Santander/Marinades match U3" required />

    <label for="unitAmt-${wagerCount}">Bet Amount:</label>
    <select id="unitAmt-${wagerCount}" name="unitAmt-${wagerCount}"></select>

    <button type="button" onclick="toggleNote(${wagerCount})" id="noteBtn-${wagerCount}">➕ Add Note to Wager ${wagerCount}</button>
    <textarea id="note-${wagerCount}" name="note-${wagerCount}" style="display:none;" rows="2" placeholder="Optional note for Wager ${wagerCount}"></textarea>
  `;

  document.getElementById('wagers').appendChild(container);

  populateNoteUnits(wagerCount);
}

function toggleNote(num) {
  const noteBox = document.getElementById(`note-${num}`);
  const btn = document.getElementById(`noteBtn-${num}`);
  const isVisible = noteBox.style.display === 'block';

  noteBox.style.display = isVisible ? 'none' : 'block';
  btn.textContent = isVisible
    ? `➕ Add Note to Wager ${num}`
    : `❌ Delete Wager ${num} Note`;
}

function populateNoteUnits(wagerNum) {
  const dropdown = document.getElementById(`unitAmt-${wagerNum}`);
  dropdown.innerHTML = '';
  unitOptions.forEach((u) => {
    const label = u % 1 === 0 ? u : toFraction(u);
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = `${label} unit${u > 1 ? 's' : ''}`;
    dropdown.appendChild(opt);
  });
}

function toFraction(decimal) {
  if (decimal === 0.25) return '1/4';
  if (decimal === 0.5) return '1/2';
  if (decimal === 0.75) return '3/4';
  if (decimal === 0.2) return '1/5';
  if (decimal === 0.1) return '1/10';
  return decimal.toString();
}

document.getElementById('wagerForm').addEventListener('submit', function (e) {
  e.preventDefault();
  generateTicket();
});
