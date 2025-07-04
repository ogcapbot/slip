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

const PAGE_LIMIT = 42;

export class AddNewWorkflow {
  constructor(container, userId) {
    this.container = container;
    this.userId = userId;

    // Pagination cursors to enable "Load More" for each collection
    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.phraseLastVisible = null;

    // Arrays to hold fetched unique button labels/data
    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.phraseButtonsData = [];

    // Track user selections through the workflow
    this.selectedSport = null;
    this.selectedLeague = null;
    this.selectedGame = null;
    this.selectedTeam = null;
    this.selectedWagerType = null;
    this.selectedUnit = null;
    this.selectedPhrase = null;
    this.notes = '';

    this.step = 1;

    this.renderInitialUI();
    this.loadSports();
  }

  // ------------------------
  // Clears the container UI
  // ------------------------
  clearContainer() {
    this.container.innerHTML = '';
  }

  // ------------------------
  // Setup initial UI elements
  // ------------------------
  renderInitialUI() {
    console.log('[Init] Setting up UI');
    this.clearContainer();

    // Title/header for current workflow step
    this.titleEl = document.createElement('h2');
    this.titleEl.id = 'workflowTitle';
    this.container.appendChild(this.titleEl);

    // Button container (grid style)
    this.buttonsWrapper = document.createElement('div');
    this.buttonsWrapper.id = 'buttonsWrapper';
    this.buttonsWrapper.style.display = 'grid';
    this.buttonsWrapper.style.gridTemplateColumns = 'repeat(3, 1fr)';
    this.buttonsWrapper.style.gap = '8px';
    this.container.appendChild(this.buttonsWrapper);

    // Notes textarea container
    this.notesContainer = document.createElement('div');
    this.notesContainer.style.marginTop = '16px';
    this.notesContainer.style.display = 'none'; // Hidden initially

    this.notesTextarea = document.createElement('textarea');
    this.notesTextarea.maxLength = 100;
    this.notesTextarea.rows = 2;
    this.notesTextarea.cols = 50;
    this.notesTextarea.style.fontFamily = "'Oswald', sans-serif";
    this.notesTextarea.addEventListener('input', () => {
      const remaining = 100 - this.notesTextarea.value.length;
      this.charCount.textContent = `${remaining} characters remaining`;
      this.notes = this.notesTextarea.value;
      console.log(`[Notes] User typed notes: "${this.notes}"`);
    });
    this.notesContainer.appendChild(this.notesTextarea);

    this.charCount = document.createElement('div');
    this.charCount.style.fontSize = '0.8em';
    this.charCount.style.color = '#555';
    this.charCount.textContent = '100 characters remaining';
    this.notesContainer.appendChild(this.charCount);

    // Append notes container BEFORE submit button for proper UI order
    this.container.appendChild(this.notesContainer);

    // Submit button, hidden initially, shown on final step
    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = 'Submit';
    this.submitBtn.classList.add('admin-button');
    this.submitBtn.style.marginTop = '20px';
    this.submitBtn.style.display = 'none';
    this.submitBtn.addEventListener('click', () => this.onSubmit());
    this.container.appendChild(this.submitBtn);

    // Status message for feedback/errors
    this.statusMsg = document.createElement('p');
    this.statusMsg.style.marginTop = '16px';
    this.container.appendChild(this.statusMsg);

    // Load More button for pagination, initially hidden
    this.loadMoreBtn = document.createElement('button');
    this.loadMoreBtn.textContent = 'Load More';
    this.loadMoreBtn.classList.add('admin-button');
    this.loadMoreBtn.style.marginTop = '10px';
    this.loadMoreBtn.style.display = 'none';
    this.loadMoreBtn.addEventListener('click', () => this.onLoadMore());
    this.container.appendChild(this.loadMoreBtn);
  }

  // Set user-visible status message with optional error coloring
  setStatus(msg, isError = false) {
    this.statusMsg.textContent = msg;
    this.statusMsg.style.color = isError ? 'red' : 'inherit';
    if (msg) console.log(`[Status] ${msg}`);
  }

  // #############
  // LOAD SPORTS
  // #############
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

      console.log('[LoadSports] Executing query for sports...');
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('[LoadSports] No more sports found.');
        this.setStatus('No more sports to load.');
        this.loadMoreBtn.style.display = 'none';
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
      console.log(`[LoadSports] Loaded sports count: ${this.sportButtonsData.length}`);

      this.renderButtons(this.sportButtonsData, 'sport');

