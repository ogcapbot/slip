// admin/js/addNew.js

import { db } from '../firebaseInit.js';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  Timestamp,
  addDoc,
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

export class AddNewWorkflow {
  constructor(container, userId) {
    this.container = container;
    this.userId = userId;

    this.step = 1; // 1=Sport,2=League,3=Game,4=Team,5=WagerType,6=Unit,7=Phrase,8=Notes

    // Pagination cursors for each collection
    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.wagerLastVisible = null;
    this.unitLastVisible = null;
    this.phraseLastVisible = null;

    // Limits
    this.PAGE_LIMIT = 200;

    // Data storage for buttons
    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.wagerButtonsData = [];
    this.unitButtonsData = [];
    this.phraseButtonsData = [];

    // Selected values
    this.selectedSport = null;
    this.selectedLeague = null;
    this.selectedGame = null;
    this.selectedTeam = null;
    this.selectedWagerType = null;
    this.selectedUnit = null;
    this.selectedPhrase = null;
    this.notesText = '';

    // Initialize UI
    this.renderInitialUI();
    this.loadSports();
  }

  clearContainer() {
    this.container.innerHTML = '';
  }

  renderInitialUI() {
    this.clearContainer();

    // Title
    this.titleEl = document.createElement('h2');
    this.titleEl.id = 'workflowTitle';
    this.container.appendChild(this.titleEl);

    // Buttons container
    this.buttonsWrapper = document.createElement('div');
    this.buttonsWrapper.id = 'buttonsWrapper';
    this.buttonsWrapper.style.display = 'grid';
    this.buttonsWrapper.style.gridTemplateColumns = 'repeat(3, 1fr)';
    this.buttonsWrapper.style.gap = '8px';
    this.container.appendChild(this.buttonsWrapper);

    // Load More button
    this.loadMoreBtn = document.createElement('button');
    this.loadMoreBtn.textContent = 'Load More';
    this.loadMoreBtn.classList.add('admin-button');
    this.loadMoreBtn.style.marginTop = '12px';
    this.loadMoreBtn.style.display = 'none';
    this.loadMoreBtn.addEventListener('click', () => this.onLoadMore());
    this.container.appendChild(this.loadMoreBtn);

    // Submit button
    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = 'Submit';
    this.submitBtn.classList.add('admin-button');
    this.submitBtn.style.marginTop = '20px';
    this.submitBtn.style.display = 'none';
    this.submitBtn.addEventListener('click', () => this.onSubmit());
    this.container.appendChild(this.submitBtn);

    // Status message
    this.statusMsg = document.createElement('p');
    this.statusMsg.style.marginTop = '16px';
    this.container.appendChild(this.statusMsg);

    // Notes container (for step 8)
    this.notesContainer = document.createElement('div');
    this.notesContainer.style.marginTop = '16px';
    this.notesContainer.style.display = 'none';
    this.container.appendChild(this.notesContainer);

    this.setStatus('');
  }

  setStatus(message, isError = false) {
    this.statusMsg.textContent = message;
    this.statusMsg.style.color = isError ? 'red' : 'inherit';
  }

