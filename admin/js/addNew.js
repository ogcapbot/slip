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

    // Pagination cursors: track the last visible doc for each paginated collection
    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.phraseLastVisible = null;

    // Data arrays to keep track of fetched buttons and prevent duplicates
    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.phraseButtonsData = [];

    // User selections across steps
    this.selectedSport = null;
    this.selectedLeague = null;
    this.selectedGame = null;
    this.selectedTeam = null;
    this.selectedWagerType = null;
    this.selectedUnit = null;
    this.selectedPhrase = null;
    this.notes = '';

    this.step = 1; // Current workflow step tracker

    // Initialize UI elements and begin by loading sports buttons
    this.renderInitialUI();
    this.loadSports();
  }

  // ###############################
  // UI INITIALIZATION
  // ###############################
  clearContainer() {
    this.container.innerHTML = '';
  }

  renderInitialUI() {
    console.log('[Init] Rendering initial UI');
    this.clearContainer();

    // Title element: displays current step instructions or selections
    this.titleEl = document.createElement('h2');
    this.titleEl.id = 'workflowTitle';
    this.container.appendChild(this.titleEl);

    // Container div for all buttons in the workflow
    this.buttonsWrapper = document.createElement('div');
    this.buttonsWrapper.id = 'buttonsWrapper';
    this.buttonsWrapper.style.display = 'grid';
    this.buttonsWrapper.style.gridTemplateColumns = 'repeat(3, 1fr)';
    this.buttonsWrapper.style.gap = '8px';
    this.container.appendChild(this.buttonsWrapper);

    // "Load More" button for paginated data loading, hidden by default
    this.loadMoreBtn = document.createElement('button');
    this.loadMoreBtn.textContent = 'Load More';
    this.loadMoreBtn.classList.add('admin-button');
    this.loadMoreBtn.style.marginTop = '12px';
    this.loadMoreBtn.style.display = 'none';
    this.loadMoreBtn.addEventListener('click', () => this.onLoadMore());
    this.container.appendChild(this.loadMoreBtn);

    // Submit button, only shown on the last step after phrase selection
    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = 'Submit';
    this.submitBtn.classList.add('admin-button');
    this.submitBtn.style.marginTop = '20px';
    this.submitBtn.style.display = 'none';
    this.submitBtn.addEventListener('click', () => this.onSubmit());
    this.container.appendChild(this.submitBtn);

    // Status message paragraph for user feedback and errors
    this.statusMsg = document.createElement('p');
    this.statusMsg.style.marginTop = '16px';
    this.container.appendChild(this.statusMsg);

    // Notes container with textarea, initially hidden, shown on last step
    this.notesContainer = document.createElement('div');
    this.notesContainer.style.marginTop = '16px';
    this.notesContainer.style.display = 'block'; // Always visible now per your request

    this.notesTextarea = document.createElement('textarea');
    this.notesTextarea.maxLength = 100;
    this.notesTextarea.rows = 2;
    this.notesTextarea.cols = 50;
    this.notesTextarea.style.fontFamily = "'Oswald', sans-serif";
    this.notesTextarea.placeholder = "Notes/Comments (Optional)";
    this.notesTextarea.addEventListener('input', () => {
      const remaining = 100 - this.notesTextarea.value.length;
      this.charCount.textContent = `${remaining} characters remaining`;
      this.notes = this.notesTextarea.value;
      console.log(`[Notes] User typed notes: ${this.notes}`);
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
    console.log(`[Status] ${msg}`);
  }

  // ########################################
  // Sport Buttons  #sports
  // ########################################
  // Loads active sports from SportsData collection, paginated
  // Deduplicates by 'group' field and sorts alphabetically
  async loadSports(loadMore = false) {
    console.log('[LoadSports] Loading sports...');
    this.step = 1;
    this.titleEl.textContent = 'Please select a Sport';
    this.setStatus('Loading sports...');
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    try {
      let q;
      if (!loadMore || !this.sportLastVisible) {
        // Initial query: first page of active sports ordered by 'group'
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          orderBy('group'),
          limit(PAGE_LIMIT)
        );
      } else {
        // Paginated query: start after last visible sport
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          orderBy('group'),
          startAfter(this.sportLastVisible),
          limit(PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);
      console.log(`[LoadSports] Fetched ${snapshot.size} sports documents.`);

      if (snapshot.empty) {
        console.log('[LoadSports] No more sports to load.');
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

      console.log(`[LoadSports] Total unique sports loaded: ${this.sportButtonsData.length}`);

      this.renderButtons(this.sportButtonsData, 'sport');

      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('[LoadSports] Error loading sports:', error);
      this.setStatus('Failed to load sports.', true);
    }
  }

  // ########################################
  // League Buttons  #league
  // ########################################
  // Loads active leagues filtered by selected sport from SportsData collection, paginated
  async loadLeagues(loadMore = false) {
    if (!this.selectedSport) {
      this.setStatus('Please select a sport first.', true);
      return;
    }

    console.log(`[LoadLeagues] Loading leagues for sport: ${this.selectedSport}`);
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
      console.log(`[LoadLeagues] Fetched ${snapshot.size} league documents.`);

      if (snapshot.empty) {
        console.log('[LoadLeagues] No more leagues to load.');
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

      console.log(`[LoadLeagues] Total unique leagues loaded: ${this.leagueButtonsData.length}`);

      this.renderButtons(this.leagueButtonsData, 'league');

      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('[LoadLeagues] Error loading leagues:', error);
      this.setStatus('Failed to load leagues.', true);
    }
  }

  // ########################################
  // Game Buttons  #games
  // ########################################
  // Loads games filtered by selected league, sorted ascending by start time, paginated
  // Filters out games older than now() - 5 hours
  async loadGames(loadMore = false) {
    if (!this.selectedLeague) {
      this.setStatus('Please select a league first.', true);
      return;
    }

    console.log(`[LoadGames] Loading games for league: ${this.selectedLeague}`);
    this.step = 3;
    this.titleEl.textContent = `Selected League: ${this.selectedLeague} — Select a Game`;
    this.setStatus(`Loading games for league ${this.selectedLeague}...`);
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    try {
      // Calculate the timestamp for now() - 5 hours
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

      const snapshot = await getDocs(q);
      console.log(`[LoadGames] Fetched ${snapshot.size} game documents.`);

      if (snapshot.empty) {
        console.log('[LoadGames] No more games to load.');
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
            startTimeET: data.startTimeET instanceof Date
              ? data.startTimeET
              : (data.startTimeET?.toDate ? data.startTimeET.toDate() : new Date(data.startTimeET)),
          });
        }
      });

      // Sort games ascending by start time
      this.gameButtonsData.sort(
        (a, b) => a.startTimeET - b.startTimeET
      );

      console.log(`[LoadGames] Total unique games loaded: ${this.gameButtonsData.length}`);

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
      console.error('[LoadGames] Error loading games:', error);
      this.setStatus('Failed to load games.', true);
    }
  }

  // ########################################
  // Format Game Display Text  #formatGame
  // ########################################
  // Formats game info into multiline string with date/time labels as requested
  formatGameDisplay(game) {
    const awayTeam = game.awayTeam || '';
    const homeTeam = game.homeTeam || '';

    // Normalize Firestore Timestamp or string to Date object
    const startTime = game.startTimeET instanceof Date
      ? game.startTimeET
      : (game.startTimeET?.toDate ? game.startTimeET.toDate() : new Date(game.startTimeET));
    if (!startTime) return `${awayTeam}\n@ ${homeTeam}\nDate TBD`;

    const now = new Date();
    const diffMs = startTime - now;

    let dayLabel = '';
    let timeLabelWithEST = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    });
    let timeLabelNoEST = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const dayDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (dayDiff >= 2) {
      dayLabel = `${dayDiff} Days Away`;
    } else if (dayDiff === 1) {
      dayLabel = 'Tomorrow';
    } else if (dayDiff === 0) {
      dayLabel = 'Today';
    } else if (diffMs < 0) {
      dayLabel = 'Started';
    }

    let bottomLine = '';
    if (diffMs < 0) {
      bottomLine = `Started @ ${timeLabelWithEST} EST`;
    } else if (dayDiff === 0) {
      bottomLine = `Today @ ${timeLabelWithEST} EST`;
    } else if (dayDiff === 1) {
      bottomLine = `Tomorrow @ ${timeLabelNoEST}`;
    } else {
      bottomLine = `${dayLabel} @ ${timeLabelNoEST}`;
    }

    return `${awayTeam}\n@ ${homeTeam}\n${bottomLine}`;
  }

  // ########################################
  // Team Selection Buttons  #teams
  // ########################################
  // Displays two buttons: away team and home team from selected game
  async loadTeams() {
    if (!this.selectedGame) {
      this.setStatus('Please select a game first.', true);
      return;
    }

    console.log('[LoadTeams] Loading team buttons');
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

  // ########################################
  // Wager Types Buttons  #wagerTypes
  // ########################################
  // Loads wager types: global wagers first, then sport-specific wagers (if any)
  async loadWagerTypes() {
    if (!this.selectedTeam) {
      this.setStatus('Please select a team first.', true);
      return;
    }

    console.log(`[LoadWagerTypes] Loading wager types for selected team: ${this.selectedTeam}`);
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
        limit(50)
      );
      const globalSnap = await getDocs(globalQuery);
      const globalWagers = globalSnap.docs.map((doc) => doc.data());

      // Sport-specific wagers
      const sportQuery = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', this.selectedSport),
        limit(50)
      );
      const sportSnap = await getDocs(sportQuery);
      const sportWagers = sportSnap.docs.map((doc) => doc.data());

      console.log(`[LoadWagerTypes] Global wagers count: ${globalWagers.length}, Sport-specific wagers count: ${sportWagers.length}`);

      this.renderWagerTypes(globalWagers, sportWagers);
    } catch (error) {
      console.error('[LoadWagerTypes] Error loading wager types:', error);
      this.setStatus('Failed to load wager types.', true);
    }
  }

  renderWagerTypes(globalWagers, sportWagers) {
    this.buttonsWrapper.innerHTML = '';

    // Render global wager buttons first
    if (globalWagers.length) {
      console.log(`[RenderWagerTypes] Rendering ${globalWagers.length} global wager buttons`);
      globalWagers.forEach((wager) => {
        const btn = document.createElement('button');
        // Format wager_label_template per requirements
        btn.innerHTML = this.formatWagerLabel(wager.wager_label_template || 'Unnamed');
        btn.classList.add('admin-button');
        btn.addEventListener('click', () => {
          this.selectedWagerType = wager.wager_label_template;
          this.loadUnits();
        });
        this.buttonsWrapper.appendChild(btn);
      });
    }

    // Then render sport-specific wager buttons if any
    if (sportWagers.length) {
      console.log(`[RenderWagerTypes] Rendering ${sportWagers.length} sport-specific wager buttons`);
      // Removed the separator per your request

      sportWagers.forEach((wager) => {
        const btn = document.createElement('button');
        btn.innerHTML = this.formatWagerLabel(wager.wager_label_template || 'Unnamed');
        btn.classList.add('admin-button');
        btn.addEventListener('click', () => {
          this.selectedWagerType = wager.wager_label_template;
          this.loadUnits();
        });
        this.buttonsWrapper.appendChild(btn);
      });
    }
  }

  // Format wager label with line breaks per your rules
  formatWagerLabel(label) {
    // Rule 1: If label contains parentheses, put content inside parentheses on second line
    let formatted = label.replace(/\(([^)]+)\)/g, (match, p1) => `<br>(${p1})`);

    // Rule 2: If label contains " PLUS", " MINUS", " OVER", or " UNDER" (space before caps), break before that word
    formatted = formatted.replace(/ (PLUS|MINUS|OVER|UNDER)(.*)/, (match, p1, p2) => `<br>${p1}${p2}`);

    return formatted;
  }

  // ########################################
  // Units Buttons  #units
  // ########################################
  // Loads units sorted by Rank from Units collection
  async loadUnits() {
    if (!this.selectedWagerType) {
      this.setStatus('Please select a wager type first.', true);
      return;
    }

    console.log(`[LoadUnits] Loading units for wager type: ${this.selectedWagerType}`);
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

      console.log(`[LoadUnits] Loaded ${units.length} units`);
      this.renderButtons(units.map((u) => this.formatUnitLabel(u.display_unit)), 'unit');
    } catch (error) {
      console.error('[LoadUnits] Error loading units:', error);
      this.setStatus('Failed to load units.', true);
    }
  }

  // Format unit label with line break before parentheses content
  formatUnitLabel(label) {
    return label.replace(/\(([^)]+)\)/g, (match, p1) => `<br>(${p1})`);
  }

  // ########################################
  // Phrases Buttons  #phrases
  // ########################################
  // Loads active hype phrases showing sport-specific first, then "OG Cap" type, then others, all randomized within groups
  async loadPhrases(loadMore = false) {
    if (!this.selectedUnit) {
      this.setStatus('Please select units first.', true);
      return;
    }

    console.log('[LoadPhrases] Loading phrases...');
    this.step = 7;
    this.titleEl.textContent = `Select a Phrase`;
    this.notesContainer.style.display = 'none';
    this.submitBtn.style.display = 'none';

    try {
      // Fetch all active phrases matching selected sport
      const sportQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active'),
        where('Sport', '==', this.selectedSport)
      );
      const sportSnap = await getDocs(sportQuery);
      const sportPhrases = sportSnap.docs.map(doc => doc.data().Phrase);

      // Fetch all active phrases where Type == "OG Cap"
      const ogCapQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active'),
        where('Type', '==', 'OG Cap')
      );
      const ogCapSnap = await getDocs(ogCapQuery);
      const ogCapPhrases = ogCapSnap.docs.map(doc => doc.data().Phrase);

      // Fetch all other active phrases not in above groups
      const allQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active')
      );
      const allSnap = await getDocs(allQuery);
      const allPhrases = allSnap.docs.map(doc => doc.data().Phrase);

      // Filter out sportPhrases and ogCapPhrases from allPhrases to avoid duplicates
      const otherPhrases = allPhrases.filter(p => !sportPhrases.includes(p) && !ogCapPhrases.includes(p));

      // Shuffle helper function
      const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

      // Shuffle each group
      const sportShuffled = shuffle(sportPhrases);
      const ogCapShuffled = shuffle(ogCapPhrases);
      const otherShuffled = shuffle(otherPhrases);

      // Combine in order: sport, OG Cap, others
      const combinedPhrases = [...sportShuffled, ...ogCapShuffled, ...otherShuffled];

      // Pagination slice calculation
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
      this.phraseButtonsData.push(...phrasesToLoad);

      console.log(`[LoadPhrases] Loaded ${phrasesToLoad.length} phrases (total loaded: ${this.phraseButtonsData.length})`);

      this.renderButtons(this.phraseButtonsData, 'phrase');

      if (startIndex + PAGE_LIMIT < combinedPhrases.length) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('[LoadPhrases] Error loading phrases:', error);
      this.setStatus('Failed to load phrases.', true);
    }
  }

  // ########################################
  // Notes Section  #notes
  // ########################################
  // Always show notes textarea above submit, no prompt asking anymore
  showNotesSection() {
    console.log('[ShowNotes] Displaying notes textarea');
    this.notesContainer.style.display = 'block';
    this.submitBtn.style.display = 'inline-block';
    this.titleEl.textContent = 'Notes/Comments (Optional)';
    this.buttonsWrapper.innerHTML = '';
  }

  // ########################################
  // Load More Pagination Button Handler
  // ########################################
  async onLoadMore() {
    console.log(`[LoadMore] Load More clicked at step ${this.step}`);
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

  // ########################################
  // Button Rendering and Click Handling  #renderButtons
  // ########################################
  renderButtons(items, type) {
    console.log(`[RenderButtons] Rendering ${items.length} buttons for type: ${type}`);
    this.buttonsWrapper.innerHTML = '';

    items.forEach((label) => {
      const btn = document.createElement('button');
      btn.classList.add('admin-button');

      // Format multiline games with line breaks
      if (type === 'game') {
        btn.style.whiteSpace = 'pre-line';
        btn.innerHTML = label.replace(/\n/g, '<br>');
      } else if (type === 'unit' || type === 'wagerType') {
        // For unit and wagerType, label is already formatted with html tags for line breaks
        btn.innerHTML = label;
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
              this.notesContainer.style.display = 'none';
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
              this.notesContainer.style.display = 'none';
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
              this.notesContainer.style.display = 'none';
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
              this.notesContainer.style.display = 'none';
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
              this.notesContainer.style.display = 'none';
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
              this.notesContainer.style.display = 'none';
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
              this.notesContainer.style.display = 'block'; // Show notes textarea on phrase select
              this.showNotesSection(); // No prompt, just show notes box
            }
            break;
        }
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  // ########################################
  // Final Submit Handler  #submit
  // ########################################
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
      this.setStatus('Failed to submit your selection.', true);
    }
  }

  // ########################################
  // Reset Workflow for Fresh Start  #reset
  // ########################################
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
