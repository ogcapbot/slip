// addNew.js
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

const PAGE_LIMIT = 15;

export class AddNewWorkflow {
  constructor(container, userId) {
    this.container = container;
    this.userId = userId;

    // Pagination cursors
    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.phraseLastVisible = null;

    // Data arrays for deduplication
    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.phraseButtonsData = [];

    // Selection state
    this.selectedSport = null;
    this.selectedLeague = null;
    this.selectedGame = null;
    this.selectedTeam = null;
    this.selectedWagerType = null;
    this.selectedUnit = null;
    this.selectedPhrase = null;
    this.notes = '';

    this.step = 1;

    // Initialize UI elements and render first step
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

    // Notes container & elements
    this.notesContainer = document.createElement('div');
    this.notesContainer.style.marginTop = '16px';
    this.notesContainer.style.display = 'none';

    this.notesTextarea = document.createElement('textarea');
    this.notesTextarea.maxLength = 100;
    this.notesTextarea.rows = 2;
    this.notesTextarea.cols = 50;
    this.notesTextarea.style.fontFamily = "'Oswald', sans-serif";
    this.notesTextarea.addEventListener('input', () => {
      const remaining = 100 - this.notesTextarea.value.length;
      this.charCount.textContent = `${remaining} characters remaining`;
      this.notes = this.notesTextarea.value;
    });
    this.notesContainer.appendChild(this.notesTextarea);

    this.charCount = document.createElement('div');
    this.charCount.style.fontSize = '0.8em';
    this.charCount.style.color = '#555';
    this.charCount.textContent = '100 characters remaining';
    this.notesContainer.appendChild(this.charCount);

    this.container.appendChild(this.notesContainer);
  }

  setStatus(msg, isError = false) {
    this.statusMsg.textContent = msg;
    this.statusMsg.style.color = isError ? 'red' : 'inherit';
  }