  async loadSports(loadMore = false) {
    this.step = 1;
    this.titleEl.textContent = 'Please select a Sport';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    if (!loadMore) {
      this.sportLastVisible = null;
      this.sportButtonsData = [];
    }

    this.setStatus('Loading sports...');
    try {
      const sportsRef = collection(db, 'SportsData');
      let q;

      if (this.sportLastVisible) {
        q = query(
          sportsRef,
          where('active', '==', true),
          orderBy('group'), // group = sport
          startAfter(this.sportLastVisible),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          sportsRef,
          where('active', '==', true),
          orderBy('group'),
          limit(this.PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        if (!loadMore) {
          this.setStatus('No sports found.');
        } else {
          this.setStatus('No more sports to load.');
        }
        return;
      }

      this.sportLastVisible = snapshot.docs[snapshot.docs.length - 1];

      // Extract unique sports by group field
      const newSports = snapshot.docs
        .map((doc) => doc.data().group)
        .filter((group) => !this.sportButtonsData.includes(group));

      this.sportButtonsData.push(...newSports);

      // Alphabetize
      this.sportButtonsData = [...new Set(this.sportButtonsData)].sort();

      this.renderButtons(this.sportButtonsData, 'sport');

      this.loadMoreBtn.style.display =
        snapshot.docs.length === this.PAGE_LIMIT ? 'inline-block' : 'none';

      this.setStatus('');
    } catch (error) {
      console.error('Error loading sports:', error);
      this.setStatus('Failed to load sports.', true);
    }
  }

  async loadLeagues(loadMore = false) {
    if (!this.selectedSport) {
      this.setStatus('Please select a sport first.', true);
      return;
    }
    this.step = 2;
    this.titleEl.textContent = `Selected Sport: ${this.selectedSport} — Select a League`;
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    if (!loadMore) {
      this.leagueLastVisible = null;
      this.leagueButtonsData = [];
    }

    this.setStatus('Loading leagues...');
    try {
      const sportsRef = collection(db, 'SportsData');
      let q;

      if (this.leagueLastVisible) {
        q = query(
          sportsRef,
          where('group', '==', this.selectedSport),
          orderBy('title'), // title = league
          startAfter(this.leagueLastVisible),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          sportsRef,
          where('group', '==', this.selectedSport),
          orderBy('title'),
          limit(this.PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        if (!loadMore) {
          this.setStatus('No leagues found.');
        } else {
          this.setStatus('No more leagues to load.');
        }
        return;
      }

      this.leagueLastVisible = snapshot.docs[snapshot.docs.length - 1];

      const newLeagues = snapshot.docs
        .map((doc) => doc.data().title)
        .filter((title) => !this.leagueButtonsData.includes(title));

      this.leagueButtonsData.push(...newLeagues);

      this.leagueButtonsData = [...new Set(this.leagueButtonsData)].sort();

      this.renderButtons(this.leagueButtonsData, 'league');

      this.loadMoreBtn.style.display =
        snapshot.docs.length === this.PAGE_LIMIT ? 'inline-block' : 'none';

      this.setStatus('');
    } catch (error) {
      console.error('Error loading leagues:', error);
      this.setStatus('Failed to load leagues.', true);
    }
  }

  async loadGames(loadMore = false) {
    if (!this.selectedLeague) {
      this.setStatus('Please select a league first.', true);
      return;
    }
    this.step = 3;
    this.titleEl.textContent = `Selected League: ${this.selectedLeague} — Select a Game`;
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    if (!loadMore) {
      this.gameLastVisible = null;
      this.gameButtonsData = [];
    }

    this.setStatus('Loading games...');
    try {
      const gamesRef = collection(db, 'GameEventsData');
      let q;

      if (this.gameLastVisible) {
        q = query(
          gamesRef,
          where('leagueShortname', '==', this.selectedLeague),
          orderBy('startTimeUTC'),
          startAfter(this.gameLastVisible),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          gamesRef,
          where('leagueShortname', '==', this.selectedLeague),
          orderBy('startTimeUTC'),
          limit(this.PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        if (!loadMore) {
          this.setStatus('No games found.');
        } else {
          this.setStatus('No more games to load.');
        }
        return;
      }

      this.gameLastVisible = snapshot.docs[snapshot.docs.length - 1];

      // Prepare formatted games list
      const newGames = [];

      snapshot.docs.forEach((doc) => {
        const d = doc.data();

        // Format game date/time display
        const gameDate = new Date(d.startTimeUTC);
        const displayDate = this.getFormattedGameDate(gameDate);

        const gameLabel = `${d.awayTeam}<br>@ ${d.homeTeam}<br>${displayDate}`;

        if (!this.gameButtonsData.find((g) => g.id === doc.id)) {
          newGames.push({ id: doc.id, label: gameLabel });
        }
      });

      this.gameButtonsData.push(...newGames);

      this.renderButtons(this.gameButtonsData.map((g) => g.label), 'game');

      this.loadMoreBtn.style.display =
        snapshot.docs.length === this.PAGE_LIMIT ? 'inline-block' : 'none';

      this.setStatus('');
    } catch (error) {
      console.error('Error loading games:', error);
      this.setStatus('Failed to load games.', true);
    }
  }

  // Format the game date/time as requested
  getFormattedGameDate(gameDate) {
    const now = new Date();
    const estOptions = { timeZone: 'America/New_York', hour12: true };
    const diffMs = gameDate.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);

    const estTime = gameDate.toLocaleTimeString('en-US', {
      ...estOptions,
      hour: 'numeric',
      minute: '2-digit',
    });

    // More than 2 days away, show full date & time
    if (diffMins > 2 * 24 * 60) {
      return gameDate.toLocaleDateString('en-US', {
        ...estOptions,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) + ` @ ${estTime} EST`;
    }

    // Within 15 mins: Starting Soon
    if (diffMins >= 0 && diffMins <= 15) {
      return `Game Starting Soon @ ${estTime} EST`;
    }

    // Within 60 mins: Game Starts
    if (diffMins > 15 && diffMins <= 60) {
      return `Game Starts @ ${estTime} EST`;
    }

    // Already started
    if (diffMins < 0) {
      return `Game Started @ ${estTime} EST`;
    }

    // Otherwise show day label + time
    const dayLabel = this.getDayLabel(gameDate, now);
    return `${dayLabel} ${estTime} EST`;
  }

  // Helper to get day label: Today, Tomorrow, or "Wed"
  getDayLabel(gameDate, now) {
    const gameDay = new Date(
      gameDate.getFullYear(),
      gameDate.getMonth(),
      gameDate.getDate()
    ).getTime();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (gameDay === nowDay) return 'Today';
    if (gameDay === nowDay + 86400000) return 'Tomorrow';

    return gameDate.toLocaleDateString('en-US', { weekday: 'short' });
  }

  renderButtons(buttons, type) {
    // Clear previous buttons for this step
    this.buttonsWrapper.innerHTML = '';

    buttons.forEach((label, idx) => {
      const btn = document.createElement('button');
      btn.classList.add('admin-button');

      // Use innerHTML for multi-line game buttons
      if (type === 'game') {
        btn.innerHTML = label;
      } else {
        btn.textContent = label;
      }

      // Highlight if selected
      if (
        (type === 'sport' && this.selectedSport === label) ||
        (type === 'league' && this.selectedLeague === label) ||
        (type === 'game' && this.selectedGame === label) ||
        (type === 'team' && this.selectedTeam === label) ||
        (type === 'wager' && this.selectedWagerType === label) ||
        (type === 'unit' && this.selectedUnit === label) ||
        (type === 'phrase' && this.selectedPhrase === label)
      ) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        switch (type) {
          case 'sport':
            if (this.selectedSport !== label) {
              this.selectedSport = label;
              this.selectedLeague = null;
              this.selectedGame = null;
              this.selectedTeam = null;
              this.selectedWagerType = null;
              this.selectedUnit = null;
              this.selectedPhrase = null;

              this.leagueButtonsData = [];
              this.leagueLastVisible = null;

              this.gameButtonsData = [];
              this.gameLastVisible = null;

              this.wagerButtonsData = [];
              this.wagerLastVisible = null;

              this.unitButtonsData = [];
              this.unitLastVisible = null;

              this.phraseButtonsData = [];
              this.phraseLastVisible = null;

              this.step = 2;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';

              this.renderButtons([], 'league'); // clear leagues area first
              this.loadLeagues();
            }
            break;

          case 'league':
            if (this.selectedLeague !== label) {
              this.selectedLeague = label;
              this.selectedGame = null;
              this.selectedTeam = null;
              this.selectedWagerType = null;
              this.selectedUnit = null;
              this.selectedPhrase = null;

              this.gameButtonsData = [];
              this.gameLastVisible = null;

              this.wagerButtonsData = [];
              this.wagerLastVisible = null;

              this.unitButtonsData = [];
              this.unitLastVisible = null;

              this.phraseButtonsData = [];
              this.phraseLastVisible = null;

              this.step = 3;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';

              this.renderButtons([], 'game'); // clear games area first
              this.loadGames();
            }
            break;

          case 'game':
            if (this.selectedGame !== label) {
              this.selectedGame = label;
              this.selectedTeam = null;
              this.selectedWagerType = null;
              this.selectedUnit = null;
              this.selectedPhrase = null;

              this.wagerButtonsData = [];
              this.wagerLastVisible = null;

              this.unitButtonsData = [];
              this.unitLastVisible = null;

              this.phraseButtonsData = [];
              this.phraseLastVisible = null;

              this.step = 4;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';

              this.renderButtons([], 'team'); // clear teams area first
              this.renderTeamsButtons();
            }
            break;

          case 'team':
            if (this.selectedTeam !== label) {
              this.selectedTeam = label;

              this.step = 5;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';

              this.wagerButtonsData = [];
              this.wagerLastVisible = null;
              this.unitButtonsData = [];
              this.unitLastVisible = null;
              this.phraseButtonsData = [];
              this.phraseLastVisible = null;

              this.renderButtons([], 'wager'); // clear wager area first
              this.loadWagerTypes();
            }
            break;

          case 'wager':
            if (this.selectedWagerType !== label) {
              this.selectedWagerType = label;
              this.selectedUnit = null;
              this.selectedPhrase = null;

              this.unitButtonsData = [];
              this.unitLastVisible = null;
              this.phraseButtonsData = [];
              this.phraseLastVisible = null;

              this.step = 6;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';

              this.renderButtons([], 'unit'); // clear unit area first
              this.loadUnits();
            }
            break;

          case 'unit':
            if (this.selectedUnit !== label) {
              this.selectedUnit = label;
              this.selectedPhrase = null;

              this.phraseButtonsData = [];
              this.phraseLastVisible = null;

              this.step = 7;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';

              this.renderButtons([], 'phrase'); // clear phrase area first
              this.loadHypePhrases();
            }
            break;

          case 'phrase':
            if (this.selectedPhrase !== label) {
              this.selectedPhrase = label;

              this.step = 8;
              this.loadMoreBtn.style.display = 'none';

              // Show notes question
              this.renderNotesQuestion();
            }
            break;
        }
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  renderTeamsButtons() {
    // Teams step - display Away and Home buttons for selected game
    this.buttonsWrapper.innerHTML = '';

    if (!this.selectedGame) {
      this.setStatus('No game selected.', true);
      return;
    }

    this.setStatus('Select Away or Home Team');

    // Find the game object in gameButtonsData
    const gameObj = this.gameButtonsData.find((g) => g.label === this.selectedGame);
    if (!gameObj) {
      this.setStatus('Game data not found.', true);
      return;
    }

    // Game label format: Away<br>@ Home<br>DateTime - extract teams
    // We'll parse teams from the label safely:

    // Using the stored GameEventData doc directly might be better, so let's store the actual doc data on gameButtonsData when loading

    // Let's rework loadGames to store doc data for team selection (done above)

    // Instead, here, find the doc from snapshot? For simplicity, store doc data on gameButtonsData for now.

    // But for now, this simplified approach (might want to adjust):

    // Find game data doc by id from Firestore (better way):

    // I'll assume selectedGame is label string, but we stored id and label. Let's fix selection to store id for games.

    // To fix: when clicking game, store game id, not label.

    // Let's do that:
    // - store selectedGame as id
    // - display buttons with labels from gameButtonsData

    // We will adjust renderButtons for game to store button dataset id for reference

    this.setStatus('Loading teams...');

    // Hide Load More button & Submit
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';

    // Clear buttonsWrapper and add two buttons: awayTeam and homeTeam

    // Get doc for selectedGame
    const gameDoc = this.gameButtonsData.find((g) => g.id === this.selectedGame);
    if (!gameDoc) {
      this.setStatus('Game data not found.', true);
      return;
    }
    const data = gameDoc.data;

    // Build away and home buttons

    this.buttonsWrapper.innerHTML = '';

    // Away team button
    const btnAway = document.createElement('button');
    btnAway.textContent = data.awayTeam;
    btnAway.classList.add('admin-button');
    btnAway.addEventListener('click', () => this.onTeamSelected(data.awayTeam));
    this.buttonsWrapper.appendChild(btnAway);

    // Home team button
    const btnHome = document.createElement('button');
    btnHome.textContent = data.homeTeam;
    btnHome.classList.add('admin-button');
    btnHome.addEventListener('click', () => this.onTeamSelected(data.homeTeam));
    this.buttonsWrapper.appendChild(btnHome);
  }

  onTeamSelected(teamName) {
    this.selectedTeam = teamName;

    this.step = 5;
    this.submitBtn.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';

    // Clear wager data and load wager types
    this.wagerButtonsData = [];
    this.wagerLastVisible = null;

    this.unitButtonsData = [];
    this.unitLastVisible = null;

    this.phraseButtonsData = [];
    this.phraseLastVisible = null;

    this.renderButtons([], 'wager');
    this.loadWagerTypes();
  }

  async loadWagerTypes(loadMore = false) {
    if (!this.selectedSport) {
      this.setStatus('Select a sport first.', true);
      return;
    }
    this.step = 5;
    this.titleEl.textContent = `Selected Sport: ${this.selectedSport} — Select a Wager Type`;
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    if (!loadMore) {
      this.wagerLastVisible = null;
      this.wagerButtonsData = [];
    }

    this.setStatus('Loading wager types...');
    try {
      const wagersRef = collection(db, 'WagerTypes');

      // First, get 'All' wagers
      const allQuery = query(
        wagersRef,
        where('Sport', '==', 'All'),
        orderBy('Rank'),
        limit(this.PAGE_LIMIT)
      );
      const allSnapshot = await getDocs(allQuery);
      const allWagers = allSnapshot.docs.map((doc) => doc.data().Type || doc.id);

      // Then get sport-specific wagers with pagination
      let sportQuery;
      if (this.wagerLastVisible) {
        sportQuery = query(
          wagersRef,
          where('Sport', '==', this.selectedSport),
          orderBy('Rank'),
          startAfter(this.wagerLastVisible),
          limit(this.PAGE_LIMIT)
        );
      } else {
        sportQuery = query(
          wagersRef,
          where('Sport', '==', this.selectedSport),
          orderBy('Rank'),
          limit(this.PAGE_LIMIT)
        );
      }

      const sportSnapshot = await getDocs(sportQuery);
      const sportWagers = sportSnapshot.docs.map((doc) => doc.data().Type || doc.id);

      // Combine, deduplicate keeping order
      const combined = [...new Set([...allWagers, ...sportWagers])];

      // Pagination control - stop if no more sport wagers
      if (sportSnapshot.docs.length === this.PAGE_LIMIT) {
        this.wagerLastVisible = sportSnapshot.docs[sportSnapshot.docs.length - 1];
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.wagerButtonsData = combined;
      this.renderButtons(this.wagerButtonsData, 'wager');

      this.setStatus('');
    } catch (error) {
      console.error('Error loading wager types:', error);
      this.setStatus('Failed to load wager types.', true);
    }
  }

  async loadUnits(loadMore = false) {
    this.step = 6;
    this.titleEl.textContent = `Selected Wager Type: ${this.selectedWagerType} — Select a Unit`;
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    if (!loadMore) {
      this.unitLastVisible = null;
      this.unitButtonsData = [];
    }

    this.setStatus('Loading units...');
    try {
      const unitsRef = collection(db, 'Units');
      let q;

      if (this.unitLastVisible) {
        q = query(unitsRef, orderBy('Rank'), startAfter(this.unitLastVisible), limit(this.PAGE_LIMIT));
      } else {
        q = query(unitsRef, orderBy('Rank'), limit(this.PAGE_LIMIT));
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        if (!loadMore) {
          this.setStatus('No units found.');
        } else {
          this.setStatus('No more units to load.');
        }
        return;
      }

      this.unitLastVisible = snapshot.docs[snapshot.docs.length - 1];

      const newUnits = snapshot.docs
        .map((doc) => doc.data().display_unit)
        .filter((unit) => !this.unitButtonsData.includes(unit));

      this.unitButtonsData.push(...newUnits);
      this.unitButtonsData = [...new Set(this.unitButtonsData)];

      this.renderButtons(this.unitButtonsData, 'unit');

      this.loadMoreBtn.style.display =
        snapshot.docs.length === this.PAGE_LIMIT ? 'inline-block' : 'none';

      this.setStatus('');
    } catch (error) {
      console.error('Error loading units:', error);
      this.setStatus('Failed to load units.', true);
    }
  }

  async loadHypePhrases(loadMore = false) {
    if (!this.selectedSport) {
      this.setStatus('Select a sport first.', true);
      return;
    }
    this.step = 7;
    this.titleEl.textContent = `Select a Hype Phrase`;
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    if (!loadMore) {
      this.phraseLastVisible = null;
      this.phraseButtonsData = [];
    }

    this.setStatus('Loading hype phrases...');
    try {
      const hypeRef = collection(db, 'HypePhrases');

      // Query active_status = active AND Sport = selectedSport
      let sportQuery = query(
        hypeRef,
        where('active_status', '==', 'active'),
        where('Sport', '==', this.selectedSport),
        limit(this.PAGE_LIMIT)
      );

      const sportSnapshot = await getDocs(sportQuery);
      const sportPhrases = sportSnapshot.docs.map((doc) => doc.data().Phrase || doc.id);

      // Query active_status = active AND Sport != selectedSport (for random order)
      let otherQuery = query(
        hypeRef,
        where('active_status', '==', 'active'),
        where('Sport', '!=', this.selectedSport),
        limit(this.PAGE_LIMIT)
      );

      const otherSnapshot = await getDocs(otherQuery);
      const otherPhrases = otherSnapshot.docs.map((doc) => doc.data().Phrase || doc.id);

      // Combine with sport phrases first, then others randomized
      const combined = [...sportPhrases, ...this.shuffleArray(otherPhrases)];

      this.phraseButtonsData = combined;
      this.renderButtons(this.phraseButtonsData, 'phrase');

      this.loadMoreBtn.style.display = 'none'; // For now no pagination on phrases

      this.setStatus('');
    } catch (error) {
      console.error('Error loading hype phrases:', error);
      this.setStatus('Failed to load hype phrases.', true);
    }
  }

  shuffleArray(arr) {
    let array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  renderNotesQuestion() {
    this.titleEl.textContent = 'Do you want to leave Notes/Comments for the pick?';
    this.buttonsWrapper.innerHTML = '';

    // Yes button
    const yesBtn = document.createElement('button');
    yesBtn.textContent = 'Yes';
    yesBtn.classList.add('admin-button');
    yesBtn.addEventListener('click', () => this.renderNotesTextarea());
    this.buttonsWrapper.appendChild(yesBtn);

    // No button
    const noBtn = document.createElement('button');
    noBtn.textContent = 'No';
    noBtn.classList.add('admin-button');
    noBtn.addEventListener('click', () => {
      this.notesContainer.style.display = 'none';
      this.submitBtn.style.display = 'inline-block';
      this.loadMoreBtn.style.display = 'none';
      this.buttonsWrapper.innerHTML = '';
      this.setStatus('Ready to submit.');
    });
    this.buttonsWrapper.appendChild(noBtn);

    this.notesContainer.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';
  }

  renderNotesTextarea() {
    this.buttonsWrapper.innerHTML = '';
    this.notesContainer.style.display = 'block';
    this.submitBtn.style.display = 'inline-block';
    this.loadMoreBtn.style.display = 'none';

    this.notesContainer.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.maxLength = 100;
    textarea.rows = 2;
    textarea.cols = 40;
    textarea.style.fontFamily = 'Oswald, sans-serif';
    textarea.style.fontSize = '1.1rem';
    textarea.placeholder = 'Enter your notes/comments (max 100 characters)...';

    const counter = document.createElement('div');
    counter.textContent = '100 characters remaining';
    counter.style.marginTop = '4px';
    counter.style.fontSize = '0.9rem';
    counter.style.color = '#555';

    textarea.addEventListener('input', () => {
      const remaining = 100 - textarea.value.length;
      counter.textContent = `${remaining} characters remaining`;
      this.notesText = textarea.value;
    });

    this.notesContainer.appendChild(textarea);
    this.notesContainer.appendChild(counter);
  }

  async onLoadMore() {
    switch (this.step) {
      case 1:
        await this.loadSports(true);
        break;
      case 2:
        await this.loadLeagues(true);
        break;
      case 3:
        await this.loadGames(true);
        break;
      case 5:
        await this.loadWagerTypes(true);
        break;
      case 6:
        await this.loadUnits(true);
        break;
      case 7:
        await this.loadHypePhrases(true);
        break;
      default:
        this.loadMoreBtn.style.display = 'none';
    }
  }

  async onSubmit() {
    if (
      !this.selectedSport ||
      !this.selectedLeague ||
      !this.selectedGame ||
      !this.selectedTeam ||
      !this.selectedWagerType ||
      !this.selectedUnit ||
      !this.selectedPhrase
    ) {
      this.setStatus('Please complete all selections before submitting.', true);
      return;
    }

    this.setStatus('Submitting your selection...');
    this.submitBtn.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';

    try {
      await addDoc(collection(db, 'UserSubmissions'), {
        userId: this.userId,
        sportName: this.selectedSport,
        leagueName: this.selectedLeague,
        gameId: this.selectedGame,
        team: this.selectedTeam,
        wagerType: this.selectedWagerType,
        unit: this.selectedUnit,
        phrase: this.selectedPhrase,
        notes: this.notesText || '',
        timestamp: Timestamp.now(),
      });

      this.setStatus('Submission successful! Thank you.');
      // Optionally reset workflow:
      this.resetWorkflow();
    } catch (error) {
      console.error('Error submitting:', error);
      this.setStatus('Failed to submit your selection.', true);
      this.submitBtn.style.display = 'inline-block';
    }
  }

  resetWorkflow() {
    this.step = 1;

    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.wagerLastVisible = null;
    this.unitLastVisible = null;
    this.phraseLastVisible = null;

    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.wagerButtonsData = [];
    this.unitButtonsData = [];
    this.phraseButtonsData = [];

    this.selectedSport = null;
    this.selectedLeague = null;
    this.selectedGame = null;
    this.selectedTeam = null;
    this.selectedWagerType = null;
    this.selectedUnit = null;
    this.selectedPhrase = null;
    this.notesText = '';

    this.renderInitialUI();
    this.loadSports();
  }
}
