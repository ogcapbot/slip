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

    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.wagerLastVisible = null;
    this.unitLastVisible = null;
    this.phraseLastVisible = null;

    this.PAGE_LIMIT = 200;

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

  clearContainer() {
    this.container.innerHTML = '';
  }

  renderInitialUI() {
    this.clearContainer();

    // Title
    this.title = document.createElement('h2');
    this.title.id = 'workflowTitle';
    this.container.appendChild(this.title);

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

    // Notes textarea (hidden initially)
    this.notesContainer = document.createElement('div');
    this.notesContainer.style.marginTop = '16px';
    this.notesContainer.style.display = 'none';
    this.container.appendChild(this.notesContainer);

    this.renderStatusAndTitle();
  }

  renderStatusAndTitle() {
    switch (this.step) {
      case 1:
        this.title.textContent = 'Please select a Sport';
        break;
      case 2:
        this.title.textContent = `Selected Sport: ${this.selectedSport} — Select a League`;
        break;
      case 3:
        this.title.textContent = `Selected League: ${this.selectedLeague} — Select a Game`;
        break;
      case 4:
        this.title.textContent = `Selected Game: ${this.selectedGame.awayTeam} @ ${this.selectedGame.homeTeam} — Select a Team`;
        break;
      case 5:
        this.title.textContent = `Selected Team: ${this.selectedTeam} — Select a Wager Type`;
        break;
      case 6:
        this.title.textContent = `Selected Wager Type: ${this.selectedWagerType} — Select a Unit`;
        break;
      case 7:
        this.title.textContent = `Selected Unit: ${this.selectedUnit} — Select a Phrase`;
        break;
      case 8:
        this.title.textContent = `Selected Phrase: ${this.selectedPhrase} — Notes?`;
        break;
      default:
        this.title.textContent = '';
    }
  }

  setStatus(message, isError = false) {
    this.statusMsg.textContent = message;
    this.statusMsg.style.color = isError ? 'red' : 'inherit';
  }

  async loadSports(loadMore = false) {
    this.setStatus('Loading sports...');
    try {
      const sportsRef = collection(db, 'SportsData');
      let q;

      if (!loadMore || !this.sportLastVisible) {
        q = query(
          sportsRef,
          where('active', '==', true),
          orderBy('group'),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          sportsRef,
          where('active', '==', true),
          orderBy('group'),
          startAfter(this.sportLastVisible),
          limit(this.PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more sports to load.');
        return;
      }

      this.sportLastVisible = snapshot.docs[snapshot.docs.length - 1];

      const newSports = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.group && !this.sportButtonsData.includes(data.group)) {
          newSports.push(data.group);
        }
      });

      this.sportButtonsData.push(...newSports);
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
    this.setStatus(`Loading leagues for ${this.selectedSport}...`);
    try {
      const sportsRef = collection(db, 'SportsData');
      let q;

      if (!loadMore || !this.leagueLastVisible) {
        q = query(
          sportsRef,
          where('group', '==', this.selectedSport),
          where('active', '==', true),
          orderBy('title'),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          sportsRef,
          where('group', '==', this.selectedSport),
          where('active', '==', true),
          orderBy('title'),
          startAfter(this.leagueLastVisible),
          limit(this.PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more leagues to load.');
        return;
      }

      this.leagueLastVisible = snapshot.docs[snapshot.docs.length - 1];

      const newLeagues = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.title && !this.leagueButtonsData.includes(data.title)) {
          newLeagues.push(data.title);
        }
      });

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
    this.setStatus(`Loading games for ${this.selectedLeague}...`);
    try {
      const gamesRef = collection(db, 'GameEventsData');
      let q;

      if (!loadMore || !this.gameLastVisible) {
        q = query(
          gamesRef,
          where('leagueShortname', '==', this.selectedLeague),
          orderBy('startTimeUTC'),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          gamesRef,
          where('leagueShortname', '==', this.selectedLeague),
          orderBy('startTimeUTC'),
          startAfter(this.gameLastVisible),
          limit(this.PAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more games to load.');
        return;
      }

      this.gameLastVisible = snapshot.docs[snapshot.docs.length - 1];

      const newGames = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Store the full data object for rendering and selection
        newGames.push({
          id: doc.id,
          awayTeam: data.awayTeam,
          homeTeam: data.homeTeam,
          startTimeUTC: data.startTimeUTC,
          startTimeET: data.startTimeET,
        });
      });

      this.gameButtonsData.push(...newGames);
      // Remove duplicates by id
      const uniqueGames = [...new Map(this.gameButtonsData.map(g => [g.id, g])).values()];
      this.gameButtonsData = uniqueGames.sort(
        (a, b) => new Date(a.startTimeUTC) - new Date(b.startTimeUTC)
      );

      this.renderGameButtons(this.gameButtonsData);

      this.loadMoreBtn.style.display =
        snapshot.docs.length === this.PAGE_LIMIT ? 'inline-block' : 'none';

      this.setStatus('');
    } catch (error) {
      console.error('Error loading games:', error);
      this.setStatus('Failed to load games.', true);
    }
  }

  renderButtons(buttons, type) {
    this.buttonsWrapper.innerHTML = '';

    buttons.forEach(label => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.classList.add('admin-button');

      if (
        (type === 'sport' && this.selectedSport === label) ||
        (type === 'league' && this.selectedLeague === label) ||
        (type === 'wagerType' && this.selectedWagerType === label) ||
        (type === 'unit' && this.selectedUnit === label) ||
        (type === 'phrase' && this.selectedPhrase === label)
      ) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        this.onButtonClick(type, label);
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  renderGameButtons(games) {
    this.buttonsWrapper.innerHTML = '';

    games.forEach(game => {
      const btn = document.createElement('button');
      btn.classList.add('admin-button');

      // Format display with line breaks
      btn.innerHTML = `
        <div style="text-align:left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${game.awayTeam}
        </div>
        <div style="text-align:center; white-space: nowrap;">
          @ ${game.homeTeam}
        </div>
        <div style="text-align:center; font-style: italic; font-size: smaller; white-space: nowrap;">
          ${this.formatGameTime(game.startTimeUTC)}
        </div>
      `;

      btn.addEventListener('click', () => {
        this.selectedGame = game;
        this.step = 4;
        this.selectedTeam = null;
        this.renderStatusAndTitle();
        this.loadMoreBtn.style.display = 'none';
        this.submitBtn.style.display = 'none';
        this.renderTeamButtons();
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  formatGameTime(startTimeUTC) {
    const now = new Date();
    const gameDate = new Date(startTimeUTC);

    const diffMs = gameDate - now;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    // Convert to EST for display
    const estOptions = { timeZone: 'America/New_York', hour12: true, hour: 'numeric', minute: '2-digit' };
    const timeLabel = gameDate.toLocaleTimeString('en-US', estOptions);

    if (diffMinutes < 0) {
      return `Game Started @ ${timeLabel} EST`;
    } else if (diffMinutes <= 15) {
      return `Game Starting Soon @ ${timeLabel} EST`;
    } else if (diffMinutes <= 60) {
      return `Game Starts @ ${timeLabel} EST`;
    } else if (diffHours < 2) {
      return `Today ${timeLabel} EST`;
    } else if (diffHours < 24) {
      return `Tomorrow ${timeLabel} EST`;
    } else {
      // For 2+ days away, show full date + time
      const options = {
        timeZone: 'America/New_York',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      };
      return gameDate.toLocaleString('en-US', options) + ' EST';
    }
  }

  renderTeamButtons() {
    this.buttonsWrapper.innerHTML = '';

    ['awayTeam', 'homeTeam'].forEach(teamType => {
      const teamName = this.selectedGame[teamType];
      if (!teamName) return;

      const btn = document.createElement('button');
      btn.classList.add('admin-button');
      btn.textContent = teamName;

      if (this.selectedTeam === teamName) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        this.selectedTeam = teamName;
        this.step = 5;
        this.selectedWagerType = null;
        this.renderStatusAndTitle();
        this.loadMoreBtn.style.display = 'none';
        this.submitBtn.style.display = 'none';
        this.loadWagerTypes();
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  async loadWagerTypes(loadMore = false) {
    if (!this.selectedTeam) {
      this.setStatus('Please select a team first.', true);
      return;
    }
    this.setStatus(`Loading wager types for ${this.selectedSport}...`);
    try {
      const wagerRef = collection(db, 'WagerTypes');
      let qGlobal, qSport;

      qGlobal = query(
        wagerRef,
        where('Sport', '==', 'All'),
        orderBy('Rank'),
        limit(this.PAGE_LIMIT)
      );

      qSport = query(
        wagerRef,
        where('Sport', '==', this.selectedSport),
        orderBy('Rank'),
        limit(this.PAGE_LIMIT)
      );

      const [globalSnap, sportSnap] = await Promise.all([getDocs(qGlobal), getDocs(qSport)]);

      const globalWagers = [];
      globalSnap.forEach(doc => {
        const data = doc.data();
        if (data.WagerType && !this.wagerButtonsData.includes(data.WagerType)) {
          globalWagers.push(data.WagerType);
        }
      });

      const sportWagers = [];
      sportSnap.forEach(doc => {
        const data = doc.data();
        if (data.WagerType && !this.wagerButtonsData.includes(data.WagerType)) {
          sportWagers.push(data.WagerType);
        }
      });

      // Merge with a separator
      this.wagerButtonsData = [];
      this.wagerButtonsData.push(...globalWagers);
      if (sportWagers.length > 0) {
        this.wagerButtonsData.push('--- Sport Specific ---');
        this.wagerButtonsData.push(...sportWagers);
      }

      this.renderWagerButtons(this.wagerButtonsData);
      this.loadMoreBtn.style.display = 'none'; // no pagination for wagers now
      this.setStatus('');
    } catch (error) {
      console.error('Error loading wager types:', error);
      this.setStatus('Failed to load wager types.', true);
    }
  }

  renderWagerButtons(buttons) {
    this.buttonsWrapper.innerHTML = '';

    buttons.forEach(label => {
      if (label === '--- Sport Specific ---') {
        const separator = document.createElement('div');
        separator.textContent = 'Sport Specific Wagers';
        separator.style.fontWeight = 'bold';
        separator.style.margin = '10px 0';
        this.buttonsWrapper.appendChild(separator);
        return;
      }

      const btn = document.createElement('button');
      btn.textContent = label;
      btn.classList.add('admin-button');

      if (this.selectedWagerType === label) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        this.selectedWagerType = label;
        this.step = 6;
        this.selectedUnit = null;
        this.renderStatusAndTitle();
        this.loadMoreBtn.style.display = 'none';
        this.submitBtn.style.display = 'none';
        this.loadUnits();
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  async loadUnits(loadMore = false) {
    this.setStatus('Loading units...');
    try {
      const unitsRef = collection(db, 'Units');
      let q;

      q = query(unitsRef, orderBy('Rank'), limit(this.PAGE_LIMIT));

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No units found.');
        return;
      }

      this.unitButtonsData = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.display_unit && !this.unitButtonsData.includes(data.display_unit)) {
          this.unitButtonsData.push(data.display_unit);
        }
      });

      this.renderUnitButtons(this.unitButtonsData);
      this.loadMoreBtn.style.display = 'none';
      this.setStatus('');
    } catch (error) {
      console.error('Error loading units:', error);
      this.setStatus('Failed to load units.', true);
    }
  }

  renderUnitButtons(buttons) {
    this.buttonsWrapper.innerHTML = '';

    buttons.forEach(label => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.classList.add('admin-button');

      if (this.selectedUnit === label) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        this.selectedUnit = label;
        this.step = 7;
        this.selectedPhrase = null;
        this.renderStatusAndTitle();
        this.loadMoreBtn.style.display = 'none';
        this.submitBtn.style.display = 'none';
        this.loadPhrases();
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  async loadPhrases(loadMore = false) {
    if (!this.selectedSport) {
      this.setStatus('Please select a sport first.', true);
      return;
    }
    this.setStatus('Loading phrases...');
    try {
      const phrasesRef = collection(db, 'HypePhrases');
      let qActive, qSport;

      qActive = query(
        phrasesRef,
        where('active_status', '==', 'active'),
        where('Sport', '==', this.selectedSport),
        orderBy('Phrase'),
        limit(this.PAGE_LIMIT)
      );

      qSport = query(
        phrasesRef,
        where('active_status', '==', 'active'),
        where('Sport', '!=', this.selectedSport),
        orderBy('Phrase'),
        limit(this.PAGE_LIMIT)
      );

      const [activeSnap, otherSnap] = await Promise.all([getDocs(qActive), getDocs(qSport)]);

      const activePhrases = [];
      activeSnap.forEach(doc => {
        const data = doc.data();
        if (data.Phrase && !this.phraseButtonsData.includes(data.Phrase)) {
          activePhrases.push(data.Phrase);
        }
      });

      const otherPhrases = [];
      otherSnap.forEach(doc => {
        const data = doc.data();
        if (data.Phrase && !this.phraseButtonsData.includes(data.Phrase)) {
          otherPhrases.push(data.Phrase);
        }
      });

      this.phraseButtonsData = [...activePhrases, ...otherPhrases];

      this.renderPhraseButtons(this.phraseButtonsData);
      this.loadMoreBtn.style.display = 'inline-block'; // pagination here
      this.setStatus('');
    } catch (error) {
      console.error('Error loading phrases:', error);
      this.setStatus('Failed to load phrases.', true);
    }
  }

  renderPhraseButtons(buttons) {
    this.buttonsWrapper.innerHTML = '';

    buttons.forEach(label => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.classList.add('admin-button');

      if (this.selectedPhrase === label) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        this.selectedPhrase = label;
        this.step = 8;
        this.renderStatusAndTitle();
        this.loadMoreBtn.style.display = 'none';
        this.submitBtn.style.display = 'inline-block';
        this.renderNotesPrompt();
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  renderNotesPrompt() {
    this.buttonsWrapper.innerHTML = '';

    const question = document.createElement('p');
    question.textContent = 'Do you want to leave Notes/Comments for the pick?';
    question.style.fontWeight = 'bold';
    this.buttonsWrapper.appendChild(question);

    const yesBtn = document.createElement('button');
    yesBtn.textContent = 'Yes';
    yesBtn.classList.add('admin-button');
    yesBtn.addEventListener('click', () => this.showNotesTextarea());
    this.buttonsWrapper.appendChild(yesBtn);

    const noBtn = document.createElement('button');
    noBtn.textContent = 'No';
    noBtn.classList.add('admin-button');
    noBtn.addEventListener('click', () => {
      this.buttonsWrapper.innerHTML = '';
      this.submitBtn.style.display = 'inline-block';
    });
    this.buttonsWrapper.appendChild(noBtn);
  }

  showNotesTextarea() {
    this.buttonsWrapper.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.maxLength = 100;
    textarea.rows = 2;
    textarea.cols = 40;
    textarea.style.fontFamily = "'Oswald', sans-serif";
    textarea.style.fontSize = '16px';
    textarea.style.padding = '8px';
    textarea.style.border = '1px solid #ccc';
    textarea.style.borderRadius = '4px';
    textarea.placeholder = 'Enter notes/comments here... (max 100 characters)';
    textarea.addEventListener('input', () => {
      const remaining = 100 - textarea.value.length;
      this.statusMsg.textContent = `${remaining} characters remaining`;
    });

    this.buttonsWrapper.appendChild(textarea);
    textarea.focus();
  }

  onButtonClick(type, label) {
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
          this.gameButtonsData = [];
          this.wagerButtonsData = [];
          this.unitButtonsData = [];
          this.phraseButtonsData = [];

          this.leagueLastVisible = null;
          this.gameLastVisible = null;

          this.step = 2;
          this.renderStatusAndTitle();
          this.loadLeagues();
          this.loadMoreBtn.style.display = 'none';
          this.submitBtn.style.display = 'none';
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
          this.wagerButtonsData = [];
          this.unitButtonsData = [];
          this.phraseButtonsData = [];

          this.gameLastVisible = null;

          this.step = 3;
          this.renderStatusAndTitle();
          this.loadGames();
          this.loadMoreBtn.style.display = 'none';
          this.submitBtn.style.display = 'none';
        }
        break;
      case 'wagerType':
        // Not used, handled in renderWagerButtons click
        break;
      case 'unit':
        // Not used, handled in renderUnitButtons click
        break;
      case 'phrase':
        // Not used, handled in renderPhraseButtons click
        break;
    }
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

    let notes = '';
    const textarea = this.buttonsWrapper.querySelector('textarea');
    if (textarea) {
      notes = textarea.value.trim();
    }

    this.setStatus('Submitting your selection...');

    try {
      await addDoc(collection(db, 'UserSubmissions'), {
        userId: this.userId,
        sportName: this.selectedSport,
        leagueName: this.selectedLeague,
        gameId: this.selectedGame.id,
        awayTeam: this.selectedGame.awayTeam,
        homeTeam: this.selectedGame.homeTeam,
        gameStartUTC: this.selectedGame.startTimeUTC,
        selectedTeam: this.selectedTeam,
        wagerType: this.selectedWagerType,
        unit: this.selectedUnit,
        phrase: this.selectedPhrase,
        notes: notes,
        timestamp: Timestamp.now(),
      });

      this.setStatus('Submission successful! Thank you.');
      this.submitBtn.style.display = 'none';
      this.loadMoreBtn.style.display = 'none';
    } catch (error) {
      console.error('Error submitting:', error);
      this.setStatus('Failed to submit your selection.', true);
    }
  }
}
