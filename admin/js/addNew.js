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

/**
 * This module manages the 2-step selection workflow:
 * Step 1: Select sportName
 * Step 2: Select leagueName filtered by sportName
 * Shows buttons in 3 columns, paginated with Load More
 * Only after both selections, shows Submit button.
 * On submit, saves selection to UserSubmissions collection.
 */

export class AddNewWorkflow {
  constructor(container, userId) {
    this.container = container; // DOM element to render UI
    this.userId = userId;

    this.step = 1; // Current step: 1 = sport, 2 = league
    this.selectedSport = null;
    this.selectedLeague = null;

    // Pagination state
    this.sportLastVisible = null;
    this.leagueLastVisible = null;

    // Button limit per page
    this.PAGE_LIMIT = 15;

    // Store fetched buttons per step to avoid duplicates
    this.sportButtonsData = [];
    this.leagueButtonsData = [];

    this.renderInitialUI();
    this.loadSports();
  }

  clearContainer() {
    this.container.innerHTML = '';
  }

  renderInitialUI() {
    this.clearContainer();

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Please select a Sport';
    title.id = 'workflowTitle';
    this.container.appendChild(title);

    // Buttons container
    this.buttonsWrapper = document.createElement('div');
    this.buttonsWrapper.id = 'buttonsWrapper';
    this.buttonsWrapper.style.display = 'grid';
    this.buttonsWrapper.style.gridTemplateColumns = 'repeat(3, 1fr)';
    this.buttonsWrapper.style.gap = '8px';
    this.container.appendChild(this.buttonsWrapper);

    // Load More button (hidden initially)
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

    // Status message
    this.statusMsg = document.createElement('p');
    this.statusMsg.style.marginTop = '16px';
    this.container.appendChild(this.statusMsg);
  }

  setStatus(message, isError = false) {
    this.statusMsg.textContent = message;
    this.statusMsg.style.color = isError ? 'red' : 'inherit';
  }

  async loadSports(loadMore = false) {
    this.setStatus('Loading sports...');
    try {
      // Firestore does NOT support distinct queries, so we:
      // 1) Query all sportNames with limit + pagination
      // 2) Filter unique sportNames client side

      // Query all documents ordered by sportName (to paginate)
      let q;
      if (!loadMore || !this.sportLastVisible) {
        q = query(
          collection(db, 'GameEventsData'),
          orderBy('sportName'),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'GameEventsData'),
          orderBy('sportName'),
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

      // Extract sportNames and deduplicate
      const newSports = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (
          data.sportName &&
          !this.sportButtonsData.find(s => s === data.sportName)
        ) {
          newSports.push(data.sportName);
        }
      });

      this.sportButtonsData.push(...newSports);

      // Alphabetize full sport list
      this.sportButtonsData = [...new Set(this.sportButtonsData)].sort((a, b) =>
        a.localeCompare(b)
      );

      // Render sport buttons
      this.renderButtons(this.sportButtonsData, 'sport');

      // Show Load More only if snapshot size == PAGE_LIMIT (might be more data)
      if (snapshot.docs.length === this.PAGE_LIMIT) {
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

    this.setStatus(`Loading leagues for ${this.selectedSport}...`);

    try {
      let q;
      if (!loadMore || !this.leagueLastVisible) {
        q = query(
          collection(db, 'GameEventsData'),
          where('sportName', '==', this.selectedSport),
          orderBy('leagueName'),
          limit(this.PAGE_LIMIT)
        );
      } else {
        q = query(
          collection(db, 'GameEventsData'),
          where('sportName', '==', this.selectedSport),
          orderBy('leagueName'),
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
          data.leagueName &&
          !this.leagueButtonsData.find(l => l === data.leagueName)
        ) {
          newLeagues.push(data.leagueName);
        }
      });

      this.leagueButtonsData.push(...newLeagues);

      this.leagueButtonsData = [...new Set(this.leagueButtonsData)].sort((a, b) =>
        a.localeCompare(b)
      );

      this.renderButtons(this.leagueButtonsData, 'league');

      if (snapshot.docs.length === this.PAGE_LIMIT) {
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

  renderButtons(buttons, type) {
    // Clear previous buttons for this step
    this.buttonsWrapper.innerHTML = '';

    buttons.forEach(label => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.classList.add('admin-button');

      // Highlight if selected
      if (
        (type === 'sport' && this.selectedSport === label) ||
        (type === 'league' && this.selectedLeague === label)
      ) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        if (type === 'sport') {
          if (this.selectedSport !== label) {
            this.selectedSport = label;
            this.selectedLeague = null;
            this.leagueButtonsData = [];
            this.leagueLastVisible = null;
            this.step = 2;
            this.loadMoreBtn.style.display = 'none';
            this.submitBtn.style.display = 'none';

            // Update title and load leagues
            document.getElementById('workflowTitle').textContent =
              `Selected Sport: ${label} — Select a League`;
            this.loadLeagues();
          }
        } else if (type === 'league') {
          this.selectedLeague = label;

          // Update highlight
          this.renderButtons(this.leagueButtonsData, 'league');

          // Show Submit button now
          this.submitBtn.style.display = 'inline-block';
          this.setStatus(
            `Selected Sport: ${this.selectedSport}, League: ${this.selectedLeague}`
          );
        }
      });

      this.buttonsWrapper.appendChild(btn);
    });
  }

  async onLoadMore() {
    if (this.step === 1) {
      await this.loadSports(true);
    } else if (this.step === 2) {
      await this.loadLeagues(true);
    }
  }

  async onSubmit() {
    if (!this.selectedSport || !this.selectedLeague) {
      this.setStatus('Please select both sport and league before submitting.', true);
      return;
    }

    this.setStatus('Submitting your selection...');

    try {
      await addDoc(collection(db, 'UserSubmissions'), {
        userId: this.userId,
        sportName: this.selectedSport,
        leagueName: this.selectedLeague,
        timestamp: Timestamp.now(),
      });

      this.setStatus('Submission successful! Thank you.');
      this.submitBtn.style.display = 'none';

      // Optionally reset workflow or keep selection locked
      // this.resetWorkflow();

    } catch (error) {
      console.error('Error submitting:', error);
      this.setStatus('Failed to submit your selection.', true);
    }
  }

  resetWorkflow() {
    this.step = 1;
    this.selectedSport = null;
    this.selectedLeague = null;
    this.sportLastVisible = null;
    this.leagueLastVisible = null;
    this.sportButtonsData = [];
    this.leagueButtonsData = [];

    document.getElementById('workflowTitle').textContent = 'Please select a Sport';
    this.loadMoreBtn.style.display = 'none';
    this.submitBtn.style.display = 'none';
    this.setStatus('');

    this.loadSports();
  }
}
