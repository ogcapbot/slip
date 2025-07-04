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

    // Pagination cursors: track last visible docs for pagination
    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.phraseLastVisible = null;

    // Data arrays for deduplication
    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.phraseButtonsData = [];

    // User selections
    this.selectedSport = null;
    this.selectedLeague = null;
    this.selectedGame = null;
    this.selectedTeam = null;
    this.selectedWagerType = null;
    this.selectedUnit = null;
    this.selectedPhrase = null;
    this.notes = '';

    this.step = 1; // current step in workflow

    // Initialize UI and load sports
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

    // Title element
    this.titleEl = document.createElement('h2');
    this.titleEl.id = 'workflowTitle';
    this.container.appendChild(this.titleEl);

    // Buttons container with grid layout
    this.buttonsWrapper = document.createElement('div');
    this.buttonsWrapper.id = 'buttonsWrapper';
    this.buttonsWrapper.style.display = 'grid';
    this.buttonsWrapper.style.gridTemplateColumns = 'repeat(3, 1fr)';
    this.buttonsWrapper.style.gap = '8px';
    this.container.appendChild(this.buttonsWrapper);

    // Load More button (hidden by default)
    this.loadMoreBtn = document.createElement('button');
    this.loadMoreBtn.textContent = 'Load More';
    this.loadMoreBtn.classList.add('admin-button');
    this.loadMoreBtn.style.marginTop = '12px';
    this.loadMoreBtn.style.display = 'none';
    this.loadMoreBtn.addEventListener('click', () => this.onLoadMore());
    this.container.appendChild(this.loadMoreBtn);

    // Submit button (hidden initially)
    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = 'Submit';
    this.submitBtn.classList.add('admin-button');
    this.submitBtn.style.marginTop = '20px';
    this.submitBtn.style.display = 'none';
    this.submitBtn.addEventListener('click', () => this.onSubmit());
    this.container.appendChild(this.submitBtn);

    // Status message element for user feedback
    this.statusMsg = document.createElement('p');
    this.statusMsg.style.marginTop = '16px';
    this.container.appendChild(this.statusMsg);

    // Notes container (always visible now)
    this.notesContainer = document.createElement('div');
    this.notesContainer.style.marginTop = '16px';
    this.notesContainer.style.display = 'block'; // show by default

    // Textarea for optional notes/comments
    this.notesTextarea = document.createElement('textarea');
    this.notesTextarea.maxLength = 100;
    this.notesTextarea.rows = 2;
    this.notesTextarea.cols = 50;
    this.notesTextarea.style.fontFamily = "'Oswald', sans-serif";
    this.notesTextarea.placeholder = 'Enter notes/comments here (optional)';
    this.notesTextarea.addEventListener('input', () => {
      const remaining = 100 - this.notesTextarea.value.length;
      this.charCount.textContent = `${remaining} characters remaining`;
      this.notes = this.notesTextarea.value;
      console.log(`[Notes] User typed notes: ${this.notes}`);
    });
    this.notesContainer.appendChild(this.notesTextarea);

    // Character count below textarea
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
      console.log(`[LoadSports] Fetched ${snapshot.size} sports.`);

      if (snapshot.empty) {
        console.log('[LoadSports] No more sports.');
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more sports to load.');
        return;
      }

      this.sportLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach(doc => {
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
      console.error('[LoadSports] Error:', error);
      this.setStatus('Failed to load sports.', true);
    }
  }

  // ########################################
  // League Buttons  #league
  // ########################################
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
      console.log(`[LoadLeagues] Fetched ${snapshot.size} leagues.`);

      if (snapshot.empty) {
        console.log('[LoadLeagues] No more leagues.');
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more leagues to load.');
        return;
      }

      this.leagueLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach(doc => {
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
      console.error('[LoadLeagues] Error:', error);
      this.setStatus('Failed to load leagues.', true);
    }
  }

  // ########################################
  // Game Buttons  #games
  // ########################################
  // Only load games with startTimeET >= now - 5 hours
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
      const nowMinus5Hrs = new Date(Date.now() - 5 * 60 * 60 * 1000);

      let q;
      if (!loadMore || !this.gameLastVisible) {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.selectedLeague),
          where('startTimeET', '>=', nowMinus5Hrs),
          orderBy('startTimeET'),
          limit(PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.selectedLeague),
          where('startTimeET', '>=', nowMinus5Hrs),
          orderBy('startTimeET'),
          startAfter(this.gameLastVisible),
          limit(PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);
      console.log(`[LoadGames] Fetched ${snapshot.size} games.`);

      if (snapshot.empty) {
        console.log('[LoadGames] No more games.');
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more games to load.');
        return;
      }

      this.gameLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const gameId = doc.id;

        // Avoid duplicate game entries
        if (
          gameId &&
          !this.gameButtonsData.some(g => g.id === gameId)
        ) {
          this.gameButtonsData.push({
            id: gameId,
            display: this.formatGameDisplay(data),
            awayTeam: data.awayTeam,
            homeTeam: data.homeTeam,
            startTimeET: data.startTimeET,
          });
        }
      });

      // Sort ascending by startTimeET
      this.gameButtonsData.sort((a, b) => {
        // Convert Firestore Timestamp to JS Date if needed
        const aTime = a.startTimeET?.toDate ? a.startTimeET.toDate() : new Date(a.startTimeET);
        const bTime = b.startTimeET?.toDate ? b.startTimeET.toDate() : new Date(b.startTimeET);
        return aTime - bTime;
      });

      console.log(`[LoadGames] Total unique games loaded: ${this.gameButtonsData.length}`);

      this.renderButtons(
        this.gameButtonsData.map(g => g.display),
        'game'
      );

      if (snapshot.size === PAGE_LIMIT) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('[LoadGames] Error:', error);
      this.setStatus('Failed to load games.', true);
    }
  }

  // ########################################
  // Format Game Display Text  #formatGame
  // ########################################
  formatGameDisplay(game) {
    const awayTeam = game.awayTeam || '';
    const homeTeam = game.homeTeam || '';

    // Convert Firestore Timestamp or string to Date object
    const startTime = game.startTimeET instanceof Date
      ? game.startTimeET
      : (game.startTimeET?.toDate ? game.startTimeET.toDate() : new Date(game.startTimeET));
    if (!startTime) return `${awayTeam}\n@ ${homeTeam}\nDate TBD`;

    const now = new Date();
    const diffMs = startTime - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Format time part with AM/PM and EST if needed
    const estOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' };
    const localOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

    let timeLabel;
    let dayLabel = '';

    // Determine dayLabel and timeLabel format per your rules
    if (diffMs < 0) {
      dayLabel = 'Started';
      timeLabel = startTime.toLocaleTimeString('en-US', estOptions); // started shows EST
    } else if (diffDays === 0) {
      dayLabel = 'Today';
      timeLabel = startTime.toLocaleTimeString('en-US', estOptions); // today shows EST
    } else if (diffDays === 1) {
      dayLabel = 'Tomorrow';
      timeLabel = startTime.toLocaleTimeString('en-US', localOptions); // tomorrow no EST
    } else if (diffDays >= 2) {
      dayLabel = `${diffDays} Days Away`;
      timeLabel = startTime.toLocaleTimeString('en-US', localOptions); // days away no EST
    }

    return `${awayTeam}\n@ ${homeTeam}\n${dayLabel} @ ${timeLabel}`;
  }

  // ########################################
  // Team Buttons  #teams
  // ########################################
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
  async loadWagerTypes() {
    if (!this.selectedTeam) {
      this.setStatus('Please select a team first.', true);
      return;
    }

    console.log(`[LoadWagerTypes] Loading wager types for team: ${this.selectedTeam}`);
    this.step = 5;
    this.titleEl.textContent = `Select a Wager Type for ${this.selectedTeam}`;

    this.notesContainer.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';

    try {
      // Fetch global wagers (Sport == "All")
      const globalQuery = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', 'All'),
        limit(50)
      );
      const globalSnap = await getDocs(globalQuery);
      const globalWagers = globalSnap.docs.map(doc => doc.data());

      // Fetch sport-specific wagers for selected sport
      const sportQuery = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', this.selectedSport),
        limit(50)
      );
      const sportSnap = await getDocs(sportQuery);
      const sportWagers = sportSnap.docs.map(doc => doc.data());

      console.log(`[LoadWagerTypes] Global wagers: ${globalWagers.length}, Sport-specific wagers: ${sportWagers.length}`);

      this.renderWagerTypes(globalWagers, sportWagers);
    } catch (error) {
      console.error('[LoadWagerTypes] Error:', error);
      this.setStatus('Failed to load wager types.', true);
    }
  }

  renderWagerTypes(globalWagers, sportWagers) {
    this.buttonsWrapper.innerHTML = '';

    // Helper function to format wager label with new lines for parentheses or PLUS/MINUS/OVER/UNDER
    function formatWagerLabel(label) {
      if (!label) return 'Unnamed';
      // Put parentheses content on new line
      label = label.replace(/\(([^)]+)\)/, '\n($1)');
      // Put PLUS/MINUS/OVER/UNDER on new line (if preceded by space)
      label = label.replace(/\s(PLUS|MINUS|OVER|UNDER)/, '\n$1');
      return label;
    }

    // Render global wagers first
    if (globalWagers.length) {
      console.log(`[RenderWagerTypes] Rendering ${globalWagers.length} global wagers`);
      globalWagers.forEach(wager => {
        const btn = document.createElement('button');
        btn.textContent = formatWagerLabel(wager.wager_label_template || 'Unnamed');
        btn.classList.add('admin-button');
        btn.style.whiteSpace = 'pre-line'; // support multiline
        btn.addEventListener('click', () => {
          this.selectedWagerType = wager.wager_label_template || 'Unnamed';
          this.loadUnits();
        });
        this.buttonsWrapper.appendChild(btn);
      });
    }

    // Render sport-specific wagers next (no separator)
    if (sportWagers.length) {
      console.log(`[RenderWagerTypes] Rendering ${sportWagers.length} sport-specific wagers`);
      sportWagers.forEach(wager => {
        const btn = document.createElement('button');
        btn.textContent = formatWagerLabel(wager.wager_label_template || 'Unnamed');
        btn.classList.add('admin-button');
        btn.style.whiteSpace = 'pre-line';
        btn.addEventListener('click', () => {
          this.selectedWagerType = wager.wager_label_template || 'Unnamed';
          this.loadUnits();
        });
        this.buttonsWrapper.appendChild(btn);
      });
    }
  }

  // ########################################
  // Units Buttons  #units
  // ########################################
  async loadUnits() {
    if (!this.selectedWagerType) {
      this.setStatus('Please select a wager type first.', true);
      return;
    }

    console.log(`[LoadUnits] Loading units for wager: ${this.selectedWagerType}`);
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
      const units = snapshot.docs.map(doc => doc.data());

      console.log(`[LoadUnits] Loaded ${units.length} units`);

      // Format unit display with parentheses on newline if exists
      function formatUnitLabel(label) {
        if (!label) return 'Unnamed';
        return label.replace(/\(([^)]+)\)/, '\n($1)');
      }

      this.renderButtons(units.map(u => formatUnitLabel(u.display_unit)), 'unit');
    } catch (error) {
      console.error('[LoadUnits] Error:', error);
      this.setStatus('Failed to load units.', true);
    }
  }

  // ########################################
  // Phrases Buttons  #phrases
  // ########################################
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
      // 1. Fetch sport-specific active phrases (random order)
      const sportQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active'),
        where('Sport', '==', this.selectedSport)
      );
      const sportSnap = await getDocs(sportQuery);
      let sportPhrases = sportSnap.docs.map(doc => doc.data());

      // Shuffle function
      const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);

      sportPhrases = shuffleArray(sportPhrases);

      // 2. Fetch 'OG Cap' type phrases excluding sport-specific
      const ogCapQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active'),
        where('Type', '==', 'OG Cap')
      );
      const ogCapSnap = await getDocs(ogCapQuery);
      let ogCapPhrases = ogCapSnap.docs
        .map(doc => doc.data())
        .filter(p => !sportPhrases.some(sp => sp.Phrase === p.Phrase));
      ogCapPhrases = shuffleArray(ogCapPhrases);

      // 3. Fetch all other active phrases excluding above
      const allActiveQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active')
      );
      const allActiveSnap = await getDocs(allActiveQuery);
      let otherPhrases = allActiveSnap.docs
        .map(doc => doc.data())
        .filter(p => !sportPhrases.some(sp => sp.Phrase === p.Phrase) && !ogCapPhrases.some(oc => oc.Phrase === p.Phrase));
      otherPhrases = shuffleArray(otherPhrases);

      // Combine all phrase arrays
      const allPhrases = [...sportPhrases, ...ogCapPhrases, ...otherPhrases];

      // Pagination slice
      const startIndex = loadMore ? this.phraseButtonsData.length : 0;
      const phrasesToLoad = allPhrases.slice(startIndex, startIndex + PAGE_LIMIT);

      if (phrasesToLoad.length === 0) {
        console.log('[LoadPhrases] No more phrases.');
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more phrases to load.');
        return;
      }

      if (!loadMore) {
        this.phraseButtonsData = [];
      }
      this.phraseButtonsData.push(...phrasesToLoad);

      console.log(`[LoadPhrases] Loaded ${phrasesToLoad.length} phrases (total ${this.phraseButtonsData.length})`);

      this.renderButtons(this.phraseButtonsData.map(p => p.Phrase), 'phrase');

      if (startIndex + PAGE_LIMIT < allPhrases.length) {
        this.loadMoreBtn.style.display = 'inline-block';
      } else {
        this.loadMoreBtn.style.display = 'none';
      }

      this.setStatus('');
    } catch (error) {
      console.error('[LoadPhrases] Error:', error);
      this.setStatus('Failed to load phrases.', true);
    }
  }

  // ########################################
  // Button Rendering and Click Handling  #renderButtons
  // ########################################
  renderButtons(items, type) {
    console.log(`[RenderButtons] Rendering ${items.length} buttons for type: ${type}`);
    this.buttonsWrapper.innerHTML = '';

    items.forEach(label => {
      const btn = document.createElement('button');
      btn.classList.add('admin-button');

      if (type === 'game' || type === 'wagerType' || type === 'unit') {
        btn.style.whiteSpace = 'pre-line'; // support multiline for formatting
      }

      if (type === 'game') {
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

              // Show notes container now on phrase select step
              this.notesContainer.style.display = 'block';
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

      // Show success message with team, units and wager info
      this.setStatus(`Your ${this.selectedTeam} ${this.selectedUnit} ${this.selectedWagerType} Official Pick has been Successfully Saved.`);

      this.submitBtn.style.display = 'none';
      this.notesContainer.style.display = 'none';

      this.resetWorkflow();
    } catch (error) {
      console.error('[Submit] Error:', error);
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

  // ########################################
  // Load More Pagination Handler
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
}
