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

    this.step = 1; // 1=sport, 2=league, 3=game, 4=team, 5=wager
    this.selectedSport = null;
    this.selectedLeague = null;
    this.selectedGame = null;
    this.selectedTeam = null;

    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.gameLastVisible = null;

    this.PAGE_LIMIT = 200; // load all sports/leagues/games in one go

    this.sportButtonsData = [];
    this.leagueButtonsData = [];
    this.gameButtonsData = [];
    this.wagerButtonsAll = [];
    this.wagerButtonsSport = [];

    this.renderInitialUI();
    this.loadSports();
  }

  clearContainer() {
    this.container.innerHTML = '';
  }

  renderInitialUI() {
    this.clearContainer();

    const title = document.createElement('h2');
    title.textContent = 'Please select a Sport';
    title.id = 'workflowTitle';
    this.container.appendChild(title);

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
  }

  setStatus(message, isError = false) {
    this.statusMsg.textContent = message;
    this.statusMsg.style.color = isError ? 'red' : 'inherit';
  }

  async loadSports(loadMore = false) {
    if (this.step !== 1) return;

    this.setStatus('Loading sports...');

    try {
      let q;
      if (!loadMore || !this.sportLastVisible) {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          orderBy('group'),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'SportsData'),
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

      const newGroups = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (
          data.group &&
          !this.sportButtonsData.includes(data.group)
        ) {
          newGroups.push(data.group);
        }
      });

      this.sportButtonsData.push(...newGroups);
      this.sportButtonsData = [...new Set(this.sportButtonsData)].sort((a,b) => a.localeCompare(b));

      this.renderButtons(this.sportButtonsData, 'sport');

      this.loadMoreBtn.style.display = snapshot.docs.length === this.PAGE_LIMIT ? 'inline-block' : 'none';
      this.setStatus('');
    } catch (error) {
      console.error('Error loading sports:', error);
      this.setStatus('Failed to load sports.', true);
    }
  }

  async loadLeagues(loadMore = false) {
    if (this.step !== 2) return;
    if (!this.selectedSport) {
      this.setStatus('Please select a sport first.', true);
      return;
    }

    this.setStatus(`Loading leagues for ${this.selectedSport}...`);

    try {
      let q;
      if (!loadMore || !this.leagueLastVisible) {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          where('group', '==', this.selectedSport),
          orderBy('title'),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'SportsData'),
          where('active', '==', true),
          where('group', '==', this.selectedSport),
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
        if (
          data.title &&
          !this.leagueButtonsData.includes(data.title)
        ) {
          newLeagues.push(data.title);
        }
      });

      this.leagueButtonsData.push(...newLeagues);
      this.leagueButtonsData = [...new Set(this.leagueButtonsData)].sort((a,b) => a.localeCompare(b));

      this.renderButtons(this.leagueButtonsData, 'league');

      this.loadMoreBtn.style.display = snapshot.docs.length === this.PAGE_LIMIT ? 'inline-block' : 'none';
      this.setStatus('');
    } catch (error) {
      console.error('Error loading leagues:', error);
      this.setStatus('Failed to load leagues.', true);
    }
  }

  async loadGames(loadMore = false) {
    if (this.step !== 3) return;
    if (!this.selectedSport || !this.selectedLeague) {
      this.setStatus('Please select both sport and league first.', true);
      return;
    }

    this.setStatus(`Loading games for ${this.selectedSport} / ${this.selectedLeague}...`);

    try {
      let q;
      if (!loadMore || !this.gameLastVisible) {
        q = query(
          collection(db, 'GameEventsData'),
          where('sportName', '==', this.selectedSport),
          where('leagueShortname', '==', this.selectedLeague),
          orderBy('startTimeET'),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'GameEventsData'),
          where('sportName', '==', this.selectedSport),
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
        const label = `${data.awayTeam} @ ${data.homeTeam} [[${data.startTimeET}]]`;
        if (
          label &&
          !this.gameButtonsData.some(g => g.label === label)
        ) {
          newGames.push({ label, docId: doc.id });
        }
      });

      this.gameButtonsData.push(...newGames);
      this.gameButtonsData = this.gameButtonsData.filter((v,i,a) => a.findIndex(t => (t.label === v.label)) === i);
      this.gameButtonsData.sort((a,b) => a.label.localeCompare(b.label));

      this.renderButtons(this.gameButtonsData.map(g => g.label), 'game');

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
      btn.classList.add('admin-button');
      btn.style.textAlign = 'left';

      if (
        (type === 'sport' && this.selectedSport === label) ||
        (type === 'league' && this.selectedLeague === label) ||
        (type === 'game' && this.selectedGame === label)
      ) {
        btn.classList.add('active');
      }

      if (type === 'game') {
        const regex = /^(.+?) @ (.+?) \[\[(.+)\]\]$/;
        const match = regex.exec(label);
        if (!match) {
          btn.textContent = label;
        } else {
          const awayTeam = match[1];
          const homeTeam = match[2];
          const dateStr = match[3];

          const estDate = new Date(dateStr);
          const now = new Date();

          const estOffset = -4;
          const estNow = new Date(now.getTime() + estOffset * 60 * 60 * 1000);
          const estToday = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate());
          const estGameDay = new Date(estDate.getFullYear(), estDate.getMonth(), estDate.getDate());

          const dayDiff = Math.floor((estGameDay - estToday) / (1000 * 60 * 60 * 24));
          let dayLabel = '';
          if (dayDiff === 0) dayLabel = 'Today';
          else if (dayDiff === 1) dayLabel = 'Tomorrow';
          else if (dayDiff > 1) dayLabel = `${dayDiff}+ Days away`;
          else dayLabel = 'Past';

          const options = { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'America/New_York' };
          const timeLabel = estDate.toLocaleTimeString('en-US', options);

          btn.innerHTML = `
            <div style="display:flex; justify-content: space-between; white-space: nowrap; font-weight: bold;">
              <span style="text-align: left;">${awayTeam}</span>
              <span style="text-align: right;">@ ${homeTeam}</span>
            </div>
            <div style="text-align: center; font-size: 0.85em; margin-top: 4px;">
              ${dayLabel} [[${timeLabel} EST]]
            </div>
          `;
        }
      } else if (type === 'wagerSeparator') {
        // special non-clickable separator
        btn.textContent = label;
        btn.disabled = true;
        btn.classList.add('separator-button');
        btn.style.textAlign = 'center';
        btn.style.backgroundColor = '#ddd';
        btn.style.color = '#444';
        btn.style.fontWeight = 'bold';
        btn.style.cursor = 'default';
      } else {
        btn.textContent = label;
      }

      btn.addEventListener('click', () => {
        if (type === 'sport') {
          if (this.selectedSport !== label) {
            this.buttonsWrapper.innerHTML = '';
            this.loadMoreBtn.style.display = 'none';
            this.submitBtn.style.display = 'none';

            this.selectedSport = label;
            this.selectedLeague = null;
            this.leagueButtonsData = [];
            this.leagueLastVisible = null;

            this.selectedGame = null;
            this.gameButtonsData = [];
            this.gameLastVisible = null;

            this.selectedTeam = null;

            this.step = 2;

            document.getElementById('workflowTitle').textContent =
              `Selected Sport: ${label} — Select a League`;

            this.loadLeagues();
          }
        } else if (type === 'league') {
          if (this.selectedLeague !== label) {
            this.buttonsWrapper.innerHTML = '';
            this.loadMoreBtn.style.display = 'none';
            this.submitBtn.style.display = 'none';

            this.selectedLeague = label;

            this.selectedGame = null;
            this.gameButtonsData = [];
            this.gameLastVisible = null;

            this.selectedTeam = null;

            this.step = 3;

            document.getElementById('workflowTitle').textContent =
              `Selected League: ${label} — Select a Game`;

            this.loadGames();
          }
        } else if (type === 'game') {
          if (this.selectedGame !== label) {
            this.buttonsWrapper.innerHTML = '';
            this.loadMoreBtn.style.display = 'none';

            this.selectedGame = label;

            this.selectedTeam = null;

            this.step = 4;

            this.submitBtn.style.display = 'inline-block';

            document.getElementById('workflowTitle').textContent =
              `Selected Game: ${label} — Select Away or Home Team`;

            this.renderTeamsButtons();
          }
        } else if (type === 'wager') {
          this.selectedWager = label;
          this.setStatus(`Selected Wager Type: ${label}`);
        }
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  renderTeamsButtons() {
    this.buttonsWrapper.innerHTML = '';

    const gameObj = this.gameButtonsData.find(g => g.label === this.selectedGame);
    if (!gameObj) {
      this.setStatus('Selected game data not found.', true);
      return;
    }

    const regex = /^(.+?) @ (.+?) \[\[.*\]\]$/;
    const match = regex.exec(gameObj.label);
    if (!match) {
      this.setStatus('Failed to parse teams from selected game.', true);
      return;
    }

    const awayTeam = match[1];
    const homeTeam = match[2];

    const awayBtn = document.createElement('button');
    awayBtn.textContent = awayTeam;
    awayBtn.classList.add('admin-button');
    awayBtn.addEventListener('click', () => this.onTeamSelected(awayTeam));

    const homeBtn = document.createElement('button');
    homeBtn.textContent = homeTeam;
    homeBtn.classList.add('admin-button');
    homeBtn.addEventListener('click', () => this.onTeamSelected(homeTeam));

    this.buttonsWrapper.appendChild(awayBtn);
    this.buttonsWrapper.appendChild(homeBtn);
  }

  onTeamSelected(teamName) {
    this.selectedTeam = teamName;
    this.setStatus(`You selected team: ${teamName}`);
    this.submitBtn.style.display = 'inline-block';
  }

  async loadWagerTypes() {
    if (this.step !== 5) return;
    if (!this.selectedSport) {
      this.setStatus('Please select a sport first.', true);
      return;
    }

    this.setStatus('Loading wager types...');

    try {
      // Load all wagers where Sport == "All"
      const qAll = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', 'All'),
        orderBy('id'),
        limit(this.PAGE_LIMIT)
      );
      const snapshotAll = await getDocs(qAll);

      this.wagerButtonsAll = snapshotAll.docs.map(doc => doc.data().WagerName || doc.id);

      // Load wagers for selected sport
      const qSport = query(
        collection(db, 'WagerTypes'),
        where('Sport', '==', this.selectedSport),
        orderBy('id'),
        limit(this.PAGE_LIMIT)
      );
      const snapshotSport = await getDocs(qSport);

      this.wagerButtonsSport = snapshotSport.docs.map(doc => doc.data().WagerName || doc.id);

      // Render buttons: first All wagers, then separator, then sport-specific wagers
      const combinedButtons = [
        ...this.wagerButtonsAll,
        '----- Sport Specific Wagers -----',
        ...this.wagerButtonsSport
      ];

      this.renderButtons(combinedButtons.map((label, idx) => {
        if (label === '----- Sport Specific Wagers -----') return { label, type: 'wagerSeparator' };
        else return label;
      }), 'wager');

      this.setStatus('');
      this.submitBtn.style.display = 'inline-block';
    } catch (error) {
      console.error('Error loading wager types:', error);
      this.setStatus('Failed to load wager types.', true);
    }
  }

  async onLoadMore() {
    // For now, large PAGE_LIMIT means no paging needed here
    if (this.step === 1) {
      await this.loadSports(true);
    } else if (this.step === 2) {
      await this.loadLeagues(true);
    } else if (this.step === 3) {
      await this.loadGames(true);
    }
  }

  async onSubmit() {
    if (this.step < 2) {
      this.setStatus('Please select a sport before submitting.', true);
      return;
    }

    this.setStatus('Submitting your selection...');
    try {
      const dataToSubmit = {
        userId: this.userId,
        timestamp: Timestamp.now(),
      };

      if (this.step >= 2) {
        dataToSubmit.sportName = this.selectedSport;
      }
      if (this.step >= 3) {
        dataToSubmit.leagueName = this.selectedLeague;
      }
      if (this.step >= 4) {
        dataToSubmit.gameLabel = this.selectedGame;
        dataToSubmit.teamName = this.selectedTeam;
      }
      if (this.step >= 5) {
        dataToSubmit.wagerType = this.selectedWager || null;
      }

      await addDoc(collection(db, 'UserSubmissions'), dataToSubmit);

      this.setStatus('Submission successful! Thank you.');
      this.submitBtn.style.display = 'none';
    } catch (error) {
      console.error('Error submitting:', error);
      this.setStatus('Failed to submit your selection.', true);
    }
  }
}
