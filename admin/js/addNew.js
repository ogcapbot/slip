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

    this.step = 1; // Steps: 1=Sport,2=League,3=Game,4=Team,5=WagerType,6=Unit,7=Phrase,8=Notes

    // Pagination cursors
    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;
    this.wagerLastVisible = null;
    this.unitLastVisible = null;
    this.phraseLastVisible = null;

    this.PAGE_LIMIT = 15;

    // Data caches
    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.wagerButtonsData = [];
    this.unitButtonsData = [];
    this.phraseButtonsData = [];

    // Selected items
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

    // Notes container for textarea
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

  formatGameDateTime(startTimeUTC) {
    const now = new Date();
    const gameDate = new Date(startTimeUTC);

    const diffMs = gameDate - now;
    const diffMinutes = diffMs / 60000;
    const diffHours = diffMs / 3600000;

    const estOptions = { timeZone: 'America/New_York', hour12: true, hour: 'numeric', minute: '2-digit' };
    const timeLabel = gameDate.toLocaleTimeString('en-US', estOptions);

    if (diffMinutes < 0) {
      return `Game Started @ ${timeLabel} EST`;
    } else if (diffMinutes <= 15) {
      return `Game Starting Soon @ ${timeLabel} EST`;
    } else if (diffMinutes <= 60) {
      return `Game Starts @ ${timeLabel} EST`;
    } else if (diffHours >= 48) {
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
    } else {
      const dayLabel = diffHours < 24 ? 'Today' : 'Tomorrow';
      return `${dayLabel} ${timeLabel} EST`;
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
          orderBy('startTimeET'),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          gamesRef,
          where('leagueShortname', '==', this.selectedLeague),
          orderBy('startTimeET'),
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
        if (!this.gameButtonsData.find(g => g.id === doc.id)) {
          newGames.push({ id: doc.id, ...data });
        }
      });
      this.gameButtonsData.push(...newGames);
      this.renderGameButtons(this.gameButtonsData);
      this.loadMoreBtn.style.display = snapshot.docs.length === this.PAGE_LIMIT ? 'inline-block' : 'none';
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
      btn.style.textAlign = 'left';
      btn.style.whiteSpace = 'normal';
      btn.style.lineHeight = '1.2em';
      const awayTeam = game.awayTeam || 'TBD';
      const homeTeam = game.homeTeam || 'TBD';
      const gameTime = this.formatGameDateTime(game.startTimeET);
      btn.innerHTML = `
        <div style="text-align: left; font-weight: bold;">${awayTeam}</div>
        <div style="text-align: right; padding-right: 10px;">@ ${homeTeam}</div>
        <div style="text-align: center; font-style: italic; font-size: 0.9em;">${gameTime}</div>
      `;
      btn.addEventListener('click', () => {
        this.selectedGame = game;
        this.selectedTeam = null;
        this.selectedWagerType = null;
        this.selectedUnit = null;
        this.selectedPhrase = null;
        this.wagerButtonsData = [];
        this.unitButtonsData = [];
        this.phraseButtonsData = [];
        this.step = 4;
        this.renderStatusAndTitle();
        this.loadMoreBtn.style.display = 'none';
        this.submitBtn.style.display = 'none';
        this.renderTeamButtons();
      });
      if (this.selectedGame && this.selectedGame.id === game.id) {
        btn.classList.add('active');
      }
      this.buttonsWrapper.appendChild(btn);
    });
  }

  renderTeamButtons() {
    this.buttonsWrapper.innerHTML = '';
    ['awayTeam', 'homeTeam'].forEach(teamType => {
      const btn = document.createElement('button');
      btn.classList.add('admin-button');
      btn.textContent = this.selectedGame[teamType] || 'TBD';
      if (this.selectedTeam === btn.textContent) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        this.selectedTeam = btn.textContent;
        this.step = 5;
        this.renderStatusAndTitle();
        this.loadMoreBtn.style.display = 'none';
        this.submitBtn.style.display = 'none';
        this.loadWagers();
      });
      this.buttonsWrapper.appendChild(btn);
    });
  }

  async loadWagers(loadMore = false) {
    if (!this.selectedSport) {
      this.setStatus('Please select a sport first.', true);
      return;
    }
    this.setStatus('Loading wager types...');
    try {
      const wagersRef = collection(db, 'WagerTypes');
      // Load wagers where Sport == 'All' first
      const qAll = query(
        wagersRef,
        where('Sport', '==', 'All'),
        orderBy('Name'),
        limit(this.PAGE_LIMIT)
      );
      // Then wagers where Sport == selectedSport
      const qSport = query(
        wagersRef,
        where('Sport', '==', this.selectedSport),
        orderBy('Name'),
        limit(this.PAGE_LIMIT)
      );

      const [allSnap, sportSnap] = await Promise.all([getDocs(qAll), getDocs(qSport)]);

      const allWagers = [];
      allSnap.forEach(doc => {
        const data = doc.data();
        if (data.Name && !this.wagerButtonsData.includes(data.Name)) {
          allWagers.push(data.Name);
        }
      });

      const sportWagers = [];
      sportSnap.forEach(doc => {
        const data = doc.data();
        if (data.Name && !this.wagerButtonsData.includes(data.Name)) {
          sportWagers.push(data.Name);
        }
      });

      this.wagerButtonsData = [...allWagers, '--- Sport Specific Wagers ---', ...sportWagers];

      this.renderButtons(this.wagerButtonsData, 'wagerType');
      this.loadMoreBtn.style.display = 'none'; // TODO: add pagination if needed

      this.setStatus('');
    } catch (error) {
      console.error('Error loading wager types:', error);
      this.setStatus('Failed to load wager types.', true);
    }
  }

  async loadUnits(loadMore = false) {
    this.setStatus('Loading units...');
    try {
      const unitsRef = collection(db, 'Units');
      let q;
      if (!loadMore || !this.unitLastVisible) {
        q = query(unitsRef, orderBy('Rank'), limit(this.PAGE_LIMIT));
      } else {
        q = query(unitsRef, orderBy('Rank'), startAfter(this.unitLastVisible), limit(this.PAGE_LIMIT));
      }
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        this.loadMoreBtn.style.display = 'none';
        this.setStatus('No more units to load.');
        return;
      }
      this.unitLastVisible = snapshot.docs[snapshot.docs.length - 1];
      const newUnits = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.display_unit && !this.unitButtonsData.includes(data.display_unit)) {
          newUnits.push(data.display_unit);
        }
      });
      this.unitButtonsData.push(...newUnits);
      this.renderButtons(this.unitButtonsData, 'unit');
      this.loadMoreBtn.style.display = snapshot.docs.length === this.PAGE_LIMIT ? 'inline-block' : 'none';
      this.setStatus('');
    } catch (error) {
      console.error('Error loading units:', error);
      this.setStatus('Failed to load units.', true);
    }
  }

  async loadPhrases(loadMore = false) {
    if (!this.selectedSport) {
      this.setStatus('Please select a sport first.', true);
      return;
    }
    this.setStatus('Loading phrases...');
    try {
      const phrasesRef = collection(db, 'HypePhrases');
      let qActive = query(
        phrasesRef,
        where('active_status', '==', 'active'),
        where('Sport', '==', this.selectedSport),
        orderBy('Phrase'),
        limit(this.PAGE_LIMIT)
      );
      let qOther = query(
        phrasesRef,
        where('active_status', '==', 'active'),
        where('Sport', '!=', this.selectedSport),
        orderBy('Phrase'),
        limit(this.PAGE_LIMIT)
      );
      const [activeSnap, otherSnap] = await Promise.all([getDocs(qActive), getDocs(qOther)]);
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
      this.renderButtons(this.phraseButtonsData, 'phrase');
      this.loadMoreBtn.style.display = 'inline-block'; // pagination can be improved here
      this.setStatus('');
    } catch (error) {
      console.error('Error loading phrases:', error);
      this.setStatus('Failed to load phrases.', true);
    }
  }

  renderNotesPrompt() {
    this.buttonsWrapper.innerHTML = '';
    this.notesContainer.style.display = 'block';
    this.notesContainer.innerHTML = '';

    const question = document.createElement('p');
    question.textContent = 'Do you want to leave Notes/Comments for the pick?';
    question.style.fontWeight = 'bold';
    this.notesContainer.appendChild(question);

    const yesBtn = document.createElement('button');
    yesBtn.textContent = 'Yes';
    yesBtn.classList.add('admin-button');
    yesBtn.addEventListener('click', () => this.showNotesTextarea());
    this.notesContainer.appendChild(yesBtn);

    const noBtn = document.createElement('button');
    noBtn.textContent = 'No';
    noBtn.classList.add('admin-button');
    noBtn.style.marginLeft = '8px';
    noBtn.addEventListener('click', () => {
      this.notesContainer.style.display = 'none';
      this.submitBtn.style.display = 'inline-block';
    });
    this.notesContainer.appendChild(noBtn);
  }

  showNotesTextarea() {
    this.notesContainer.innerHTML = '';

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

    const charCount = document.createElement('p');
    charCount.textContent = '100 characters remaining';
    charCount.style.textAlign = 'right';
    charCount.style.fontSize = '12px';
    charCount.style.color = '#555';

    textarea.addEventListener('input', () => {
      const remaining = 100 - textarea.value.length;
      charCount.textContent = `${remaining} characters remaining`;
      this.notesText = textarea.value;
    });

    this.notesContainer.appendChild(textarea);
    this.notesContainer.appendChild(charCount);
    textarea.focus();
    this.submitBtn.style.display = 'inline-block';
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
          this.leagueLastVisible = null;
          this.gameButtonsData = [];
          this.gameLastVisible = null;
          this.wagerButtonsData = [];
          this.unitButtonsData = [];
          this.phraseButtonsData = [];

          this.step = 2;
          this.renderStatusAndTitle();
          this.loadLeagues();
          this.loadMoreBtn.style.display = 'none';
          this.submitBtn.style.display = 'none';
          this.notesContainer.style.display = 'none';
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
          this.unitButtonsData = [];
          this.phraseButtonsData = [];

          this.step = 3;
          this.renderStatusAndTitle();
          this.loadGames();
          this.loadMoreBtn.style.display = 'none';
          this.submitBtn.style.display = 'none';
          this.notesContainer.style.display = 'none';
        }
        break;

      case 'wagerType':
        if (this.selectedWagerType !== label) {
          if (label === '--- Sport Specific Wagers ---') {
            // Separator, ignore clicks
            return;
          }
          this.selectedWagerType = label;
          this.selectedUnit = null;
          this.selectedPhrase = null;

          this.unitButtonsData = [];
          this.phraseButtonsData = [];

          this.step = 6;
          this.renderStatusAndTitle();
          this.loadUnits();
          this.loadMoreBtn.style.display = 'none';
          this.submitBtn.style.display = 'none';
          this.notesContainer.style.display = 'none';
        }
        break;

      case 'unit':
        if (this.selectedUnit !== label) {
          this.selectedUnit = label;
          this.selectedPhrase = null;

          this.phraseButtonsData = [];

          this.step = 7;
          this.renderStatusAndTitle();
          this.loadPhrases();
          this.loadMoreBtn.style.display = 'none';
          this.submitBtn.style.display = 'none';
          this.notesContainer.style.display = 'none';
        }
        break;

      case 'phrase':
        if (this.selectedPhrase !== label) {
          this.selectedPhrase = label;

          this.step = 8;
          this.renderStatusAndTitle();
          this.loadMoreBtn.style.display = 'none';
          this.submitBtn.style.display = 'inline-block';
          this.renderNotesPrompt();
        }
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
      case 6:
        await this.loadUnits(true);
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
        notes: this.notesText || '',
        timestamp: Timestamp.now(),
      });

      this.setStatus('Submission successful! Thank you.');
      this.submitBtn.style.display = 'none';
      this.loadMoreBtn.style.display = 'none';
      this.notesContainer.style.display = 'none';
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
    this.notesText = '';

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

    this.renderStatusAndTitle();
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.notesContainer.style.display = 'none';

    this.loadSports();
  }
}
