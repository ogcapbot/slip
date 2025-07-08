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
const PAGE_LIMIT_SPORTS = 100;

export class AddNewWorkflow {
  constructor(container, userId) {
    this.container = container;
    this.userId = userId;

    this.sys_sportLastVisible = null;
    this.sys_leagueLastVisible = null;
    this.sys_gameLastVisible = null;
    this.sys_phraseLastVisible = null;

    this.sys_sportButtonsData = [];
    this.sys_leagueButtonsData = [];
    this.sys_gameButtonsData = [];
    this.sys_phraseButtonsData = [];

    this.user_selectedSport = null;
    this.user_selectedLeague = null;
    this.user_selectedGame = null;
    this.user_selectedGameDisplay = null;
    this.user_selectedTeam = null;
    this.user_selectedWagerType = null;
    this.user_wagerNumberValue = null;
    this.user_selectedUnit = null;
    this.user_selectedPhrase = null;
    this.user_notes = '';

    this.step = 1;

    this.renderInitialUI();
    this.loadSports();
  }

  // ############################################################
  // #################### Initial UI Setup
  // ############################################################
  // Prepares the container with buttons, titles, status messages, etc.
  renderInitialUI() {
    console.log('[Init] Rendering initial UI');
    this.clearContainer();

    this.titleEl = document.createElement('h5');
    this.titleEl.id = 'workflowTitle';
    this.container.appendChild(this.titleEl);

    this.buttonsWrapper = document.createElement('div');
    this.buttonsWrapper.id = 'buttonsWrapper';
    this.buttonsWrapper.style.display = 'grid';
    this.buttonsWrapper.style.gridTemplateColumns = 'repeat(3, 1fr)';
    this.buttonsWrapper.style.gap = '8px';
    this.container.appendChild(this.buttonsWrapper);

    this.loadMoreBtn = document.createElement('button');
    this.loadMoreBtn.textContent = 'Load More';
    this.loadMoreBtn.classList.add('admin-button');
    this.loadMoreBtn.style.marginTop = '12px';
    this.loadMoreBtn.style.display = 'none';
    this.loadMoreBtn.addEventListener('click', () => this.onLoadMore());
    this.container.appendChild(this.loadMoreBtn);

    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = 'Submit';
    this.submitBtn.classList.add('admin-button');
    this.submitBtn.style.marginTop = '20px';
    this.submitBtn.style.display = 'none';
    this.submitBtn.addEventListener('click', () => this.onSubmit());
    this.container.appendChild(this.submitBtn);

    this.statusMsg = document.createElement('p');
    this.statusMsg.style.marginTop = '16px';
    this.container.appendChild(this.statusMsg);

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
      this.user_notes = this.notesTextarea.value;
      console.log(`[Notes] User typed notes: ${this.user_notes}`);
    });
    this.notesContainer.appendChild(this.notesTextarea);

    this.charCount = document.createElement('div');
    this.charCount.style.fontSize = '0.8em';
    this.charCount.style.color = '#555';
    this.charCount.textContent = '100 characters remaining';
    this.notesContainer.appendChild(this.charCount);

    this.container.appendChild(this.notesContainer);
    this.container.insertBefore(this.notesContainer, this.submitBtn);
  }

  clearContainer() {
    this.container.innerHTML = '';
  }

  setStatus(msg, isError = false) {
    this.statusMsg.textContent = msg;
    this.statusMsg.style.color = isError ? 'red' : 'inherit';
    console.log(`[Status] ${msg}`);
  }

  addSpaceBeforeKeywords(label) {
    return label.replace(/(PLUS|MINUS|OVER|UNDER)/g, ' $1');
  }

  // ############################################################
  // #################### Load Sports Section
  // ############################################################
  async loadSports(loadMore = false) {
    console.log('[LoadSports] Loading sports...');
    this.step = 1;
    this.titleEl.textContent = this.addSpaceBeforeKeywords('Please select a Sport');
    this.setStatus('Loading sports...');
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    try {
      let q;
      if (!loadMore || !this.sys_sportLastVisible) {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          orderBy('group'),
          limit(PAGE_LIMIT_SPORTS)
        );
      } else {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          orderBy('group'),
          startAfter(this.sys_sportLastVisible),
          limit(PAGE_LIMIT_SPORTS)
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

      this.sys_sportLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.group && !this.sys_sportButtonsData.includes(data.group)) {
          this.sys_sportButtonsData.push(data.group);
        }
      });

      this.sys_sportButtonsData.sort();

      console.log(`[LoadSports] Total unique sports loaded: ${this.sys_sportButtonsData.length}`);

      this.renderButtons(this.sys_sportButtonsData, 'sport');

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

  // ############################################################
  // #################### Load Leagues Section
  // ############################################################
  async loadLeagues(loadMore = false) {
    if (!this.user_selectedSport) {
      this.setStatus('Please select a sport first.', true);
      return;
    }

    console.log(`[LoadLeagues] Loading leagues for sport: ${this.user_selectedSport}`);
    this.step = 2;
    this.titleEl.textContent = this.addSpaceBeforeKeywords(`Selected Sport: ${this.user_selectedSport} — Select a League`);
    this.setStatus(`Loading leagues for ${this.user_selectedSport}...`);
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    try {
      let q;
      if (!loadMore || !this.sys_leagueLastVisible) {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          where('group', '==', this.user_selectedSport),
          orderBy('title'),
          limit(PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          where('group', '==', this.user_selectedSport),
          orderBy('title'),
          startAfter(this.sys_leagueLastVisible),
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

      this.sys_leagueLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.title && !this.sys_leagueButtonsData.includes(data.title)) {
          this.sys_leagueButtonsData.push(data.title);
        }
      });

      this.sys_leagueButtonsData.sort();

      console.log(`[LoadLeagues] Total unique leagues loaded: ${this.sys_leagueButtonsData.length}`);

      this.renderButtons(this.sys_leagueButtonsData, 'league');

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

  // ############################################################
  // #################### Load Games Section
  // ############################################################
  async loadGames(loadMore = false) {
    if (!this.user_selectedLeague) {
      this.setStatus('Please select a league first.', true);
      return;
    }

    console.log(`[LoadGames] Loading games for league: ${this.user_selectedLeague}`);
    this.step = 3;
    this.titleEl.textContent = this.addSpaceBeforeKeywords(`Selected League: ${this.user_selectedLeague} — Select a Game`);
    this.setStatus(`Loading games for league ${this.user_selectedLeague}...`);
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    const now = new Date();
    const fiveHoursAgoDate = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const pad = (num) => (num < 10 ? '0' + num : num);
    const cutoffString = `${fiveHoursAgoDate.getFullYear()}-${pad(fiveHoursAgoDate.getMonth() + 1)}-${pad(fiveHoursAgoDate.getDate())} ${pad(fiveHoursAgoDate.getHours())}:${pad(fiveHoursAgoDate.getMinutes())}:${pad(fiveHoursAgoDate.getSeconds())}`;

    try {
      let q;
      if (!loadMore || !this.sys_gameLastVisible) {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.user_selectedLeague),
          where('startTimeET', '>=', cutoffString),
          orderBy('startTimeET'),
          limit(PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'GameEventsData'),
          where('leagueShortname', '==', this.user_selectedLeague),
          where('startTimeET', '>=', cutoffString),
          orderBy('startTimeET'),
          startAfter(this.sys_gameLastVisible),
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

      this.sys_gameLastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const gameId = doc.id;
        if (!this.sys_gameButtonsData.some((g) => g.id === gameId)) {
          this.sys_gameButtonsData.push({
            id: gameId,
            display: this.formatGameDisplay(data),
            awayTeam: data.awayTeam,
            homeTeam: data.homeTeam,
            startTimeET: data.startTimeET,
          });
        }
      });

      this.sys_gameButtonsData.sort((a, b) => a.startTimeET.localeCompare(b.startTimeET));

      console.log(`[LoadGames] Total unique games loaded: ${this.sys_gameButtonsData.length}`);

      this.renderButtons(
        this.sys_gameButtonsData.map((g) => g.display),
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

  formatGameDisplay(game) {
    const awayTeam = game.awayTeam || '';
    const homeTeam = game.homeTeam || '';

    const parts = game.startTimeET.split(/[- :]/);
    const startTime = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);

    const now = new Date();
    const diffMs = startTime - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

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
      timeLabel = formatESTTime(startTime);
      dateLabel = `Started @ ${timeLabel}`;
    } else if (diffDays === 0) {
      timeLabel = formatESTTime(startTime);
      dateLabel = `Today @ ${timeLabel}`;
    } else if (diffDays === 1) {
      timeLabel = formatLocalTime(startTime);
      dateLabel = `Tomorrow @ ${timeLabel}`;
    } else if (diffDays >= 2) {
      timeLabel = formatLocalTime(startTime);
      dateLabel = `${diffDays} Days Away @ ${timeLabel}`;
    } else {
      dateLabel = startTime.toLocaleDateString();
    }

    return `${awayTeam}\n@ ${homeTeam}\n${dateLabel}`;
  }

  // ############################################################
  // #################### Load Teams Section
  // ############################################################
  async loadTeams() {
    if (!this.user_selectedGame) {
      this.setStatus('Please select a game first.', true);
      return;
    }

    console.log('[LoadTeams] Loading team buttons');
    this.step = 4;
    this.titleEl.textContent = this.addSpaceBeforeKeywords('Select a Team');

    this.notesContainer.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';

    const teams = [
      this.user_selectedGame.awayTeam || 'Away Team',
      this.user_selectedGame.homeTeam || 'Home Team',
    ];

    this.renderButtons(teams, 'team');
  }

  // ############################################################
  // #################### Load Wager Types Section
  // ############################################################
  async loadWagerTypes() {
    if (!this.user_selectedTeam) {
      this.setStatus('Please select a team first.', true);
      return;
    }

    console.log(`[LoadWagerTypes] Loading wager types for selected team: ${this.user_selectedTeam}`);
    this.step = 5;
    this.titleEl.textContent = this.addSpaceBeforeKeywords(`Select a Wager Type for ${this.user_selectedTeam}`);

    this.notesContainer.style.display = 'none';
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';

    try {
      const globalQuery = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', 'All'),
        limit(50)
      );
      const globalSnap = await getDocs(globalQuery);
      const globalWagers = globalSnap.docs.map((doc) => doc.data());

      const sportQuery = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', this.user_selectedSport),
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

    if (globalWagers.length) {
      console.log(`[RenderWagerTypes] Rendering ${globalWagers.length} global wager buttons`);
      globalWagers.forEach((wager) => {
        const btn = document.createElement('button');
        btn.classList.add('admin-button');

        btn.innerHTML = this.formatWagerLabel(wager.wager_label_template || wager.WagerType || 'Unnamed');

        this.buttonsWrapper.appendChild(btn);
      });
    }

    if (sportWagers.length) {
      console.log(`[RenderWagerTypes] Rendering ${sportWagers.length} sport-specific wager buttons`);
      sportWagers.forEach((wager) => {
        const btn = document.createElement('button');
        btn.classList.add('admin-button');

        btn.innerHTML = this.formatWagerLabel(wager.wager_label_template || wager.WagerType || 'Unnamed');

        this.buttonsWrapper.appendChild(btn);
      });
    }

    Array.from(this.buttonsWrapper.children).forEach((btn) => {
      btn.addEventListener('click', () => {
        const label = btn.textContent; // TEXT ONLY, no <br> here!
        this.user_selectedWagerType = label;
        if (label.includes('[[NUM]]')) {
          this.showNumberInputModal(label).then((num) => {
            this.user_wagerNumberValue = num;
            this.loadUnits();
          });
        } else {
          this.user_wagerNumberValue = null;
          this.loadUnits();
        }
      });
    });
  }

  formatWagerLabel(label) {
    let formatted = label.replace(/\(([^)]+)\)/g, '<br>($1)');
    formatted = formatted.replace(/ (\bPLUS\b|\bMINUS\b|\bOVER\b|\bUNDER\b)/g, '<br>$1');
    return formatted;
  }

  // ############################################################
  // #################### Load Units Section
  // ############################################################
  async loadUnits() {
    if (!this.user_selectedWagerType) {
      this.setStatus('Please select a wager type first.', true);
      return;
    }

    console.log(`[LoadUnits] Loading units for wager type: ${this.user_selectedWagerType}`);
    this.step = 6;
    this.titleEl.textContent = this.addSpaceBeforeKeywords(`Select Units for ${this.user_selectedWagerType}`);

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

      // Store original display_unit for storage; format for display with <br> only on buttons
      this.renderButtons(
        units.map((u) => ({
          displayUnitRaw: u.display_unit, // raw text for storing
          displayUnitFormatted: this.formatUnitLabel(u.display_unit), // for display only
          sys_data: u, // save the entire unit object for possible sys fields if needed
        })),
        'unit'
      );
    } catch (error) {
      console.error('[LoadUnits] Error loading units:', error);
      this.setStatus('Failed to load units.', true);
    }
  }

  formatUnitLabel(label) {
    return label.replace(/\(([^)]+)\)/g, '<br>($1)');
  }

  // Overriding renderButtons to handle complex unit objects for 'unit' type
  renderButtons(items, type) {
    console.log(`[RenderButtons] Rendering ${items.length} buttons for type: ${type}`);
    this.buttonsWrapper.innerHTML = '';

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.classList.add('admin-button');

      let labelText = '';
      if (type === 'unit') {
        // item is an object with displayUnitRaw and displayUnitFormatted
        labelText = item.displayUnitRaw; // store plain text label separately
        btn.style.whiteSpace = 'pre-line';
        btn.innerHTML = item.displayUnitFormatted;
      } else if (type === 'game') {
        btn.style.whiteSpace = 'pre-line';
        btn.innerHTML = item.replace(/\n/g, '<br>');
        labelText = btn.textContent;
      } else {
        labelText = typeof item === 'string' ? item : item.toString();
        btn.textContent = labelText;
      }

      btn.addEventListener('click', () => {
        console.log(`[ButtonClick] Type: ${type}, Label: ${labelText}`);

        switch (type) {
          case 'sport':
            if (this.user_selectedSport !== labelText) {
              console.log(`[Selection] Sport selected: ${labelText}`);
              this.user_selectedSport = labelText;
              this.user_selectedLeague = null;
              this.sys_leagueButtonsData = [];
              this.sys_leagueLastVisible = null;
              this.step = 2;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadLeagues();
            }
            break;
          case 'league':
            if (this.user_selectedLeague !== labelText) {
              console.log(`[Selection] League selected: ${labelText}`);
              this.user_selectedLeague = labelText;
              this.user_selectedGame = null;
              this.sys_gameButtonsData = [];
              this.sys_gameLastVisible = null;
              this.step = 3;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadGames();
            }
            break;
          case 'game':
            if (this.user_selectedGameDisplay !== labelText) {
              this.user_selectedGame = this.sys_gameButtonsData.find(g => g.display === labelText);
              this.user_selectedGameDisplay = labelText;
              console.log(`[Selection] Game selected: ${this.user_selectedGame.id}`);
              this.step = 4;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadTeams();
            }
            break;
          case 'team':
            if (this.user_selectedTeam !== labelText) {
              console.log(`[Selection] Team selected: ${labelText}`);
              this.user_selectedTeam = labelText;
              this.step = 5;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'none';
              this.loadWagerTypes();
            }
            break;
          case 'unit':
            if (this.user_selectedUnit !== labelText) {
              console.log(`[Selection] Unit selected: ${labelText}`);
              this.user_selectedUnit = labelText;
              this.step = 7;
              this.loadMoreBtn.style.display = 'inline-block';
              this.submitBtn.style.display = 'none';
              this.loadPhrases();
            }
            break;
          case 'phrase':
            if (this.user_selectedPhrase !== labelText) {
              console.log(`[Selection] Phrase selected: ${labelText}`);
              this.user_selectedPhrase = labelText;
              this.step = 8;
              this.loadMoreBtn.style.display = 'none';
              this.submitBtn.style.display = 'inline-block';
              this.showNotesSection();
            }
            break;
          default:
            console.log(`[Selection] Unhandled button type: ${type}`);
        }
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  // ############################################################
  // #################### Load Phrases Section
  // ############################################################
  async loadPhrases(loadMore = false) {
    if (!this.user_selectedUnit) {
      this.setStatus('Please select units first.', true);
      return;
    }

    console.log('[LoadPhrases] Loading phrases...');
    this.step = 7;
    this.titleEl.textContent = this.addSpaceBeforeKeywords('Select a Phrase');
    this.notesContainer.style.display = 'none';
    this.submitBtn.style.display = 'none';

    try {
      const phrasesQuery = query(
        collection(db, 'HypePhrases'),
        where('active_status', '==', 'active')
      );
      const phrasesSnap = await getDocs(phrasesQuery);
      const allPhrases = phrasesSnap.docs.map((doc) => doc.data());

      const sportSpecific = allPhrases.filter(p => p.Sport === this.user_selectedSport);
      const ogCapType = allPhrases.filter(p => p.Type === 'OG Cap' && p.Sport !== this.user_selectedSport);
      const others = allPhrases.filter(p => p.Sport !== this.user_selectedSport && p.Type !== 'OG Cap');

      const shuffle = (array) => array.sort(() => Math.random() - 0.5);

      const combined = [...shuffle(sportSpecific), ...shuffle(ogCapType), ...shuffle(others)];

      const startIndex = loadMore ? this.sys_phraseButtonsData.length : 0;
      const phrasesToLoad = combined.slice(startIndex, startIndex + PAGE_LIMIT);

      if (phrasesToLoad.length === 0) {
        console.log('[LoadPhrases] No more phrases to load.');
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more phrases to load.');
        return;
      }

      if (!loadMore) {
        this.sys_phraseButtonsData = [];
      }
      this.sys_phraseButtonsData.push(...phrasesToLoad.map(p => p.Phrase));

      console.log(`[LoadPhrases] Loaded ${phrasesToLoad.length} phrases (total loaded: ${this.sys_phraseButtonsData.length})`);

      this.renderButtons(this.sys_phraseButtonsData, 'phrase');

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

  // ############################################################
  // #################### Notes Section
  // ############################################################
  showNotesSection() {
    console.log('[Notes] Showing Notes/Comments section (optional)');
    this.step = 8;
    this.notesTextarea.value = this.user_notes || '';
    const remaining = 100 - this.notesTextarea.value.length;
    this.charCount.textContent = `${remaining} characters remaining`;
    this.notesContainer.style.display = 'block';
    this.submitBtn.style.display = 'inline-block';

    this.titleEl.textContent = this.addSpaceBeforeKeywords('Notes/Comments (Optional)');
    this.buttonsWrapper.innerHTML = '';
  }

  // ############################################################
  // #################### Load More Button Handler
  // ############################################################
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

  // ############################################################
  // #################### Submit Button Handler
  // ############################################################
  async onSubmit() {
    console.log('[Submit] Submit button clicked');

    if (
      !this.user_selectedSport ||
      !this.user_selectedLeague ||
      !this.user_selectedGame ||
      !this.user_selectedTeam ||
      !this.user_selectedWagerType ||
      !this.user_selectedUnit ||
      !this.user_selectedPhrase
    ) {
      this.setStatus('Please complete all steps before submitting.', true);
      return;
    }

    if (this.user_selectedWagerType.includes('[[NUM]]') && (this.user_wagerNumberValue === null || this.user_wagerNumberValue === undefined)) {
      this.setStatus('Please enter a valid wager number.', true);
      return;
    }

    this.setStatus('Submitting your selection...');

    // Generate system wager type with replaced [[NUM]] and [[TEAM]]
    let sys_wagerTypeReplaced = this.user_selectedWagerType;
    if (this.user_wagerNumberValue !== null) {
      sys_wagerTypeReplaced = sys_wagerTypeReplaced.replace('[[NUM]]', this.user_wagerNumberValue);
    }
    if (this.user_selectedTeam) {
      sys_wagerTypeReplaced = sys_wagerTypeReplaced.replace('[[TEAM]]', this.user_selectedTeam);
    }

    try {
      await addDoc(collection(db, 'OfficialPicks'), {
        user_UserId: this.userId,
        user_Sport: this.user_selectedSport,
        user_League: this.user_selectedLeague,
        user_GameId: this.user_selectedGame.id,
        user_GameDisplay: this.user_selectedGameDisplay,
        user_AwayTeam: this.user_selectedGame.awayTeam,
        user_HomeTeam: this.user_selectedGame.homeTeam,
        user_TeamSelected: this.user_selectedTeam,
        user_WagerType: this.user_selectedWagerType,
        user_WagerNumber: this.user_wagerNumberValue,
        sys_WagerType: sys_wagerTypeReplaced,
        user_Unit: this.user_selectedUnit,
        user_Phrase: this.user_selectedPhrase,
        user_Notes: this.user_notes,
        timestamp: Timestamp.now(),
      });

      console.log('[Submit] Submission successful');

      this.showSubmissionSummary();

    } catch (error) {
      console.error('[Submit] Error submitting:', error);
      this.setStatus('Failed to submit your selection.', true);
    }
  }

  // ############################################################
  // #################### Submission Summary Display
  // ############################################################
  showSubmissionSummary() {
    this.titleEl.textContent = this.addSpaceBeforeKeywords('Submission Summary');

    const wagerTypeFixed = this.addSpaceBeforeKeywords(
      this.user_selectedWagerType.replace('[[NUM]]', this.user_wagerNumberValue !== null ? this.user_wagerNumberValue : '')
    );

    const successMsg = `Your ${this.user_selectedTeam} ${this.user_selectedUnit} ${wagerTypeFixed} Official Pick has been Successfully Saved.`;

    this.buttonsWrapper.innerHTML = '';
    this.notesContainer.style.display = 'none';
    this.submitBtn.style.display = 'none';

    this.statusMsg.textContent = successMsg;
    this.statusMsg.style.color = 'inherit';
    this.statusMsg.style.textAlign = 'left';

    const summaryDiv = document.createElement('div');
    summaryDiv.style.marginTop = '12px';
    summaryDiv.style.fontWeight = 'bold';
    summaryDiv.style.textAlign = 'left';

    const fields = [
      { label: 'Sport', value: this.user_selectedSport },
      { label: 'League', value: this.user_selectedLeague },
      { label: 'Game', value: this.user_selectedGameDisplay },
      { label: 'Team', value: this.user_selectedTeam },
      { label: 'Wager Type', value: wagerTypeFixed },
      { label: 'Unit', value: this.user_selectedUnit },
      { label: 'Phrase', value: this.user_selectedPhrase },
      { label: 'Notes', value: this.user_notes || 'None' },
    ];

    fields.forEach(({ label, value }) => {
      const p = document.createElement('p');
      p.style.margin = '4px 0';
      p.textContent = `${label}: ${value}`;
      summaryDiv.appendChild(p);
    });

    if (this.statusMsg.nextSibling) {
      this.container.insertBefore(summaryDiv, this.statusMsg.nextSibling);
    } else {
      this.container.appendChild(summaryDiv);
    }
  }

  resetWorkflow() {
    console.log('[Reset] Resetting workflow for new submission');
    this.step = 1;
    this.user_selectedSport = null;
    this.user_selectedLeague = null;
    this.user_selectedGame = null;
    this.user_selectedGameDisplay = null;
    this.user_selectedTeam = null;
    this.user_selectedWagerType = null;
    this.user_wagerNumberValue = null;
    this.user_selectedUnit = null;
    this.user_selectedPhrase = null;
    this.user_notes = '';

    this.sys_sportLastVisible = null;
    this.sys_leagueLastVisible = null;
    this.sys_gameLastVisible = null;
    this.sys_phraseLastVisible = null;

    this.sys_sportButtonsData = [];
    this.sys_leagueButtonsData = [];
    this.sys_gameButtonsData = [];
    this.sys_phraseButtonsData = [];

    this.titleEl.textContent = this.addSpaceBeforeKeywords('Please select a Sport');
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';
    this.setStatus('');

    this.loadSports();
  }

  // ############################################################
  // #################### Number Input Modal
  // ############################################################
  showNumberInputModal(wagerLabel) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.id = 'numberModal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '1000';

      const content = document.createElement('div');
      content.style.backgroundColor = '#fff';
      content.style.padding = '20px 15px';
      content.style.borderRadius = '10px';
      content.style.boxShadow = '0 2px 15px rgba(0,0,0,0.25)';
      content.style.textAlign = 'center';
      content.style.width = '280px';
      content.style.maxWidth = '90vw';
      content.style.boxSizing = 'border-box';

      content.style.alignSelf = 'center';
      content.style.flexShrink = '0';

      const title = document.createElement('h3');
      title.textContent = `Enter Number for: ${this.addSpaceBeforeKeywords(wagerLabel)}`;
      title.style.marginBottom = '15px';
      title.style.fontFamily = "'Oswald', sans-serif";
      title.style.fontWeight = '700';
      title.style.fontSize = '1.25rem';
      title.style.wordBreak = 'break-word';
      content.appendChild(title);

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = '0.5';
      input.placeholder = 'e.g. 1, 1.5, 2';
      input.style.fontSize = '1rem';
      input.style.padding = '6px 8px';
      input.style.marginBottom = '18px';
      input.style.border = '1px solid #ccc';
      input.style.borderRadius = '6px';
      input.style.fontFamily = "'Oswald', sans-serif";
      content.appendChild(input);

      const submitBtn = document.createElement('button');
      submitBtn.textContent = 'Submit';
      submitBtn.style.backgroundColor = '#3a8bfd';
      submitBtn.style.color = 'white';
      submitBtn.style.border = 'none';
      submitBtn.style.padding = '10px 22px';
      submitBtn.style.borderRadius = '7px';
      submitBtn.style.cursor = 'pointer';
      submitBtn.style.fontFamily = "'Oswald', sans-serif";
      submitBtn.style.fontWeight = '700';
      submitBtn.style.fontSize = '1rem';
      content.appendChild(submitBtn);

      modal.appendChild(content);
      document.body.appendChild(modal);

      input.focus();

      function isValidNumber(value) {
        const num = parseFloat(value);
        return (
          !isNaN(num) &&
          num >= 0 &&
          Number.isInteger(num * 2)
        );
      }

      submitBtn.addEventListener('click', () => {
        if (isValidNumber(input.value.trim())) {
          const numValue = parseFloat(input.value.trim());
          document.body.removeChild(modal);
          resolve(numValue);
        } else {
          alert('Please enter a valid positive whole or half number (e.g., 0.5, 1, 1.5)');
          input.focus();
        }
      });
    });
  }
}