  async loadSports(loadMore = false) {
    this.step = 1;
    this.titleEl.textContent = 'Please select a Sport';
    this.setStatus('Loading sports...');
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    try {
      let q;
      if (!loadMore || !this.sportLastVisible) {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          orderBy('group'),
          limit(PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          orderBy('group'),
          startAfter(this.sportLastVisible),
          limit(PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more sports to load.');
        return;
      }

      this.sportLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.group && !this.sportButtonsData.includes(data.group)) {
          this.sportButtonsData.push(data.group);
        }
      });

      this.sportButtonsData.sort();

      this.renderButtons(this.sportButtonsData, 'sport');

      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

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
    this.setStatus(`Loading leagues for ${this.selectedSport}...`);
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    try {
      let q;
      if (!loadMore || !this.leagueLastVisible) {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          where('group', '==', this.selectedSport),
          orderBy('title'),
          limit(PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          where('group', '==', this.selectedSport),
          orderBy('title'),
          startAfter(this.leagueLastVisible),
          limit(PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more leagues to load.');
        return;
      }

      this.leagueLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.title && !this.leagueButtonsData.includes(data.title)) {
          this.leagueButtonsData.push(data.title);
        }
      });

      this.leagueButtonsData.sort();

      this.renderButtons(this.leagueButtonsData, 'league');

      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('Error loading leagues:', error);
      this.setStatus('Failed to load leagues.', true);
    }
  }

  formatGameDisplay(game) {
    const awayTeam = game.awayTeam || '';
    const homeTeam = game.homeTeam || '';
// If it's a Firestore Timestamp object, convert it to Date; else use directly
const startTime = game.startTimeET instanceof Date
  ? game.startTimeET
  : (game.startTimeET?.toDate ? game.startTimeET.toDate() : new Date(game.startTimeET));
    if (!startTime) return `${awayTeam}\n@ ${homeTeam}\nDate TBD`;

    const now = new Date();
    const diffMs = startTime - now;
    const diffMins = diffMs / (1000 * 60);

    let dayLabel = '';
    let timeLabel = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    });

    const dayDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (dayDiff >= 2) {
      dayLabel = startTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } else if (dayDiff === 1) {
      dayLabel = 'Tomorrow';
    } else if (dayDiff === 0) {
      dayLabel = 'Today';
    } else if (diffMs < 0) {
      dayLabel = 'Started';
    }

    let bottomLine = '';
    if (diffMins < 0) {
      bottomLine = `Game Started @ ${timeLabel} EST`;
    } else if (diffMins <= 15) {
      bottomLine = `Game Starting Soon @ ${timeLabel} EST`;
    } else if (diffMins <= 60) {
      bottomLine = `Game Starts @ ${timeLabel} EST`;
    } else {
      bottomLine = `${dayLabel} @ ${timeLabel} EST`;
    }

    return `${awayTeam}\n@ ${homeTeam}\n${bottomLine}`;
  }

  async loadGames(loadMore = false) {
    if (!this.selectedLeague) {
      this.setStatus('Please select a league first.', true);
      return;
    }

    this.step = 3;
    this.titleEl.textContent = `Selected League: ${this.selectedLeague} — Select a Game`;
    this.setStatus(`Loading games for league ${this.selectedLeague}...`);
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    try {
      let q;
      if (!loadMore || !this.gameLastVisible) {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.selectedLeague),
          orderBy('startTimeET'),
          limit(PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.selectedLeague),
          orderBy('startTimeET'),
          startAfter(this.gameLastVisible),
          limit(PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more games to load.');
        return;
      }

      this.gameLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const gameId = doc.id;
        if (
          gameId &&
          !this.gameButtonsData.some((g) => g.id === gameId)
        ) {
          this.gameButtonsData.push({
            id: gameId,
            display: this.formatGameDisplay(data),
            awayTeam: data.awayTeam,
            homeTeam: data.homeTeam,
            startTimeET: data.startTimeET.toDate(),
          });
        }
      });

      this.gameButtonsData.sort(
        (a, b) => a.startTimeET - b.startTimeET
      );

      this.renderButtons(
        this.gameButtonsData.map((g) => g.display),
        'game'
      );

      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('Error loading games:', error);
      this.setStatus('Failed to load games.', true);
    }
  }

  async loadTeams() {
    if (!this.selectedGame) {
      this.setStatus('Please select a game first.', true);
      return;
    }

    this.step = 4;
    this.titleEl.textContent = 'Select a Team';

    this.notesContainer.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';

    const teams = [
      this.selectedGame.awayTeam || 'Away Team',
      this.selectedGame.homeTeam || 'Home Team',
    ];

    this.renderButtons(teams, 'team');
  }

  async loadWagerTypes() {
    if (!this.selectedTeam) {
      this.setStatus('Please select a team first.', true);
      return;
    }

    this.step = 5;
    this.titleEl.textContent = `Select a Wager Type for ${this.selectedTeam}`;

    this.notesContainer.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';

    try {
      // Global wagers (Sport == "All")
      const globalQuery = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', 'All'),
        orderBy('Rank'),
        limit(50)
      );
      const globalSnap = await getDocs(globalQuery);
      const globalWagers = globalSnap.docs.map((doc) => doc.data());

      // Sport-specific wagers
      const sportQuery = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', this.selectedSport),
        orderBy('Rank'),
        limit(50)
      );
      const sportSnap = await getDocs(sportQuery);
      const sportWagers = sportSnap.docs.map((doc) => doc.data());

      this.renderWagerTypes(globalWagers, sportWagers);
    } catch (error) {
      console.error('Error loading wager types:', error);
      this.setStatus('Failed to load wager types.', true);
    }
  }

  renderWagerTypes(globalWagers, sportWagers) {
    this.buttonsWrapper.innerHTML = '';

    if (globalWagers.length) {
      globalWagers.forEach((wager) => {
        const btn = document.createElement('button');
        btn.textContent = wager.WagerType || 'Unnamed';
        btn.classList.add('admin-button');
        btn.addEventListener('click', () => {
          this.selectedWagerType = wager.WagerType;
          this.loadUnits();
        });
        this.buttonsWrapper.appendChild(btn);
      });
    }

    if (sportWagers.length) {
      const separator = document.createElement('div');
      separator.textContent = '--- Sport Specific Wagers ---';
      separator.style.fontWeight = 'bold';
      separator.style.margin = '12px 0';
      this.buttonsWrapper.appendChild(separator);

      sportWagers.forEach((wager) => {
        const btn = document.createElement('button');
        btn.textContent = wager.WagerType || 'Unnamed';
        btn.classList.add('admin-button');
        btn.addEventListener('click', () => {
          this.selectedWagerType = wager.WagerType;
          this.loadUnits();
        });
        this.buttonsWrapper.appendChild(btn);
      });
    }
  }

  async loadUnits() {
    if (!this.selectedWagerType) {
      this.setStatus('Please select a wager type first.', true);
      return;
    }

    this.step = 6;
    this.titleEl.textContent = `Select Units for ${this.selectedWagerType}`;

    this.notesContainer.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';

    try {
      const unitsQuery = query(
        collection(db, 'Units'),
        orderBy('Rank'),
        limit(50)
      );
      const snapshot = await getDocs(unitsQuery);
      const units = snapshot.docs.map((doc) => doc.data());

      this.renderButtons(units.map((u) => u.display_unit), 'unit');
    } catch (error) {
      console.error('Error loading units:', error);
      this.setStatus('Failed to load units.', true);
    }
  }

  async loadPhrases(loadMore = false) {
    if (!this.selectedUnit) {
      this.setStatus('Please select units first.', true);
      return;
    }

    this.step = 7;
    this.titleEl.textContent = `Select a Phrase`;
    this.notesContainer.style.display = 'none';
    this.submitBtn.style.display = 'none';

    try {
      let q;
      if (!loadMore || !this.phraseLastVisible) {
        q = query(
          collection(db, 'HypePhrases'),
          where('active_status', '==', 'active'),
          orderBy('Phrase'),
          limit(PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'HypePhrases'),
          where('active_status', '==', 'active'),
          orderBy('Phrase'),
          startAfter(this.phraseLastVisible),
          limit(PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more phrases to load.');
        return;
      }

      this.phraseLastVisible = snapshot.docs[snapshot.docs.length - 1];

      const newPhrases = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.Phrase && !this.phraseButtonsData.includes(data.Phrase)) {
          newPhrases.push(data.Phrase);
        }
      });

      this.phraseButtonsData.push(...newPhrases);

      this.renderButtons(this.phraseButtonsData, 'phrase');

      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('Error loading phrases:', error);
      this.setStatus('Failed to load phrases.', true);
    }
  }

  askNotes() {
    this.step = 8;
    this.notes = '';
    this.notesTextarea.value = '';
    this.charCount.textContent = '100 characters remaining';
    this.notesContainer.style.display = 'block';
    this.submitBtn.style.display = 'inline-block';

    this.titleEl.textContent = 'Do you want to leave Notes/Comments for the pick?';

    this.buttonsWrapper.innerHTML = '';

    const yesBtn = document.createElement('button');
    yesBtn.textContent = 'Yes';
    yesBtn.classList.add('admin-button');
    yesBtn.addEventListener('click', () => {
      this.notesContainer.style.display = 'block';
      this.submitBtn.style.display = 'inline-block';
      yesBtn.style.display = 'none';
      noBtn.style.display = 'none';
    });

    const noBtn = document.createElement('button');
    noBtn.textContent = 'No';
    noBtn.classList.add('admin-button');
    noBtn.addEventListener('click', () => {
      this.notesContainer.style.display = 'none';
      this.submitBtn.style.display = 'inline-block';
      yesBtn.style.display = 'none';
      noBtn.style.display = 'none';
      this.notes = '';
    });

    this.buttonsWrapper.appendChild(yesBtn);
    this.buttonsWrapper.appendChild(noBtn);
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
      case 7:
        await this.loadPhrases(true);
        break;
      default:
        this.loadMoreBtn.style.display = 'none';
    }
  }

  renderButtons(items, type) {
    this.buttonsWrapper.innerHTML = '';

    items.forEach((label) => {
      const btn = document.createElement('button');
      btn.classList.add('admin-button');

      // multiline for game buttons
      if (type === 'game') {
        btn.style.whiteSpace = 'pre-line';
        btn.innerHTML = label.replace(/\n/g, '<br>');
      } else {
        btn.textContent = label;
      }

      btn.addEventListener('click', () => {
        switch (type) {
          case 'sport':
            if (this.selectedSport !== label) {
              this.selectedSport = label;
              this.selectedLeague = null;
              this.leagueButtonsData = [];
              this.leagueLastVisible = null;
              this.step = 2;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadLeagues();
            }
            break;
          case 'league':
            if (this.selectedLeague !== label) {
              this.selectedLeague = label;
              this.selectedGame = null;
              this.gameButtonsData = [];
              this.gameLastVisible = null;
              this.step = 3;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadGames();
            }
            break;
          case 'game':
            if (this.selectedGame !== label) {
              this.selectedGame = this.gameButtonsData.find(g => g.display === label);
              this.step = 4;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadTeams();
            }
            break;
          case 'team':
            if (this.selectedTeam !== label) {
              this.selectedTeam = label;
              this.step = 5;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadWagerTypes();
            }
            break;
          case 'wagerType':
            if (this.selectedWagerType !== label) {
              this.selectedWagerType = label;
              this.step = 6;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadUnits();
            }
            break;
          case 'unit':
            if (this.selectedUnit !== label) {
              this.selectedUnit = label;
              this.step = 7;
              this.loadMoreBtn.style.display = 'inline-block';
              this.submitBtn.style.display = 'none';
              this.loadPhrases();
            }
            break;
          case 'phrase':
            if (this.selectedPhrase !== label) {
              this.selectedPhrase = label;
              this.step = 8;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'inline-block';
              this.askNotes();
            }
            break;
        }
      });

      this.buttonsWrapper.appendChild(btn);
    });
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
      this.setStatus('Please complete all steps before submitting.', true);
      return;
    }

    this.setStatus('Submitting your selection...');

    try {
      await addDoc(collection(db, 'OfficialPicks'), {
        userId: this.userId,
        sport: this.selectedSport,
        league: this.selectedLeague,
        gameId: this.selectedGame.id,
        awayTeam: this.selectedGame.awayTeam,
        homeTeam: this.selectedGame.homeTeam,
        teamSelected: this.selectedTeam,
        wagerType: this.selectedWagerType,
        unit: this.selectedUnit,
        phrase: this.selectedPhrase,
        notes: this.notes,
        timestamp: Timestamp.now(),
      });

      this.setStatus('Submission successful! Thank you.');
      this.submitBtn.style.display = 'none';
      this.notesContainer.style.display = 'none';

      // Reset everything for new workflow
      this.resetWorkflow();
    } catch (error) {
      console.error('Error submitting:', error);
      this.setStatus('Failed to submit your selection.', true);
    }
  }

  resetWorkflow() {
    this.step = 1;
    this.selectedSport = null;
    this.selectedLeague = null;
    this.selectedGame = null;
    this.selectedTeam = null;
    this.selectedWagerType = null;
    this.selectedUnit = null;
    this.selectedPhrase = null;
    this.notes = '';

    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.phraseLastVisible = null;

    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.phraseButtonsData = [];

    this.titleEl.textContent = 'Please select a Sport';
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';
    this.setStatus('');

    this.loadSports();
  }
}
