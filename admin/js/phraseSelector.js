const phraseSelectorContainer = document.getElementById('phraseSelectorContainer');
let selectedPhrase = null;

export async function loadPhrases(container = null) {
  const targetContainer = container || phraseSelectorContainer;

  targetContainer.innerHTML = '';
  selectedPhrase = null;

  // Example phrases - replace with your real data loading logic
  const phrases = ['Good luck', 'Take the win', 'Let\'s go', 'No risk no reward'];

  targetContainer.style.display = 'grid';
  targetContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  targetContainer.style.gap = '8px';
  targetContainer.style.marginTop = '8px';

  phrases.forEach(phrase => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = phrase;
    btn.className = 'pick-btn blue';

    btn.style.width = '100%';
    btn.style.minWidth = '0';
    btn.style.boxSizing = 'border-box';

    btn.addEventListener('click', () => selectPhrase(phrase));

    targetContainer.appendChild(btn);
  });
}

function selectPhrase(phrase) {
  if (selectedPhrase === phrase) return;
  selectedPhrase = phrase;

  const container = phraseSelectorContainer;
  container.innerHTML = '';

  const summaryLine = document.createElement('div');
  summaryLine.textContent = `Selected Phrase: ${phrase}`;
  summaryLine.style.fontWeight = '700';
  summaryLine.style.fontSize = '11px';
  summaryLine.style.fontFamily = 'Oswald, sans-serif';
  summaryLine.style.marginBottom = '6px';

  container.appendChild(summaryLine);
}
