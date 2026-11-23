(function () {
  'use strict';
  const { $, $$, initSite } = window.BS_SVC;
  initSite();
  const toast = $('#mindGymToast');
  let toastTimer;
  const showToast = (message) => { toast.textContent = message; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 4500); };
  $$('.mg-answers button').forEach((button) => button.addEventListener('click', () => {
    $$('.mg-answers button').forEach((item) => item.classList.toggle('is-selected', item === button));
    $('.mg-answer-note').textContent = button.dataset.answer === '51' ? 'That’s right — 18 + 24 + 9 = 51. Nicely done.' : 'A good try. Take another look whenever you feel like it.';
  }));
  $$('.mg-moods button').forEach((button) => button.addEventListener('click', () => {
    $$('.mg-moods button').forEach((item) => item.classList.toggle('is-selected', item === button));
    $('.mg-mood-note').textContent = `Thanks for checking in. It’s okay to feel ${button.textContent.trim().toLowerCase()}.`;
  }));
  $$('.mg-play').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.practice)));
  const tips = ['A pause does not need to be productive to be valuable.', 'Relax your shoulders and let your jaw soften for one full breath.', 'If your thoughts are busy, name three things that are steady around you.', 'A glass of water and a few deep breaths can be a perfectly good reset.', 'Make the next five minutes a little easier, not perfect.'];
  let currentTip = 0;
  $$('[data-tip]').forEach((button) => button.addEventListener('click', () => { currentTip = (currentTip + 1) % tips.length; $('#tipText').textContent = tips[currentTip]; if (button.closest('.mg-hero-actions')) document.querySelector('.mg-tip').scrollIntoView({ behavior: 'smooth', block: 'center' }); }));
  const activitySets = {
    'Logic puzzles': { icon: '🧩', description: 'A few small problems to solve at your own pace.', action: 'New puzzle', cards: [['Doubling sequence', 'Spot the next number in a fast-moving pattern.'], ['Odd one out', 'Find the item that does not belong in the group.']] },
    'Memory games': { icon: '🧠', description: 'Short recall games to stretch your memory.', action: 'New memory game', cards: [['Picture recall', 'Look closely, then remember the details.'], ['Pair match', 'Find the pairs before they disappear.']] },
    'Focus challenges': { icon: '🔎', description: 'Give your attention one calm place to land.', action: 'New challenge', cards: [['Find the shape', 'Spot the different shape in the grid.'], ['Colour switch', 'Follow the instruction, not the word.']] },
    'Word games': { icon: '🔤', description: 'Play with language, one word at a time.', action: 'New word game', cards: [['Word ladder', 'Change one letter at a time.'], ['Quick category', 'Name three things before the timer ends.']] },
    'Number games': { icon: '🔢', description: 'A light number warm-up for your brain.', action: 'New number game', cards: [['Add them up', 'A quick, friendly mental maths round.'], ['What comes next?', 'Find the rule in a number sequence.']] },
    'Mindfulness': { icon: '🌿', description: 'Small moments to pause and come back to yourself.', action: 'New practice', cards: [['One-minute breathing', 'Follow your breath for one gentle minute.'], ['Five senses', 'Notice what is here, right now.']] }
  };
  const renderActivitySet = (name) => {
    const set = activitySets[name]; if (!set) return;
    $('#categoryIcon').textContent = set.icon; $('#categoryTitle').textContent = name; $('#categoryDescription').textContent = set.description;
    $('[data-new-activity]').innerHTML = `${set.action} <i class="bi bi-stars"></i>`;
    $('#activityCards').innerHTML = set.cards.map(([title, text]) => `<div class="col-md-6"><article class="mg-game-card"><span class="mg-duration">ABOUT 30 SECONDS · 10 POINTS</span><h3>${title}</h3><p>${text}</p><button type="button" class="bys-btn-brand" data-game="${title}">Start</button></article></div>`).join('');
  };
  $$('[data-mg-tab]').forEach((tab) => tab.addEventListener('click', () => {
    const tabName = tab.dataset.mgTab;
    $$('[data-mg-tab]').forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
    $$('[data-mg-panel]').forEach((panel) => { panel.hidden = panel.dataset.mgPanel !== tabName; });
    document.querySelector('.mg-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  $$('.mg-category-pills button').forEach((button) => button.addEventListener('click', () => {
    $$('.mg-category-pills button').forEach((item) => item.classList.toggle('is-active', item === button)); renderActivitySet(button.dataset.category);
  }));
  document.addEventListener('click', (event) => {
    const game = event.target.closest('[data-game]'); if (game) showToast(`${game.dataset.game} is ready when you are. Take your time.`);
    if (event.target.closest('[data-new-activity]')) showToast('Here is a fresh activity for you. Choose a card below to begin.');
  });
})();
