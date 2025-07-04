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

// Import the NumberInputModal from the same folder
import { NumberInputModal } from './NumberInputModal.js';

const PAGE_LIMIT = 54;

export class AddNewWorkflow {
  constructor(container, userId) {
    this.container = container;
    this.userId = userId;

    // Initialize the NumberInputModal instance here
    this.numberInputModal = new NumberInputModal(this.container);

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
    this.wagerNumberValue = null; // for number input from modal

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

    // Notes container with textarea, shown on last step, above Submit button
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
      console.log(`[Notes] User typed notes: ${this.notes}`);
    });
    this.notesContainer.appendChild(this.notesTextarea);

    this.charCount = document.createElement('div');
    this.charCount.style.fontSize = '0.8em';
    this.charCount.style.color = '#555';
    this.charCount.textContent = '100 characters remaining';
    this.notesContainer.appendChild(this.charCount);

    this.container.appendChild(this.notesContainer);

    // ** Insert notesContainer before submitBtn so notes appear above Submit button **
    this.container.insertBefore(this.notesContainer, this.submitBtn);
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
  // Loads games filtered by selected league, filtered for now()-5h and forward,
  // sorted ascending by start time, paginated
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

    // Compute cutoff date string (now - 5 hours) in format "YYYY-MM-DD HH:mm:ss"
    const now = new Date();
    const fiveHoursAgoDate = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    // Format date to Firestore string format (without "T" or "Z")
    const pad = (num) => (num < 10 ? '0' + num : num);
    const cutoffString = `${fiveHoursAgoDate.getFullYear()}-${pad(fiveHoursAgoDate.getMonth() + 1)}-${pad(fiveHoursAgoDate.getDate())} ${pad(fiveHoursAgoDate.getHours())}:${pad(fiveHoursAgoDate.getMinutes())}:${pad(fiveHoursAgoDate.getSeconds())}`;

    try {
      let q;
      if (!loadMore || !this.gameLastVisible) {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.selectedLeague),
          where('startTimeET', '>=', cutoffString),
          orderBy('startTimeET'),
          limit(PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.selectedLeague),
          where('startTimeET', '>=', cutoffString),
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
        if (!this.gameButtonsData.some((g) => g.id === gameId)) {
          this.gameButtonsData.push({
            id: gameId,
            display: this.formatGameDisplay(data),
            awayTeam: data.awayTeam,
            homeTeam: data.homeTeam,
            startTimeET: data.startTimeET,
          });
        }
      });

      this.gameButtonsData.sort((a, b) => a.startTimeET.localeCompare(b.startTimeET));

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
  // Formats game info into multiline string with contextual date/time labels for display on buttons
  formatGameDisplay(game) {
    const awayTeam = game.awayTeam || '';
    const homeTeam = game.homeTeam || '';

    // Parse startTimeET string "YYYY-MM-DD HH:mm:ss" into Date object in local timezone
    const parts = game.startTimeET.split(/[- :]/);
    const startTime = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);

    const now = new Date();
    const diffMs = startTime - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Format times with and without EST suffix as requested
    const formatESTTime = (date) =>
      date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York',
      });

    const formatLocalTime = (date) =>
      date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    let timeLabel, dateLabel;

    if (diffMs < 0) {
      // Game started
      timeLabel = formatESTTime(startTime);
      dateLabel = `Started @ ${timeLabel}`;
    } else if (diffDays === 0) {
      // Today
      timeLabel = formatESTTime(startTime);
      dateLabel = `Today @ ${timeLabel}`;
    } else if (diffDays === 1) {
      // Tomorrow (no EST)
      timeLabel = formatLocalTime(startTime);
      dateLabel = `Tomorrow @ ${timeLabel}`;
    } else if (diffDays >= 2) {
      // 2 or more days away (no EST)
      timeLabel = formatLocalTime(startTime);
      dateLabel = `${diffDays} Days Away @ ${timeLabel}`;
    } else {
      dateLabel = startTime.toLocaleDateString();
    }

    return `${awayTeam}\n@ ${homeTeam}\n${dateLabel}`;
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
        btn.classList.add('admin-button');

        // Format wager label per requirements: parentheses on second line,
        // and for PLUS, MINUS, OVER, UNDER put from space before these words on new line
        btn.innerHTML = this.formatWagerLabel(wager.wager_label_template || wager.WagerType || 'Unnamed');

        btn.addEventListener('click', async () => {
          // If wager label contains [[NUM]], prompt for number input modal
          if ((wager.wager_label_template || wager.WagerType || '').includes('[[NUM]]')) {
            const num = await this.numberInputModal.show();
            this.wagerNumberValue = num;
            this.selectedWagerType = (wager.wager_label_template || wager.WagerType).replace('[[NUM]]', num);
            this.loadUnits();
          } else {
            this.selectedWagerType = wager.wager_label_template || wager.WagerType;
            this.loadUnits();
          }
        });
        this.buttonsWrapper.appendChild(btn);
      });
    }

    // Then render sport-specific wager buttons if any
    if (sportWagers.length) {
      console.log(`[RenderWagerTypes] Rendering ${sportWagers.length} sport-specific wager buttons`);
      // No separator per user request — just render sport wagers after global

      sportWagers.forEach((wager) => {
        const btn = document.createElement('button');
        btn.classList.add('admin-button');

        btn.innerHTML = this.formatWagerLabel(wager.wager_label_template || wager.WagerType || 'Unnamed');

        btn.addEventListener('click', async () => {
          if ((wager.wager_label_template || wager.WagerType || '').includes('[[NUM]]')) {
            const num = await this.numberInputModal.show();
            this.wagerNumberValue = num;
            this.selectedWagerType = (wager.wager_label_template || wager.WagerType).replace('[[NUM]]', num);
            this.loadUnits();
          } else {
            this.selectedWagerType = wager.wager_label_template || wager.WagerType;
            this.loadUnits();
          }
        });
        this.buttonsWrapper.appendChild(btn);
      });
    }
  }

  // Helper: format wager label per requirements
  formatWagerLabel(label) {
    // Handle parentheses portion on new line
    let formatted = label.replace(/\(([^)]+)\)/g, '<br>($1)');

    // Handle PLUS, MINUS, OVER, UNDER preceded by space to new line
    formatted = formatted.replace(/ (\bPLUS\b|\bMINUS\b|\bOVER\b|\bUNDER\b)/g, '<br>$1');

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

      this.renderButtons(
        units.map((u) => this.formatUnitLabel(u.display_unit)),
        'unit'
      );
    } catch (error) {
      console.error('[LoadUnits] Error loading units:', error);
      this.setStatus('Failed to load units.', true);
    }
  }

  // Helper: format unit label to place parentheses portion on new line
  formatUnitLabel(label) {
    return label.replace(/\(([^)]+)\)/g, '<br>($1)');
  }

  // ########################################
  // Phrases Buttons  #phrases
  // ########################################
  // Loads active hype phrases showing sport-specific first (random order),
  // then "OG Cap" type phrases (random), then rest (random)
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
      // Fetch all active phrases
      const phrasesQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active')
      );
      const phrasesSnap = await getDocs(phrasesQuery);
      const allPhrases = phrasesSnap.docs.map((doc) => doc.data());

      // Filter by categories
      const sportSpecific = allPhrases.filter(p => p.Sport === this.selectedSport);
      const ogCapType = allPhrases.filter(p => p.Type === 'OG Cap' && p.Sport !== this.selectedSport);
      const others = allPhrases.filter(p => p.Sport !== this.selectedSport && p.Type !== 'OG Cap');

      // Shuffle helper
      const shuffle = (array) => array.sort(() => Math.random() - 0.5);

      // Combine per spec
      const combined = [...shuffle(sportSpecific), ...shuffle(ogCapType), ...shuffle(others)];

      // Pagination slice
      const startIndex = loadMore ? this.phraseButtonsData.length : 0;
      const phrasesToLoad = combined.slice(startIndex, startIndex + PAGE_LIMIT);

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

      console.log(`[LoadPhrases] Loaded ${phrasesToLoad.length} phrases (total loaded: ${this.phraseButtonsData.length})`);

      this.renderButtons(this.phraseButtonsData, 'phrase');

      if (startIndex + PAGE_LIMIT < combined.length) {
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
  // Display Notes textarea above Submit, no longer ask question
  showNotesSection() {
    console.log('[Notes] Showing Notes/Comments section (optional)');
    this.step = 8;
    this.notesTextarea.value = this.notes || '';
    const remaining = 100 - this.notesTextarea.value.length;
    this.charCount.textContent = `${remaining} characters remaining`;
    this.notesContainer.style.display = 'block';
    this.submitBtn.style.display = 'inline-block';

    this.titleEl.textContent = 'Notes/Comments (Optional)';

    // Clear buttons, no other buttons at this stage
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
      if (type === 'game' || type === 'unit') {
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
            // We handle wagerType click logic in renderWagerTypes, so here just skip
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
              this.showNotesSection();
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

      // Show submission summary instead of resetting workflow
      this.showSubmissionSummary();

    } catch (error) {
      console.error('[Submit] Error submitting:', error);
      this.setStatus('Failed to submit your selection.', true);
    }
  }

  // ########################################
  // Show Submission Summary (NEW)
  // ########################################
  showSubmissionSummary() {
    this.titleEl.textContent = 'Submission Summary';

    // Compose the success message
    const successMsg = `Your ${this.selectedTeam} ${this.selectedUnit} ${this.selectedWagerType} Official Pick has been Successfully Saved.`;

    // Clear buttons and hide notes + submit
    this.buttonsWrapper.innerHTML = '';
    this.notesContainer.style.display = 'none';
    this.submitBtn.style.display = 'none';

    // Show success message in status
    this.statusMsg.textContent = successMsg;
    this.statusMsg.style.color = 'inherit';

    // Create summary container
    const summaryDiv = document.createElement('div');
    summaryDiv.style.marginTop = '12px';
    summaryDiv.style.fontWeight = 'bold';
    summaryDiv.style.textAlign = 'left'; // align left as requested

    // List fields to display
    const fields = [
      { label: 'Sport', value: this.selectedSport },
      { label: 'League', value: this.selectedLeague },
      { label: 'Game', value: `${this.selectedGame?.awayTeam} @ ${this.selectedGame?.homeTeam}` },
      { label: 'Team', value: this.selectedTeam },
      { label: 'Wager Type', value: this.selectedWagerType },
      { label: 'Unit', value: this.selectedUnit },
      { label: 'Phrase', value: this.selectedPhrase },
      { label: 'Notes', value: this.notes || 'None' },
    ];

    fields.forEach(({ label, value }) => {
      const p = document.createElement('p');
      p.textContent = `${label}: ${value}`;
      summaryDiv.appendChild(p);
    });

    // Append summary after statusMsg
    if (this.statusMsg.nextSibling) {
      this.container.insertBefore(summaryDiv, this.statusMsg.nextSibling);
    } else {
      this.container.appendChild(summaryDiv);
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
    this.wagerNumberValue = null;

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