      // Show Load More if we fetched a full page
      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('[LoadSports] Error loading sports:', error);
      this.setStatus('Failed to load sports. See console for details.', true);
    }
  }

  // #############
  // LOAD LEAGUES
  // #############
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

      console.log(`[LoadLeagues] Querying leagues for sport: ${this.selectedSport}`);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('[LoadLeagues] No more leagues found.');
        this.setStatus('No more leagues to load.');
        this.loadMoreBtn.style.display = 'none';
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
      console.log(`[LoadLeagues] Loaded leagues count: ${this.leagueButtonsData.length}`);

      this.renderButtons(this.leagueButtonsData, 'league');

      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('[LoadLeagues] Error loading leagues:', error);
      this.setStatus('Failed to load leagues. See console for details.', true);
    }
  }

  // #############
  // LOAD GAMES
  // #############
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
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

      let q;
      if (!loadMore || !this.gameLastVisible) {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.selectedLeague),
          where('startTimeET', '>=', fiveHoursAgo),
          orderBy('startTimeET'),
          limit(PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.selectedLeague),
          where('startTimeET', '>=', fiveHoursAgo),
          orderBy('startTimeET'),
          startAfter(this.gameLastVisible),
          limit(PAGE_LIMIT)
        );
      }

      console.log(`[LoadGames] Querying games for league: ${this.selectedLeague}`);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('[LoadGames] No more games found.');
        this.setStatus('No more games to load.');
        this.loadMoreBtn.style.display = 'none';
        return;
      }

      this.gameLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const gameId = doc.id;

        if (gameId && !this.gameButtonsData.some((g) => g.id === gameId)) {
          this.gameButtonsData.push({
            id: gameId,
            display: this.formatGameDisplay(data),
            awayTeam: data.awayTeam,
            homeTeam: data.homeTeam,
            startTimeET: data.startTimeET instanceof Date ? data.startTimeET : (data.startTimeET?.toDate ? data.startTimeET.toDate() : new Date(data.startTimeET)),
          });
        }
      });

      this.gameButtonsData.sort((a, b) => a.startTimeET - b.startTimeET);
      console.log(`[LoadGames] Loaded games count: ${this.gameButtonsData.length}`);

      this.renderButtons(this.gameButtonsData.map((g) => g.display), 'game');

      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('[LoadGames] Error loading games:', error);
      this.setStatus('Failed to load games. See console for details.', true);
    }
  }

  // -----------------------------------------
  // Format game display string per spec rules
  // -----------------------------------------
  formatGameDisplay(game) {
    const awayTeam = game.awayTeam || '';
    const homeTeam = game.homeTeam || '';

    // Normalize start time to JS Date
    const startTime = game.startTimeET instanceof Date
      ? game.startTimeET
      : (game.startTimeET?.toDate ? game.startTimeET.toDate() : new Date(game.startTimeET));

    if (!startTime) return `${awayTeam}\n@ ${homeTeam}\nDate TBD`;

    const now = new Date();
    const diffMs = startTime - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Time options for locale string formatting
    const timeOptionsEST = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    };
    const timeOptionsNoEST = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    let timeLabelEST = startTime.toLocaleTimeString('en-US', timeOptionsEST);
    let timeLabelNoEST = startTime.toLocaleTimeString('en-US', timeOptionsNoEST);

    // Format output per your rules:
    if (diffMs < 0) {
      return `${awayTeam}\n@ ${homeTeam}\nStarted @ ${timeLabelEST}`;
    }
    if (diffDays === 0) {
      return `${awayTeam}\n@ ${homeTeam}\nToday @ ${timeLabelEST}`;
    }
    if (diffDays === 1) {
      return `${awayTeam}\n@ ${homeTeam}\nTomorrow @ ${timeLabelNoEST}`;
    }
    if (diffDays > 1) {
      return `${awayTeam}\n@ ${homeTeam}\n${diffDays} Days Away @ ${timeLabelNoEST}`;
    }

    return `${awayTeam}\n@ ${homeTeam}\n${startTime.toLocaleDateString()} @ ${timeLabelNoEST}`;
  }

  // #############
  // LOAD TEAMS
  // #############
  async loadTeams() {
    if (!this.selectedGame) {
      this.setStatus('Please select a game first.', true);
      return;
    }

    this.step = 4;
    this.titleEl.textContent = 'Select a Team';
    this.setStatus('');

    this.notesContainer.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';

    const teams = [
      this.selectedGame.awayTeam || 'Away Team',
      this.selectedGame.homeTeam || 'Home Team',
    ];

    this.renderButtons(teams, 'team');
  }

  // #############
  // LOAD WAGER TYPES
  // #############
  async loadWagerTypes() {
    if (!this.selectedTeam) {
      this.setStatus('Please select a team first.', true);
      return;
    }

    this.step = 5;
    this.titleEl.textContent = `Select a Wager Type for ${this.selectedTeam}`;
    this.setStatus('');
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    try {
      // Load global wagers (Sport == "All")
      const globalQuery = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', 'All'),
        limit(50)
      );
      const globalSnap = await getDocs(globalQuery);
      const globalWagers = globalSnap.docs.map((doc) => doc.data());

      // Load sport-specific wagers
      const sportQuery = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', this.selectedSport),
        limit(50)
      );
      const sportSnap = await getDocs(sportQuery);
      const sportWagers = sportSnap.docs.map((doc) => doc.data());

      console.log(`[LoadWagerTypes] Global wagers: ${globalWagers.length}, Sport wagers: ${sportWagers.length}`);

      this.renderWagerTypes(globalWagers, sportWagers);
    } catch (error) {
      console.error('[LoadWagerTypes] Error loading wager types:', error);
      this.setStatus('Failed to load wager types. See console for details.', true);
    }
  }

  // Format wager button label with line breaks for parentheses and keywords
  formatWagerLabel(label) {
    let formatted = label.replace(/\s*\(([^)]+)\)/, '\n($1)');
    formatted = formatted.replace(/ (PLUS|MINUS|OVER|UNDER)/, '\n$1');
    return formatted;
  }

  renderWagerTypes(globalWagers, sportWagers) {
    this.buttonsWrapper.innerHTML = '';

    globalWagers.forEach((wager) => {
      const btn = document.createElement('button');
      btn.textContent = this.formatWagerLabel(wager.wager_label_template || wager.WagerType || 'Unnamed');
      btn.classList.add('admin-button');
      btn.addEventListener('click', () => {
        this.selectedWagerType = wager.wager_label_template || wager.WagerType;
        this.loadUnits();
      });
      this.buttonsWrapper.appendChild(btn);
    });

    sportWagers.forEach((wager) => {
      const btn = document.createElement('button');
      btn.textContent = this.formatWagerLabel(wager.wager_label_template || wager.WagerType || 'Unnamed');
      btn.classList.add('admin-button');
      btn.addEventListener('click', () => {
        this.selectedWagerType = wager.wager_label_template || wager.WagerType;
        this.loadUnits();
      });
      this.buttonsWrapper.appendChild(btn);
    });
  }

  // #############
  // LOAD UNITS
  // #############
  async loadUnits() {
    if (!this.selectedWagerType) {
      this.setStatus('Please select a wager type first.', true);
      return;
    }

    this.step = 6;
    this.titleEl.textContent = `Select Units for ${this.selectedWagerType}`;
    this.setStatus('');
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

      console.log(`[LoadUnits] Loaded ${units.length} units`);
      this.renderButtons(units.map((u) => this.formatUnitLabel(u.display_unit)), 'unit');
    } catch (error) {
      console.error('[LoadUnits] Error loading units:', error);
      this.setStatus('Failed to load units. See console for details.', true);
    }
  }

  // Format unit label with multiline for parentheses
  formatUnitLabel(label) {
    return label.replace(/\s*\(([^)]+)\)/, '\n($1)');
  }

  // #############
  // LOAD PHRASES
  // #############
  async loadPhrases(loadMore = false) {
    if (!this.selectedUnit) {
      this.setStatus('Please select units first.', true);
      return;
    }

    this.step = 7;
    this.titleEl.textContent = `Select a Phrase`;
    this.setStatus('');
    this.notesContainer.style.display = 'none';
    this.submitBtn.style.display = 'none';

    try {
      // Fetch sport-specific active phrases
      const sportQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active'),
        where('Sport', '==', this.selectedSport)
      );
      const sportSnap = await getDocs(sportQuery);
      let sportPhrases = sportSnap.docs.map(doc => doc.data());

      // Fetch "OG Cap" type active phrases
      const ogCapQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active'),
        where('Type', '==', 'OG Cap')
      );
      const ogCapSnap = await getDocs(ogCapQuery);
      let ogCapPhrases = ogCapSnap.docs.map(doc => doc.data());

      // Fetch all other active phrases
      const allQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active')
      );
      const allSnap = await getDocs(allQuery);
      let allPhrases = allSnap.docs.map(doc => doc.data());

      // Filter out sport and OG Cap phrases from all
      const sportIds = new Set(sportPhrases.map(p => p.Phrase));
      const ogCapIds = new Set(ogCapPhrases.map(p => p.Phrase));
      allPhrases = allPhrases.filter(p => !sportIds.has(p.Phrase) && !ogCapIds.has(p.Phrase));

      // Shuffle helper
      function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      // Shuffle lists
      sportPhrases = shuffle(sportPhrases);
      ogCapPhrases = shuffle(ogCapPhrases);
      allPhrases = shuffle(allPhrases);

      // Combine with priority: sport, OG Cap, others
      const combinedPhrases = [...sportPhrases, ...ogCapPhrases, ...allPhrases];

      const startIndex = loadMore ? this.phraseButtonsData.length : 0;
      const phrasesToLoad = combinedPhrases.slice(startIndex, startIndex + PAGE_LIMIT);

      if (phrasesToLoad.length === 0) {
        console.log('[LoadPhrases] No more phrases to load.');
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more phrases to load.');
        return;
      }

      if (!loadMore) {
        this.phraseButtonsData = [];
      }
      this.phraseButtonsData.push(...phrasesToLoad.map(p => p.Phrase));

      console.log(`[LoadPhrases] Loaded ${phrasesToLoad.length} phrases (total: ${this.phraseButtonsData.length})`);
      this.renderButtons(this.phraseButtonsData, 'phrase');

      if (startIndex + PAGE_LIMIT < combinedPhrases.length) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('[LoadPhrases] Error loading phrases:', error);
      this.setStatus('Failed to load phrases. See console for details.', true);
    }
  }

  // #############
  // NOTES (always visible, above submit)
  // #############
  askNotes() {
    console.log('[AskNotes] Showing notes/comments textarea');
    this.step = 8;
    this.notesContainer.style.display = 'block';
    this.submitBtn.style.display = 'inline-block';
    this.titleEl.textContent = 'Notes/Comments (Optional)';
    this.buttonsWrapper.innerHTML = '';
  }

  // #############
  // LOAD MORE BUTTON CLICK HANDLER
  // #############
  async onLoadMore() {
    console.log(`[LoadMore] Load More clicked at step ${this.step}`);
    try {
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
          console.log('[LoadMore] No load more action for current step.');
      }
    } catch (error) {
      console.error('[LoadMore] Error during load more:', error);
      this.setStatus('Failed to load more items. See console for details.', true);
    }
  }

  // #############
  // RENDER BUTTONS AND HANDLE CLICKS
  // #############
  renderButtons(items, type) {
    console.log(`[RenderButtons] Rendering ${items.length} buttons for type: ${type}`);
    this.buttonsWrapper.innerHTML = '';

    items.forEach((label) => {
      const btn = document.createElement('button');
      btn.classList.add('admin-button');

      if (type === 'game') {
        btn.style.whiteSpace = 'pre-line';
        btn.innerHTML = label.replace(/\n/g, '<br>');
      } else {
        btn.textContent = label;
      }

      btn.addEventListener('click', () => {
        console.log(`[ButtonClick] Type: ${type}, Label: ${label}`);

        switch (type) {
          case 'sport':
            if (this.selectedSport !== label) {
              console.log(`[Selection] Sport selected: ${label}`);
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
              console.log(`[Selection] League selected: ${label}`);
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
              console.log(`[Selection] Game selected: ${this.selectedGame.id}`);
              this.step = 4;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadTeams();
            }
            break;

          case 'team':
            if (this.selectedTeam !== label) {
              console.log(`[Selection] Team selected: ${label}`);
              this.selectedTeam = label;
              this.step = 5;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadWagerTypes();
            }
            break;

          case 'wagerType':
            if (this.selectedWagerType !== label) {
              console.log(`[Selection] Wager Type selected: ${label}`);
              this.selectedWagerType = label;
              this.step = 6;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadUnits();
            }
            break;

          case 'unit':
            if (this.selectedUnit !== label) {
              console.log(`[Selection] Unit selected: ${label}`);
              this.selectedUnit = label;
              this.step = 7;
              this.loadMoreBtn.style.display = 'inline-block';
              this.submitBtn.style.display = 'none';
              this.loadPhrases();
            }
            break;

          case 'phrase':
            if (this.selectedPhrase !== label) {
              console.log(`[Selection] Phrase selected: ${label}`);
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

  // #############
  // FINAL SUBMIT
  // #############
  async onSubmit() {
    console.log('[Submit] Submit button clicked');

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

      console.log('[Submit] Submission successful');
      this.setStatus(`Your ${this.selectedTeam} ${this.selectedUnit} ${this.selectedWagerType} Official Pick has been Successfully Saved.`);
      this.submitBtn.style.display = 'none';
      this.notesContainer.style.display = 'none';

      this.resetWorkflow();
    } catch (error) {
      console.error('[Submit] Error submitting:', error);
      this.setStatus('Failed to submit your selection. See console for details.', true);
    }
  }

  // #############
  // RESET WORKFLOW
  // #############
  resetWorkflow() {
    console.log('[Reset] Resetting workflow for new submission');
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
