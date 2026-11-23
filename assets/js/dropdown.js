/* BeyondSure – themed dropdown, shared by find-doctor.html and shop.html
   Usage: const dd = window.BS_enhanceSelect(selectElement, { search, searchPlaceholder, minWidth, align, anchor });
   anchor: optional CSS selector of a surrounding box; the option list then lines up with that box
           (same edges, at least its width) instead of with the button itself.
   Returns { refresh, close }. */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ------------------------------------------------------------------
     THEMED DROPDOWN
     Replaces the browser's option list with a styled panel. The real
     <select> stays in the page (hidden) and still fires "change", so the
     rest of the code keeps working with select.value as before.
     ------------------------------------------------------------------ */
  let ddSeq = 0;
  function enhanceSelect(sel, opts = {}) {
    const uid = `dd${++ddSeq}`;
    sel.classList.add('dd-native');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');

    const wrap = document.createElement('div');
    wrap.className = 'dd';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dd-btn';
    btn.id = `${uid}-btn`;
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `${uid}-list`);
    btn.innerHTML = '<span class="dd-value"></span><i class="bi bi-chevron-down dd-caret" aria-hidden="true"></i>';
    wrap.appendChild(btn);
    sel.after(wrap);

    // point the existing <label for="..."> at the new button
    const label = sel.id ? $(`label[for="${sel.id}"]`) : null;
    if (label) { label.htmlFor = btn.id; btn.setAttribute('aria-labelledby', `${btn.id} ${label.id || (label.id = `${uid}-lbl`)}`); }

    // panel is placed on <body> so no parent with overflow:hidden can clip it
    const panel = document.createElement('div');
    panel.className = 'dd-panel' + (opts.search ? ' has-search' : '');
    panel.hidden = true;
    panel.innerHTML =
      (opts.search ? `<div class="dd-search"><i class="bi bi-search" aria-hidden="true"></i><input type="text" placeholder="${esc(opts.searchPlaceholder || 'Search')}" aria-label="${esc(opts.searchPlaceholder || 'Search')}" autocomplete="off"></div>` : '') +
      `<ul class="dd-list" role="listbox" id="${uid}-list" tabindex="-1" aria-labelledby="${btn.id}"></ul>` +
      '<p class="dd-empty" hidden>No match found</p>';
    document.body.appendChild(panel);
    const list = $('.dd-list', panel);
    const search = $('.dd-search input', panel);
    const empty = $('.dd-empty', panel);

    list.innerHTML = [...sel.options].map((o, i) =>
      `<li class="dd-opt" role="option" id="${uid}-o${i}" data-value="${esc(o.value)}" aria-selected="false"><span>${esc(o.text)}</span><i class="bi bi-check2" aria-hidden="true"></i></li>`
    ).join('');
    const items = () => $$('.dd-opt', list).filter((li) => !li.hidden);

    let active = -1;
    const setActive = (idx) => {
      const vis = items();
      if (!vis.length) { active = -1; list.removeAttribute('aria-activedescendant'); return; }
      active = Math.max(0, Math.min(idx, vis.length - 1));
      $$('.dd-opt', list).forEach((li) => li.classList.remove('is-active'));
      const li = vis[active];
      li.classList.add('is-active');
      list.setAttribute('aria-activedescendant', li.id);
      li.scrollIntoView({ block: 'nearest' });
    };

    const refresh = () => {
      const o = sel.options[sel.selectedIndex];
      $('.dd-value', btn).textContent = o ? o.text : '';
      $$('.dd-opt', list).forEach((li) => {
        const on = li.dataset.value === sel.value;
        li.setAttribute('aria-selected', on);
        li.classList.toggle('is-selected', on);
      });
      wrap.classList.toggle('has-value', !!sel.value);
    };

    const place = () => {
      const r = ((opts.anchor && wrap.closest(opts.anchor)) || btn).getBoundingClientRect();
      const width = Math.max(r.width, opts.minWidth || 0);
      panel.style.width = `${Math.min(width, window.innerWidth - 24)}px`;
      let left = opts.align === 'right' ? r.right - panel.offsetWidth : r.left;
      left = Math.max(12, Math.min(left, window.innerWidth - panel.offsetWidth - 12));
      // prefer opening below; shrink the list to fit, open upwards only when there is no room
      const LIST_MAX = 290, GAP = 16;
      list.style.maxHeight = `${LIST_MAX}px`;
      const chrome = panel.offsetHeight - list.offsetHeight;
      const spaceBelow = window.innerHeight - r.bottom - GAP;
      const spaceAbove = r.top - GAP;
      const MIN_LIST = 150;
      const openUp = spaceBelow < chrome + MIN_LIST && spaceAbove > spaceBelow;
      const room = (openUp ? spaceAbove : spaceBelow) - chrome - 8;
      list.style.maxHeight = `${Math.max(MIN_LIST, Math.min(LIST_MAX, room))}px`;
      panel.classList.toggle('bys-up', openUp);
      panel.style.left = `${left}px`;
      panel.style.top = openUp ? `${r.top - panel.offsetHeight - 8}px` : `${r.bottom + 8}px`;
    };

    const open = () => {
      if (!panel.hidden) return;
      document.dispatchEvent(new CustomEvent('dd:closeall', { detail: uid }));
      panel.hidden = false;
      wrap.classList.add('bys-open');
      btn.setAttribute('aria-expanded', 'true');
      if (search) { search.value = ''; filter(''); }
      place();
      const vis = items();
      setActive(Math.max(0, vis.findIndex((li) => li.dataset.value === sel.value)));
      (search || list).focus({ preventScroll: true });
    };

    const close = (focusBtn) => {
      if (panel.hidden) return;
      panel.hidden = true;
      wrap.classList.remove('bys-open');
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    };

    const choose = (value) => {
      if (sel.value !== value) {
        sel.value = value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      refresh();
      close(true);
    };

    const filter = (q) => {
      const s = q.trim().toLowerCase();
      let shown = 0;
      $$('.dd-opt', list).forEach((li) => { const ok = !s || li.textContent.toLowerCase().includes(s); li.hidden = !ok; if (ok) shown++; });
      empty.hidden = shown > 0;
      setActive(0);
    };

    const onKey = (e) => {
      const vis = items();
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
      else if (e.key === 'End') { e.preventDefault(); setActive(vis.length - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (vis[active]) choose(vis[active].dataset.value); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') { close(false); }
    };

    btn.addEventListener('click', () => (panel.hidden ? open() : close(true)));
    btn.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); }
    });
    list.addEventListener('keydown', onKey);
    if (search) {
      search.addEventListener('keydown', onKey);
      search.addEventListener('input', () => filter(search.value));
    }
    list.addEventListener('click', (e) => { const li = e.target.closest('.dd-opt'); if (li) choose(li.dataset.value); });
    list.addEventListener('mousemove', (e) => { const li = e.target.closest('.dd-opt'); if (li) setActive(items().indexOf(li)); });

    document.addEventListener('pointerdown', (e) => { if (!panel.hidden && !panel.contains(e.target) && !wrap.contains(e.target)) close(false); });
    document.addEventListener('dd:closeall', (e) => { if (e.detail !== uid) close(false); });
    window.addEventListener('resize', () => { if (!panel.hidden) place(); });
    window.addEventListener('scroll', () => { if (!panel.hidden) place(); }, { passive: true });

    refresh();
    return { refresh, close };
  }

  window.BS_enhanceSelect = enhanceSelect;
})();
