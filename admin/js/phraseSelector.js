// admin/js/phraseSelector.js
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const phraseSection = document.createElement('div');
phraseSection.id = 'phraseSelectorSection';
phraseSection.style.marginTop = '20px';

// Container for phrase buttons
const phraseButtonsContainer = document.createElement('div');
phraseButtonsContainer.style.display = 'grid';
phraseButtonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
phraseButtonsContainer.style.gap = '6px 8px';
phraseButtonsContainer.style.marginBottom = '12px';

phraseSection.appendChild(phraseButtonsContainer);

// Show More button container (middle column)
const showMoreBtn = document.createElement('button');
showMoreBtn.type = 'button';
showMoreBtn.textContent = 'Show More';
showMoreBtn.className = 'pick-btn blue';
showMoreBtn.style.gridColumn = '2 / 3';
showMoreBtn.style.justifySelf = 'center';
showMoreBtn.style.width = '120px';
showMoreBtn.style.marginBottom = '12px';

phraseSection.appendChild(showMoreBtn);

const notesContainer = document.getElementById('notesContainer');
notesContainer.parentNode.insertBefore(phraseSection, notesContainer.nextSibling);

phraseSection.style.display = 'none'; // hidden initially

// State variables
let allActivePhrases = [];
let filteredSportPhrases = [];
let currentSport = null;
let phraseIndex = 0;
const BATCH_SIZE = 15;

// Public: call this to load phrases for a given sport
export async function loadPhrasesForSport(sport) {
  currentSport = sport || null;
  phraseSection.style.display = 'none';
  phraseButtonsContainer.innerHTML = '';
  showMoreBtn.style.display = 'none';
  phraseIndex = 0;
  allActivePhrases = [];
  filteredSportPhrases = [];

  try {
    const hypeRef = collection(window.db, 'HypePhrases');
    const qActive = query(hypeRef, where('active_status', '==', 'active'));
    const snapshot = await getDocs(qActive);

    allActivePhrases = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allActivePhrases.push({ id: doc.id, ...data });
    });

    if (currentSport) {
      filteredSportPhrases = allActivePhrases.filter(p => p.Sport === currentSport);
    }

    // If no filtered sport phrases, pick 15 random from allActivePhrases
    if (!filteredSportPhrases.length) {
      filteredSportPhrases = shuffleArray(allActivePhrases).slice(0, BATCH_SIZE);
      phraseIndex = filteredSportPhrases.length;
    } else {
      // Sort sport phrases alphabetically by Phrase field
      filteredSportPhrases.sort((a, b) => a.Phrase.localeCompare(b.Phrase));
    }

    phraseSection.style.display = 'block';
    renderPhraseButtons(filteredSportPhrases.slice(0, phraseIndex || BATCH_SIZE));

    if (filteredSportPhrases.length > (phraseIndex || BATCH_SIZE)) {
      showMoreBtn.style.display = 'inline-block';
    } else {
      showMoreBtn.style.display = 'none';
    }
  } catch (error) {
    phraseSection.textContent = 'Error loading phrases.';
    console.error('PhraseSelector load error:', error);
  }
}

function renderPhraseButtons(phrasesToShow) {
  phraseButtonsContainer.innerHTML = '';

  phrasesToShow.forEach(phrase => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = phrase.Phrase;
    btn.className = 'pick-btn blue';
    btn.style.paddingTop = '6px';
    btn.style.paddingBottom = '6px';
    btn.style.marginTop = '2px';
    btn.style.marginBottom = '2px';
    btn.style.width = '100%';
    btn.style.minWidth = '0';
    btn.style.boxSizing = 'border-box';

    btn.addEventListener('click', () => selectPhrase(phrase));
    phraseButtonsContainer.appendChild(btn);
  });
}

// Show More button click handler
showMoreBtn.addEventListener('click', () => {
  // Remove Show More button while loading next batch
  showMoreBtn.style.display = 'none';

  // Load next batch of 15 random phrases from allActivePhrases not already shown
  const remaining = allActivePhrases.filter(p => !filteredSportPhrases.includes(p));
  const nextBatch = shuffleArray(remaining).slice(0, BATCH_SIZE);

  filteredSportPhrases = filteredSportPhrases.concat(nextBatch);
  phraseIndex = filteredSportPhrases.length;

  renderPhraseButtons(filteredSportPhrases);

  if (filteredSportPhrases.length < allActivePhrases.length) {
    showMoreBtn.style.display = 'inline-block';
  } else {
    showMoreBtn.style.display = 'none';
  }
});

// When user selects a phrase
function selectPhrase(phrase) {
  // Clear all buttons and Show More
  phraseButtonsContainer.innerHTML = '';
  showMoreBtn.style.display = 'none';

  // Prepare display title and description
  // Placeholder [[Units]] and [[GameTime]] must be replaced by your app logic when rendering the summary
  const displayTitle = `[[Units]] - ${phrase.Phrase} - ${phrase.Sport || 'N/A'} - [[GameTime]]`;
  const displayDesc = `${phrase.Phrase} - ${phrase.Promo || ''}`;

  // Call your app's function to add this to the running summary
  // For example:
  if (window.addToSelectionSummary) {
    window.addToSelectionSummary({
      Phrase: phrase.Phrase,
      Promo: phrase.Promo,
      Type: phrase.Type,
      Energy: phrase.Energy,
      DisplayTitle: displayTitle,
      DisplayDesc: displayDesc
    });
  }

  // Optionally hide the phraseSection to tidy UI or keep it visible if needed
  phraseSection.style.display = 'none';
}

// Utility shuffle function
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default {
  loadPhrasesForSport
};
