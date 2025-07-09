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

    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.phraseLastVisible = null;

    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.phraseButtonsData = [];

    this.selectedSport = null;
    this.selectedLeague = null;
    this.selectedGame = null;
    this.selectedTeam = null;
    this.selectedWagerType = null;
    this.selectedUnit = null;
    this.selectedPhrase = null;
    this.notes = '';
    this.wagerNumberValue = null;

    this.userAccessCode = '';
    this.userAccessType = '';
    this.userLoginCount = 0;
    this.userDisplayName = '';
    this.userName = 'unknown';
    this.userStartTime = new Date();

    this.sys_Unit100Ex = '';
    this.sys_UnitFractions = '';
    this.sys_UnitNoZero = null;
    this.sys_UnitPercent = '';
    this.sys_UnitRank = null;
    this.sys_UnitsValue = null;

    this.step = 1;

    this.renderInitialUI();
    this.loadSports();
  }

  addSpaceBeforeKeywords(label) {
    return label.replace(/(PLUS|MINUS|OVER|UNDER)/g, ' $1');
  }

  clearContainer() {
    this.container.innerHTML = '';
  }

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

    this.container.insertBefore(this.notesContainer, this.submitBtn);
  }

  setStatus(msg, isError = false) {
    this.statusMsg.textContent = msg;
    this.statusMsg.style.color = isError ? 'red' : 'inherit';
    console.log(`[Status] ${msg}`);
  }

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
      if (!loadMore || !this.sportLastVisible) {
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
          startAfter(this.sportLastVisible),
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

  async loadLeagues(loadMore = false) {
    if (!this.selectedSport) {
      this.setStatus('Please select a sport first.', true);
      return;
    }

    console.log(`[LoadLeagues] Loading leagues for sport: ${this.selectedSport}`);
    this.step = 2;
    this.titleEl.textContent = this.addSpaceBeforeKeywords(`Selected Sport: ${this.selectedSport} — Select a League`);
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

  async loadGames(loadMore = false) {
    if (!this.selectedLeague) {
      this.setStatus('Please select a league first.', true);
      return;
    }

    console.log(`[LoadGames] Loading games for league: ${this.selectedLeague}`);
    this.step = 3;
    this.titleEl.textContent = this.addSpaceBeforeKeywords(`Selected League: ${this.selectedLeague} — Select a Game`);
    this.setStatus(`Loading games for league ${this.selectedLeague}...`);
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    const now = new Date();
    const fiveHoursAgoDate = new Date(now.getTime() - 5 * 60 * 60 * 1000);

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

  async loadTeams() {
    if (!this.selectedGame) {
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

    console.log(`[LoadWagerTypes] Loading wager types for selected team: ${this.selectedTeam}`);
    this.step = 5;
    this.titleEl.textContent = this.addSpaceBeforeKeywords(`Select a Wager Type for ${this.selectedTeam}`);

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
        const label = btn.textContent;
        this.selectedWagerType = label;
        if (label.includes('[[NUM]]')) {
          this.showNumberInputModal(label).then((num) => {
            this.wagerNumberValue = num;
            this.loadUnits();
          });
        } else {
          this.wagerNumberValue = null;
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

  async loadUnits() {
    if (!this.selectedWagerType) {
      this.setStatus('Please select a wager type first.', true);
      return;
    }

    console.log(`[LoadUnits] Loading units for wager type: ${this.selectedWagerType}`);
    this.step = 6;
    this.titleEl.textContent = this.addSpaceBeforeKeywords(`Select Units for ${this.selectedWagerType}`);

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

      // Store sys unit info for submission
      if (units.length > 0) {
        this.sys_Unit100Ex = units[0].Unit100Ex || '';
        this.sys_UnitFractions = units[0].Fractions || '';
        this.sys_UnitNoZero = units[0].NoZero || null;
        this.sys_UnitPercent = units[0].Percent || '';
        this.sys_UnitRank = units[0].Rank || null;
        this.sys_UnitsValue = units[0].UnitsValue || null;
      }

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

  formatUnitLabel(label) {
    return label.replace(/\(([^)]+)\)/g, '<br>($1)');
  }

  async loadPhrases(loadMore = false) {
    if (!this.selectedUnit) {
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

      const sportSpecific = allPhrases.filter(p => p.Sport === this.selectedSport);
      const ogCapType = allPhrases.filter(p => p.Type === 'OG Cap' && p.Sport !== this.selectedSport);
      const others = allPhrases.filter(p => p.Sport !== this.selectedSport && p.Type !== 'OG Cap');

      const shuffle = (array) => array.sort(() => Math.random() - 0.5);

      const combined = [...shuffle(sportSpecific), ...shuffle(ogCapType), ...shuffle(others)];

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

  showNotesSection() {
    console.log('[Notes] Showing Notes/Comments section (optional)');
    this.step = 8;
    this.notesTextarea.value = this.notes || '';
    const remaining = 100 - this.notesTextarea.value.length;
    this.charCount.textContent = `${remaining} characters remaining`;
    this.notesContainer.style.display = 'block';
    this.submitBtn.style.display = 'inline-block';

    this.titleEl.textContent = this.addSpaceBeforeKeywords('Notes/Comments (Optional)');

    this.buttonsWrapper.innerHTML = '';
  }

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

  renderButtons(items, type) {
    console.log(`[RenderButtons] Rendering ${items.length} buttons for type: ${type}`);
    this.buttonsWrapper.innerHTML = '';

    items.forEach((label) => {
      const btn = document.createElement('button');
      btn.classList.add('admin-button');

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

  async onSubmit() {
    console.log('[Submit] Submit button clicked');

    // Notes can be empty but all other selections are mandatory
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

    if (this.selectedWagerType.includes('[[NUM]]') && (this.wagerNumberValue === null || this.wagerNumberValue === undefined)) {
      this.setStatus('Please enter a valid wager number.', true);
      return;
    }

    this.setStatus('Submitting your selection...');

    try {
      // Clean values for storage (strip HTML tags or line breaks where not wanted)
      const cleanUnitDisplay = this.selectedUnit.replace(/<br>/g, '').trim();
      const cleanGameDisplay = this.selectedGame.display.replace(/\n/g, ' ').trim();

      // Fix wager type spacing: Ensure a space before [[NUM]] and after keywords
      let wagerTypeClean = this.selectedWagerType.replace(/\[\[NUM\]\]/, ' [[NUM]]');
      wagerTypeClean = wagerTypeClean.replace(/(PLUS|MINUS|OVER|UNDER)(?=\S)/g, '$1 ');

      // Fix phrase: Use exact button text, no changes here
      const phraseClean = this.selectedPhrase;

      // Date/Time for sys_UserStartTime and EndTime in EST timezone (converted to ISO string)
      const now = new Date();
      const estOffset = 5 * 60 * 60 * 1000; // 5 hours
      const estNow = new Date(now.getTime() - estOffset);

      // Format time for post titles as h:mm AM/PM EST
      const formatPostTime = (date) =>
        date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        });

      // Prepare post title times
      const postTimeStr = formatPostTime(estNow);

      // Compose post titles using sys_UnitFractions and proper formatting
      const postTitle1 = `${this.sys_UnitFractions} - ${phraseClean} - ${this.selectedSport} - ${postTimeStr}`;
      const postTitle2 = `${this.sys_UnitFractions} - ${phraseClean} - ${this.selectedTeam} - ${postTimeStr}`;

      // Compose post descriptions - clean new lines in game display for saving
      const cleanGameDisplayDesc = cleanGameDisplay.replace(/\\n/g, ' ');

      const postDesc1 = `${phraseClean} - ${phraseClean} -`;
      const postDesc2 = `${phraseClean} - ${cleanGameDisplayDesc} - ${phraseClean} -`;

      await addDoc(collection(db, 'OfficialPicks'), {
        user_UserId: this.userId || 'anonymous',
        user_UserName: this.userName || 'unknown',
        user_UserDisplayName: this.userDisplayName || '',
        user_AccessCode: this.userAccessCode || '',
        user_AccessType: this.userAccessType || '',
        user_LoginCount: this.userLoginCount || 0,
        user_Sport: this.selectedSport,
        user_League: this.selectedLeague,
        user_GameDisplay: cleanGameDisplay,
        user_SelectedTeam: this.selectedTeam,
        user_WagerType: wagerTypeClean,
        user_WagerNum: this.wagerNumberValue,
        user_UnitDisplay: cleanUnitDisplay,
        user_Phrase: phraseClean,
        user_Notes: this.notes,

        sys_FinalWagerType: wagerTypeClean.replace(' [[NUM]]', this.wagerNumberValue !== null ? this.wagerNumberValue : ''),
        sys_GameAwayTeam: this.selectedGame.awayTeam,
        sys_GameHomeTeam: this.selectedGame.homeTeam,
        sys_GameId: this.selectedGame.id,
        sys_GameStatus: 'Pending',
        sys_PhraseEnergy: '',
        sys_PhrasePromo: '',
        sys_PhraseType: '',

        sys_PostDesc1: postDesc1,
        sys_PostDesc2: postDesc2,
        sys_PostTitle1: postTitle1,
        sys_PostTitle2: postTitle2,

        sys_SubmissionSuccess: true,

        sys_Unit100Ex: this.sys_Unit100Ex,
        sys_UnitFractions: this.sys_UnitFractions,
        sys_UnitNoZero: this.sys_UnitNoZero,
        sys_UnitPercent: this.sys_UnitPercent,
        sys_UnitRank: this.sys_UnitRank,
        sys_UnitsValue: this.sys_UnitsValue,

        sys_UserDisplayName: this.userDisplayName || '',
        sys_UserEndTime: Timestamp.fromDate(new Date()),
        sys_UserStartTime: Timestamp.fromDate(this.userStartTime || new Date()),
        sys_Username: this.userName || 'unknown',

        timestamp: Timestamp.now(),
      });

      console.log('[Submit] Submission successful');

      this.showSubmissionSummary();

    } catch (error) {
      console.error('[Submit] Error submitting:', error);
      this.setStatus('Failed to submit your selection.', true);
    }
  }

  showSubmissionSummary() {
    this.titleEl.textContent = this.addSpaceBeforeKeywords('Submission Summary');

    const wagerTypeFixed = this.addSpaceBeforeKeywords(this.selectedWagerType.replace('[[NUM]]', this.wagerNumberValue !== null ? this.wagerNumberValue : ''));

    const successMsg = `Your ${this.selectedTeam} ${this.selectedUnit.replace(/<br>/g, '')} ${wagerTypeFixed} Official Pick has been Successfully Saved.`;

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
      { label: 'Sport', value: this.selectedSport },
      { label: 'League', value: this.selectedLeague },
      { label: 'Game', value: `${this.selectedGame?.awayTeam} @ ${this.selectedGame?.homeTeam}` },
      { label: 'Team', value: this.selectedTeam },
      { label: 'Wager Type', value: wagerTypeFixed },
      { label: 'Unit', value: this.selectedUnit.replace(/<br>/g, '') },
      { label: 'Phrase', value: this.selectedPhrase },
      { label: 'Notes', value: this.notes || 'None' },
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

    this.titleEl.textContent = this.addSpaceBeforeKeywords('Please select a Sport');
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';
    this.setStatus('');

    this.loadSports();
  }

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
      submitBtn.style.borderRadius = '6px';
      submitBtn.style.cursor = 'pointer';
      submitBtn.style.fontFamily = "'Oswald', sans-serif";
      submitBtn.style.fontWeight = '700';
      submitBtn.style.fontSize = '1rem';
      content.appendChild(submitBtn);

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.backgroundColor = '#eee';
      cancelBtn.style.color = '#333';
      cancelBtn.style.border = 'none';
      cancelBtn.style.padding = '10px 22px';
      cancelBtn.style.borderRadius = '6px';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.style.marginLeft = '10px';
      cancelBtn.style.fontFamily = "'Oswald', sans-serif";
      cancelBtn.style.fontWeight = '700';
      cancelBtn.style.fontSize = '1rem';
      content.appendChild(cancelBtn);

      modal.appendChild(content);
      document.body.appendChild(modal);

      submitBtn.addEventListener('click', () => {
        const val = parseFloat(input.value);
        if (isNaN(val) || val <= 0) {
          alert('Please enter a valid positive number.');
          return;
        }
        document.body.removeChild(modal);
        resolve(val);
      });

      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(null);
      });
    });
  }
}

export default AddNewWorkflow;
