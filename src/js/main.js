/* ============================================
   CONOR McARDLE — Portfolio
   Interactions & Animations
   ============================================ */

(function () {
  'use strict';

  // ── Theme Toggle ──

  const THEME_KEY = 'cm-theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  // Apply theme immediately to prevent flash
  setTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    });
  });

  // ── Mobile Navigation ──

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.nav__toggle');
    const overlay = document.querySelector('.nav__overlay');

    if (toggle && overlay) {
      toggle.addEventListener('click', () => {
        const isOpen = toggle.classList.toggle('is-active');
        overlay.classList.toggle('is-open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      // Close on link click
      overlay.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('is-active');
          overlay.classList.remove('is-open');
          document.body.style.overflow = '';
        });
      });
    }
  });

  // ── Scroll Animations ──

  document.addEventListener('DOMContentLoaded', () => {
    const animated = document.querySelectorAll('[data-animate]');
    if (!animated.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    animated.forEach(el => observer.observe(el));
  });

  // ── Typing Effect ──

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('[data-typed]');
    if (!el) return;

    const text = el.getAttribute('data-typed');
    el.textContent = '';

    let i = 0;
    const speed = 35;
    const startDelay = 600;

    function type() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed + Math.random() * 20);
      }
    }

    setTimeout(type, startDelay);
  });

  // ── Status Bar Scroll Progress ──

  document.addEventListener('DOMContentLoaded', () => {
    const fill = document.querySelector('.status-bar__progress-fill');
    const pct = document.querySelector('[data-scroll-pct]');
    if (!fill) return;

    let ticking = false;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      fill.style.width = progress + '%';
      if (pct) pct.textContent = Math.round(progress) + '%';
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    updateProgress();
  });

  // ── Manchester United Results Widget ──

  document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('mufc-widget');
    if (!widget) return;

    const loadingEl = document.getElementById('mufc-loading');
    const errorEl = document.getElementById('mufc-error');
    const resultsEl = document.getElementById('mufc-results');

    const SCHEDULE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/360/schedule';
    const SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=';
    const MUFC_ID = '360';
    const RECENT_COUNT = 5;
    const UPCOMING_COUNT = 3;

    // Cache for fetched match details
    const detailsCache = {};

    function parseMatch(event) {
      const comp = event.competitions[0];
      const status = comp.status.type;
      const homeTeam = comp.competitors.find(c => c.homeAway === 'home');
      const awayTeam = comp.competitors.find(c => c.homeAway === 'away');
      const mufc = comp.competitors.find(c => c.team.id === MUFC_ID);
      const opponent = comp.competitors.find(c => c.team.id !== MUFC_ID);

      let result = null;
      if (status.state === 'post' && mufc && opponent) {
        const muScore = parseInt(mufc.score.displayValue, 10);
        const opScore = parseInt(opponent.score.displayValue, 10);
        if (muScore > opScore) result = 'win';
        else if (muScore < opScore) result = 'loss';
        else result = 'draw';
      }

      const matchDate = new Date(event.date);
      const dateStr = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      return {
        id: event.id,
        homeTeam: homeTeam.team,
        awayTeam: awayTeam.team,
        homeScore: homeTeam.score ? homeTeam.score.displayValue : null,
        awayScore: awayTeam.score ? awayTeam.score.displayValue : null,
        isHome: mufc && mufc.homeAway === 'home',
        result,
        dateStr,
        timeStr,
        state: status.state
      };
    }

    async function fetchScorers(eventId) {
      if (detailsCache[eventId]) return detailsCache[eventId];
      try {
        const res = await fetch(SUMMARY_URL + eventId);
        if (!res.ok) return [];
        const data = await res.json();
        const scorers = [];
        (data.rosters || []).forEach(roster => {
          const teamName = roster.team ? roster.team.abbreviation || roster.team.displayName : '??';
          (roster.roster || []).forEach(player => {
            (player.plays || []).forEach(play => {
              if (play.scoringPlay && play.didScore) {
                let suffix = '';
                if (play.penaltyKick) suffix = ' (pen)';
                if (play.ownGoal) suffix = ' (og)';
                scorers.push({
                  player: player.athlete ? player.athlete.displayName : 'Unknown',
                  time: play.clock ? play.clock.displayValue : '',
                  team: teamName,
                  suffix: suffix
                });
              }
            });
          });
        });
        // Sort by minute
        scorers.sort((a, b) => {
          const minA = parseInt(a.time, 10) || 0;
          const minB = parseInt(b.time, 10) || 0;
          return minA - minB;
        });
        detailsCache[eventId] = scorers;
        return scorers;
      } catch (e) {
        return [];
      }
    }

    function renderScorerDetails(scorers) {
      const wrap = document.createElement('div');
      wrap.className = 'mufc-widget__scorers';
      if (scorers.length === 0) {
        wrap.innerHTML = '<span class="mufc-widget__no-scorers">No goals</span>';
        return wrap;
      }
      scorers.forEach(s => {
        const row = document.createElement('div');
        row.className = 'mufc-widget__scorer';
        row.innerHTML = '<span class="mufc-widget__scorer-time">' + s.time + '</span>' +
          '<span class="mufc-widget__scorer-name">' + s.player + s.suffix + '</span>' +
          '<span class="mufc-widget__scorer-team">' + s.team + '</span>';
        wrap.appendChild(row);
      });
      return wrap;
    }

    function renderMatchRow(match, isUpcoming) {
      const wrapper = document.createElement('div');
      wrapper.className = 'mufc-widget__match-wrapper';

      const row = document.createElement('div');
      const stateClass = isUpcoming ? 'mufc-widget__match--upcoming' :
                         match.state === 'in' ? 'mufc-widget__match--live' : '';
      row.className = 'mufc-widget__match' + (stateClass ? ' ' + stateClass : '');

      // Chevron for completed matches
      if (!isUpcoming && match.state === 'post') {
        row.classList.add('mufc-widget__match--expandable');
        const chevron = document.createElement('span');
        chevron.className = 'mufc-widget__chevron';
        chevron.textContent = '\u25B6';
        row.appendChild(chevron);
      }

      const dateEl = document.createElement('span');
      dateEl.className = 'mufc-widget__date';
      dateEl.textContent = match.dateStr;

      const teamsEl = document.createElement('span');
      teamsEl.className = 'mufc-widget__teams';
      const homeAbbr = match.homeTeam.abbreviation || match.homeTeam.displayName;
      const awayAbbr = match.awayTeam.abbreviation || match.awayTeam.displayName;
      if (match.isHome) {
        teamsEl.innerHTML = '<strong>' + homeAbbr + '</strong> v ' + awayAbbr;
      } else {
        teamsEl.innerHTML = homeAbbr + ' v <strong>' + awayAbbr + '</strong>';
      }

      const scoreEl = document.createElement('span');
      scoreEl.className = 'mufc-widget__score';
      if (isUpcoming) {
        scoreEl.textContent = match.timeStr;
      } else {
        scoreEl.textContent = match.homeScore + ' - ' + match.awayScore;
      }

      const indicatorEl = document.createElement('span');
      indicatorEl.className = 'mufc-widget__result-indicator';
      if (match.result) {
        const label = match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D';
        indicatorEl.textContent = label;
        indicatorEl.classList.add('mufc-widget__result--' + match.result);
      } else if (match.state === 'in') {
        indicatorEl.innerHTML = '<span class="mufc-widget__live-badge">LIVE</span>';
      }

      row.appendChild(dateEl);
      row.appendChild(teamsEl);
      row.appendChild(scoreEl);
      row.appendChild(indicatorEl);
      wrapper.appendChild(row);

      // Details panel (hidden by default)
      if (!isUpcoming && match.state === 'post') {
        const details = document.createElement('div');
        details.className = 'mufc-widget__details';
        details.style.display = 'none';
        wrapper.appendChild(details);

        row.addEventListener('click', async () => {
          const isOpen = details.style.display !== 'none';
          if (isOpen) {
            details.style.display = 'none';
            row.classList.remove('is-expanded');
          } else {
            if (!details.hasChildNodes()) {
              details.innerHTML = '<span class="mufc-widget__details-loading">loading...</span>';
              details.style.display = 'block';
              row.classList.add('is-expanded');
              const scorers = await fetchScorers(match.id);
              details.innerHTML = '';
              details.appendChild(renderScorerDetails(scorers));
            } else {
              details.style.display = 'block';
              row.classList.add('is-expanded');
            }
          }
        });
      }

      return wrapper;
    }

    function renderResults(allCompleted, upcomingMatches, live) {
      resultsEl.innerHTML = '';

      // API returns newest first — take first N as recent, rest for full season
      const recent = allCompleted.slice(0, RECENT_COUNT);
      const remaining = allCompleted.slice(RECENT_COUNT);

      if (recent.length > 0) {
        const label = document.createElement('p');
        label.className = 'mufc-widget__section-label';
        label.textContent = '> recent results';
        resultsEl.appendChild(label);
        recent.forEach(event => {
          resultsEl.appendChild(renderMatchRow(parseMatch(event), false));
        });
      }

      // Full season toggle
      if (remaining.length > 0) {
        const seasonWrap = document.createElement('div');
        seasonWrap.className = 'mufc-widget__season-wrap';

        const seasonResults = document.createElement('div');
        seasonResults.className = 'mufc-widget__season-results';
        seasonResults.style.display = 'none';
        remaining.forEach(event => {
          seasonResults.appendChild(renderMatchRow(parseMatch(event), false));
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mufc-widget__toggle';
        toggleBtn.textContent = '> show full season (' + allCompleted.length + ' matches)';
        toggleBtn.addEventListener('click', () => {
          const isOpen = seasonResults.style.display !== 'none';
          seasonResults.style.display = isOpen ? 'none' : 'block';
          toggleBtn.textContent = isOpen
            ? '> show full season (' + allCompleted.length + ' matches)'
            : '> hide full season';
        });

        seasonWrap.appendChild(toggleBtn);
        seasonWrap.appendChild(seasonResults);
        resultsEl.appendChild(seasonWrap);
      }

      if (live.length > 0) {
        const label = document.createElement('p');
        label.className = 'mufc-widget__section-label';
        label.textContent = '> live';
        resultsEl.appendChild(label);
        live.forEach(event => {
          resultsEl.appendChild(renderMatchRow(parseMatch(event), false));
        });
      }

      if (upcomingMatches.length > 0) {
        const label = document.createElement('p');
        label.className = 'mufc-widget__section-label';
        label.textContent = '> upcoming';
        resultsEl.appendChild(label);
        upcomingMatches.forEach(event => {
          resultsEl.appendChild(renderMatchRow(parseMatch(event), true));
        });
      }

      loadingEl.style.display = 'none';
      resultsEl.style.display = 'block';
    }

    function showError() {
      loadingEl.style.display = 'none';
      errorEl.style.display = 'block';
    }

    async function fetchResults() {
      try {
        const response = await fetch(SCHEDULE_URL);
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        const events = data.events || [];

        const completed = [];
        const upcoming = [];
        const live = [];

        events.forEach(event => {
          const state = event.competitions[0].status.type.state;
          if (state === 'post') completed.push(event);
          else if (state === 'pre') upcoming.push(event);
          else if (state === 'in') live.push(event);
        });

        const upcomingMatches = upcoming.slice(0, UPCOMING_COUNT);

        if (completed.length === 0 && upcomingMatches.length === 0 && live.length === 0) {
          throw new Error('No matches found');
        }

        renderResults(completed, upcomingMatches, live);
      } catch (err) {
        showError();
      }
    }

    fetchResults();
  });

  // ── Smooth Page Transitions (fallback for non-VT browsers) ──

  document.addEventListener('DOMContentLoaded', () => {
    // Only apply if View Transitions API is NOT supported
    if (document.startViewTransition) return;

    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 200ms ease';
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      // Only handle local navigation
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.style.opacity = '0';
        setTimeout(() => {
          window.location.href = href;
        }, 200);
      });
    });
  });

})();
