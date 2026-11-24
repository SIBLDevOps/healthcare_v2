/* Lab Tests – demo PDF report builder + View / Download helpers.
   In production every report is a PDF uploaded by the lab and the API returns its URL.
   For the demo we build a real, valid one-page A4 PDF (no library, works on file://) from the
   report data, so "View" and "Download" behave exactly like they will with the lab's PDF.
   One PDF per test (a package = one PDF with a section per test); long reports continue on more pages
   (compact header + patient strip, "Page X of N"), notes + summary boxes on the last page.
   Design follows the BeyondSure document style (same as the Tax Invoice): company header,
   navy serif title + status badge, blue rule, rounded detail boxes, light-header table (section rows for packages),
   notes + summary boxes and a centred footer.
   LT.reportPdf.build({ report, file, params }) -> PDF as a plain ASCII string. */
window.LT = window.LT || {};

(function () {
  const W = 595, H = 842, M = 40, R = W - M; // A4 in points, page margin, right edge
  /* PDF base fonts only know basic characters: map the few special ones used in the data */
  const asc = (s) => String(s == null ? '' : s)
    .replace(/[–—]/g, '-').replace(/[·•]/g, '-').replace(/³/g, '^3').replace(/µ/g, 'u').replace(/₹/g, 'Rs.')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E]/g, '');
  const pdfStr = (s) => '(' + asc(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)') + ')';
  const rgb = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255).toFixed(3)).join(' '); };
  const f2 = (n) => (Math.round(n * 100) / 100).toString();
  /* colours taken from the BeyondSure invoice */
  const C = {
    brand: '#1964ee', title: '#1d4fb8', navy: '#13285a', text: '#1f2a44', muted: '#6b7488', faint: '#98a1b2',
    line: '#dfe5f0', rowline: '#e6eaf2', box: '#f8fafc', head: '#f2f5fa', headline: '#d5dcea',
    okBg: '#e8f8ef', okLine: '#b9e8cc', ok: '#0e8a50', normal: '#0e9f6e', borderline: '#b7791f', abnormal: '#d93036'
  };

  /* exact character widths (1/1000 em) of the PDF standard fonts for ASCII 32..126 (Adobe AFM metrics),
     so right-aligned, centred and wrapped text lands exactly where it should */
  const AFM = {
    F1: '278 278 355 556 556 889 667 191 333 333 389 584 278 333 278 278 556 556 556 556 556 556 556 556 556 556 278 278 584 584 584 556 1015 667 667 722 722 667 611 778 722 278 500 667 556 833 722 778 667 778 722 667 611 722 667 944 667 667 611 278 278 278 469 556 333 556 556 500 556 556 278 556 556 222 222 500 222 833 556 556 556 556 333 500 278 556 500 722 500 500 500 334 260 334 584',
    F2: '278 333 474 556 556 889 722 238 333 333 389 584 278 333 278 278 556 556 556 556 556 556 556 556 556 556 333 333 584 584 584 611 975 722 722 722 722 667 611 778 722 278 556 722 611 833 722 778 667 778 722 667 611 722 667 944 667 667 611 333 278 333 584 556 333 556 611 556 611 556 333 611 611 278 278 556 278 889 611 611 611 611 389 556 333 611 556 778 556 556 500 389 280 389 584',
    F3: '250 333 555 500 500 1000 833 278 333 333 500 570 250 333 250 278 500 500 500 500 500 500 500 500 500 500 333 333 570 570 570 500 930 722 667 722 722 667 611 778 778 389 500 778 667 944 722 778 611 778 722 556 667 722 722 1000 722 722 667 333 278 333 581 500 333 500 556 444 556 444 333 500 556 278 333 556 278 833 556 500 556 556 444 389 333 556 500 722 500 500 444 394 220 394 520'
  };
  Object.keys(AFM).forEach((k) => { AFM[k] = AFM[k].split(' ').map(Number); });
  AFM.F4 = AFM.F3.map((v) => Math.round(v * 0.94)); // Times-Roman ~ Times-Bold
  function width(s, size, font) {
    const t = AFM[font] || AFM.F1;
    let w = 0;
    for (const ch of asc(s)) { const c = ch.charCodeAt(0); w += t[c - 32] || 500; }
    return (w / 1000) * size;
  }

  /* page layout (points): first page table starts under the header + detail boxes; later pages under a compact header */
  const ROW = 26, SEC = 22, FOOT = 64, FIRST_TOP = H - 172 - 104 - 30 - 16 - 24, NEXT_TOP = H - 124 - 24;
  /* rows of the results table: a section row before each test of a package, then its parameters */
  function rowsOf(params) {
    const out = []; let sec = null;
    params.forEach((p) => { if (p.section && p.section !== sec) { sec = p.section; out.push({ heading: sec }); } out.push(p); });
    return out;
  }
  const notesOf = (params) => {
    const flag = (p) => (p.status === 'normal' ? 'normal' : p.status === 'abnormal' ? (p.dir === 'low' ? 'low' : 'high') : (p.dir === 'low' ? 'borderline low' : 'borderline high'));
    const bad = params.filter((p) => p.status !== 'normal');
    const list = bad.slice(0, 6).map((p) => `${p.name} is ${flag(p)} (${p.value} ${asc(p.unit)}).`.replace(' ().', '.').replace(/ \)/, ')'));
    if (bad.length > 6) list.push(`${bad.length - 6} more value${bad.length - 6 > 1 ? 's need' : ' needs'} attention - see the table above.`);
    return (list.length ? list : ['All values are within the reference range.'])
      .concat(['Values outside the range do not always mean illness - please discuss them with your doctor.', 'Fasting status and medicines can affect some results.']);
  };
  /* notes box lines (wrapped to the box width) */
  const BOXW = (R - M - 4 - 18) / 2;
  const noteLinesOf = (params, wrap) => { const out = []; notesOf(params).forEach((s) => wrap(s, 8.8, BOXW - 40).forEach((l, i) => out.push([l, i === 0]))); return out; };
  const wrapText = (s, size, maxW, font) => { const out = []; let cur = ''; asc(s).split(/\s+/).forEach((w) => { const x = cur ? cur + ' ' + w : w; if (width(x, size, font) > maxW && cur) { out.push(cur); cur = w; } else cur = x; }); if (cur) out.push(cur); return out; };
  /* page plan shared by build() and pageCount(): which rows go on which page.
     A section heading never sits alone at the bottom of a page (it moves down with its first row), and a page that
     starts in the middle of a section repeats "<section> (continued)". The notes + summary boxes need their full
     height on the last page, else they start a new page. */
  function plan(params) {
    const items = []; let y = FIRST_TOP, page = 0, sec = null;
    const rows = rowsOf(params);
    const brk = () => { page++; y = NEXT_TOP; if (sec) { items.push({ page, heading: sec, cont: true }); y -= SEC; } };
    rows.forEach((row, i) => {
      if (row.heading) {
        sec = row.heading;
        if (y - SEC - ROW < FOOT + 10) { page++; y = NEXT_TOP; }
        items.push({ page, heading: row.heading }); y -= SEC; return;
      }
      if (y - ROW < FOOT + 10) brk();
      items.push({ page, param: row }); y -= ROW;
    });
    const nb = Math.max(118, 44 + noteLinesOf(params, wrapText).length * 12.5);
    const boxesNewPage = y - 22 - nb - 50 < FOOT - 30;
    return { items, nb, boxesNewPage, pages: page + 1 + (boxesNewPage ? 1 : 0) };
  }
  /* how many pages a report file needs (used for the "N pages" label in lists) */
  const pageCount = (params) => plan(params).pages;

  function build({ report, file, params }) {
    const pages = []; let ops = null;
    const newPage = () => { ops = []; pages.push(ops); };
    const fill = (c) => `${rgb(c)} rg`, stroke = (c) => `${rgb(c)} RG`;
    const rect = (x, y, w, h, c) => ops.push(`${fill(c)} ${f2(x)} ${f2(y)} ${f2(w)} ${f2(h)} re f`);
    const line = (x1, y1, x2, y2, c, wd) => ops.push(`${stroke(c)} ${wd || 0.6} w ${f2(x1)} ${f2(y1)} m ${f2(x2)} ${f2(y2)} l S`);
    const rrect = (x, y, w, h, r, bg, border, bw) => {
      const k = 0.5523 * r, p = [`${f2(x + r)} ${f2(y)} m`, `${f2(x + w - r)} ${f2(y)} l`, `${f2(x + w - r + k)} ${f2(y)} ${f2(x + w)} ${f2(y + r - k)} ${f2(x + w)} ${f2(y + r)} c`,
      `${f2(x + w)} ${f2(y + h - r)} l`, `${f2(x + w)} ${f2(y + h - r + k)} ${f2(x + w - r + k)} ${f2(y + h)} ${f2(x + w - r)} ${f2(y + h)} c`, `${f2(x + r)} ${f2(y + h)} l`,
      `${f2(x + r - k)} ${f2(y + h)} ${f2(x)} ${f2(y + h - r + k)} ${f2(x)} ${f2(y + h - r)} c`, `${f2(x)} ${f2(y + r)} l`, `${f2(x)} ${f2(y + r - k)} ${f2(x + r - k)} ${f2(y)} ${f2(x + r)} ${f2(y)} c h`].join(' ');
      ops.push(`${bg ? fill(bg) + ' ' : ''}${border ? stroke(border) + ' ' + (bw || 0.8) + ' w ' : ''}${p} ${bg && border ? 'B' : bg ? 'f' : 'S'}`);
    };
    /* fonts: F1 Helvetica, F2 Helvetica-Bold, F3 Times-Bold, F4 Times-Roman.
       Tc (letter spacing) persists in a PDF until changed, so every text block sets it explicitly */
    const text = (x, y, s, size, o) => { o = o || {}; const fnt = o.font || 'F1'; ops.push(`BT /${fnt} ${size} Tf ${fill(o.color || C.text)} ${o.cs || 0} Tc ${f2(x)} ${f2(y)} Td ${pdfStr(s)} Tj ET`); return width(s, size, fnt) + (o.cs ? o.cs * asc(s).length : 0); };
    const right = (xr, y, s, size, o) => text(xr - width(s, size, (o && o.font) || 'F1') - ((o && o.cs) ? o.cs * asc(s).length : 0), y, s, size, o);
    const center = (xm, y, parts) => { const tot = parts.reduce((n, p) => n + width(p[0], p[1], p[2].font || 'F1'), 0); let x = xm - tot / 2; parts.forEach((p) => { x += text(x, y, p[0], p[1], p[2]); }); };
    const wrap = (s, size, maxW, font) => { const out = []; let cur = ''; asc(s).split(/\s+/).forEach((w) => { const t = cur ? cur + ' ' + w : w; if (width(t, size, font) > maxW && cur) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; };
    const fit = (s, size, maxW, font) => { let t = asc(s); if (width(t, size, font) <= maxW) return t; while (t.length > 3 && width(t + '...', size, font) > maxW) t = t.slice(0, -1); return t.trim() + '...'; };
    const cap = (x, y, s) => text(x, y, s.toUpperCase(), 7.6, { font: 'F2', color: '#5b6474', cs: 0.9 }); // box headings: small caps style

    const lab = report.lab || {}, mem = report.member || {};
    const dt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const reportNo = 'BSR' + file.id.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const badges = (lab.badges || []).filter((b) => ['NABL', 'CAP', 'ISO'].includes(b));
    const logo = (x, y, s) => { const k = s / 19; x += text(x, y, 'Beyond', s, { font: 'F2', color: C.navy }); text(x, y, 'Sure', s, { font: 'F2', color: C.brand }); text(x + width('Sure', s, 'F2') - k, y + 10 * k, '+', 11 * k, { font: 'F2', color: C.brand }); };

    /* ---------- page 1 header: logo + company (left) | title + meta + badge (right) ---------- */
    newPage();
    let y = H - 58;
    logo(M, y, 19);
    text(M + 14, y - 10, 'Click.     Care.     Relax.', 6.5, { color: C.muted });
    text(M, y - 26, 'BeyondSure Private Limited', 10, { font: 'F2', color: C.text });
    text(M, y - 40, '203, Shivam Square, 4 Sahar Road, Andheri (E), Mumbai 400069,', 8.6, { color: C.muted });
    text(M, y - 52, 'Maharashtra, India', 8.6, { color: C.muted });
    text(M, y - 66, 'Email: support@shrigodahealthcare.com', 8.6, { color: C.muted });
    right(R, H - 62, 'LAB REPORT', 24, { font: 'F3', color: C.title });
    right(R, H - 82, 'Report #: ' + reportNo, 10, { font: 'F2', color: C.text });
    const dLbl = 'Date: ', dVal = dt(report.date);
    right(R - width(dVal, 9, 'F2'), H - 96, dLbl, 9, { color: C.muted }); right(R, H - 96, dVal, 9, { font: 'F2', color: C.muted });
    const bLbl = 'Booking Ref: ', bVal = report.bookingId || '-';
    right(R - width(bVal, 9, 'F2'), H - 109, bLbl, 9, { color: C.muted }); right(R, H - 109, bVal, 9, { font: 'F2', color: C.muted });
    const badge = 'REPORT STATUS: FINAL', bw = width(badge, 7.6, 'F2') + 0.9 * badge.length + 20;
    rrect(R - bw, H - 138, bw, 19, 2.5, C.okBg, C.okLine);
    right(R - 11, H - 131.5, badge, 7.6, { font: 'F2', color: C.ok, cs: 0.9 });
    line(M, H - 148, R, H - 148, C.title, 1.6);

    /* ---------- two detail boxes ---------- */
    const bx = M + 2, gap = 18, bwid = (R - M - 4 - gap) / 2, btop = H - 172, bh = 104;
    const box = (x0, title, big, rows) => {
      rrect(x0, btop - bh, bwid, bh, 6, C.box, C.line);
      cap(x0 + 13, btop - 19, title); line(x0 + 13, btop - 26, x0 + bwid - 13, btop - 26, C.line, 0.6);
      text(x0 + 13, btop - 44, fit(big, 11.5, bwid - 26, 'F2'), 11.5, { font: 'F2', color: C.text });
      rows.forEach(([k, v], i) => { const yy = btop - 62 - i * 15; text(x0 + 13, yy, k, 9, { font: 'F3', color: C.muted }); text(x0 + 100, yy, fit(v, 9.2, bwid - 113, 'F3'), 9.2, { font: 'F3', color: C.text }); });
    };
    box(bx, 'Patient details', mem.name || '-', [
      ['Age / Gender:', (mem.age ? mem.age + ' yrs' : '-') + ' / ' + (mem.gender === 'male' ? 'Male' : mem.gender === 'female' ? 'Female' : '-')],
      ['Relation:', mem.relationship || '-'],
      ['Booking ID:', report.bookingId || '-']]);
    box(bx + bwid + gap, 'Lab & sample details', lab.name || 'Partner Lab', [
      ['Accreditation:', badges.length ? badges.join(', ') + ' accredited' : 'Accredited laboratory'],
      ['Sample type:', file.sampleType || 'Blood'],
      ['Reported on:', dt(report.date)]]);

    /* ---------- results table (continues on the next pages when it is long) ---------- */
    const col = { n: M + 12, p: M + 36, r: M + 232, u: M + 300, g: M + 370 };
    const tableHead = (yTop, cont) => {
      text(M + 2, yTop, fit(file.name, 13, 300, 'F2') + (cont ? ' (continued)' : ''), 13, { font: 'F2', color: C.text });
      if (!cont) { const chip = 'Verified by pathologist', cw = width(chip, 7.2, 'F2') + 12, cx = M + 2 + width(fit(file.name, 13, 300, 'F2'), 13, 'F2') + 10; rrect(cx, yTop - 3.5, cw, 14, 2, C.okBg, C.okLine); text(cx + 6, yTop + 0.5, chip, 7.2, { font: 'F2', color: C.ok }); }
      const yh = yTop - 16;
      rect(M, yh - 24, R - M, 24, C.head); line(M, yh, R, yh, C.line, 0.8); line(M, yh - 24, R, yh - 24, C.headline, 1.4);
      const th = (xx, s) => text(xx, yh - 15.5, s, 7.6, { font: 'F2', color: '#3b4560', cs: 0.6 });
      th(col.n, '#'); th(col.p, 'TEST PARAMETER'); th(col.r, 'RESULT'); th(col.u, 'UNIT'); th(col.g, 'REFERENCE RANGE');
      right(R - 12, yh - 15.5, 'FLAG', 7.6, { font: 'F2', color: '#3b4560', cs: 0.6 });
      return yh - 24;
    };
    /* later pages: compact header + patient strip */
    const contHeader = () => {
      newPage();
      logo(M, H - 50, 14);
      right(R, H - 48, 'LAB REPORT', 15, { font: 'F3', color: C.title });
      right(R, H - 62, 'Report #: ' + reportNo, 8.5, { font: 'F2', color: C.muted });
      line(M, H - 72, R, H - 72, C.title, 1.2);
      rrect(M, H - 100, R - M, 20, 4, C.box, C.line);
      text(M + 10, H - 93.5, fit((mem.name || '-') + '  -  ' + (mem.relationship || '') + '  -  Booking ' + (report.bookingId || '-'), 8.6, R - M - 20 - 130, 'F2'), 8.6, { font: 'F2', color: C.text });
      right(R - 10, H - 93.5, (lab.name || '') ? fit(lab.name, 8.4, 125) : '', 8.4, { color: C.muted });
      return H - 124;
    };
    const rangeTxt = (p) => (p.text ? '-' : p.low == null && p.high == null ? 'Refer note' : p.high == null ? '> ' + p.low : (p.low === 0 || p.low == null) ? '< ' + p.high : p.low + ' - ' + p.high);
    const flag = (p) => (p.status === 'normal' ? 'Normal' : p.status === 'abnormal' ? (p.dir === 'low' ? 'Low' : 'High') : (p.dir === 'low' ? 'Borderline low' : 'Borderline high'));

    y = tableHead(btop - bh - 30, false);
    const pl = plan(params);
    let n = 0, onPage = 0;
    pl.items.forEach((it) => {
      if (it.page !== onPage) { onPage = it.page; y = tableHead(contHeader(), true); }
      if (it.heading) {
        rect(M, y - SEC, R - M, SEC, '#f7f9fd'); line(M, y - SEC, R, y - SEC, C.rowline, 0.7);
        text(col.n, y - 14.5, it.heading.toUpperCase() + (it.cont ? '  (CONTINUED)' : ''), 7.8, { font: 'F2', color: C.title, cs: 0.7 });
        y -= SEC; return;
      }
      const p = it.param, yy = y - 17, c = C[p.status] || C.text;
      n++;
      text(col.n, yy, String(n), 9.5, { font: 'F2', color: C.faint });
      text(col.p, yy, fit(p.name, 10, col.r - col.p - 10, 'F2'), 10, { font: 'F2', color: C.text });
      text(col.r, yy, fit(String(p.value), p.text ? 8.8 : 10, (p.text ? R - 12 - 60 : col.u - 8) - col.r, 'F2'), p.text ? 8.8 : 10, { font: 'F2', color: c });
      if (!p.text) { text(col.u, yy, fit(p.unit, 9, col.g - col.u - 8), 9, { color: C.muted }); text(col.g, yy, rangeTxt(p), 9.2, { color: C.text }); }
      right(R - 12, yy, flag(p), 9, { font: 'F2', color: c });
      y -= ROW; line(M, y, R, y, C.rowline, 0.7);
    });

    /* ---------- notes + summary boxes (next page if they do not fit) ---------- */
    const noteLines = noteLinesOf(params, wrap), nb = pl.nb;
    if (pl.boxesNewPage) y = contHeader() + 10;
    const ntop = y - 22;
    rrect(bx, ntop - nb, bwid, nb, 6, C.box, C.line);
    cap(bx + 13, ntop - 19, 'Interpretation & notes'); line(bx + 13, ntop - 26, bx + bwid - 13, ntop - 26, C.line, 0.6);
    noteLines.forEach(([l, first], i) => { const yy = ntop - 42 - i * 12.5; if (first) text(bx + 16, yy, '-', 8.8, { font: 'F2', color: C.muted }); text(bx + 25, yy, l, 8.8, { color: '#3b4560' }); });
    const sx = bx + bwid + gap;
    rrect(sx, ntop - nb, bwid, nb, 6, C.box, C.line);
    cap(sx + 13, ntop - 19, 'Result summary'); line(sx + 13, ntop - 26, sx + bwid - 13, ntop - 26, C.line, 0.6);
    const cnt = (s) => params.filter((p) => p.status === s).length;
    [['Normal', cnt('normal'), C.normal], ['Borderline', cnt('borderline'), C.borderline], ['Out of range', cnt('abnormal'), C.abnormal]].forEach(([k, v, c], i) => {
      const yy = ntop - 44 - i * 15; text(sx + 13, yy, k, 9.5, { font: 'F3', color: C.muted }); right(sx + bwid - 13, yy, String(v), 10, { font: 'F3', color: c });
    });
    const vy = ntop - 44 - 3 * 15 - 2;
    line(sx + 13, vy + 9, sx + bwid - 13, vy + 9, C.title, 1.4);
    text(sx + 13, vy - 6, 'Verified by', 10, { font: 'F3', color: C.title });
    right(sx + bwid - 13, vy - 6, 'Dr. S. Kulkarni, MD', 10.5, { font: 'F3', color: C.title });
    right(sx + bwid - 13, vy - 19, 'Pathology - Reg. MMC 2011/04/1234', 7.8, { color: C.muted });

    /* ---------- closing note (last page) + page numbers (every page) ---------- */
    const fy = Math.max(ntop - nb - 26, 72);
    line(M, fy, R, fy, C.rowline, 0.8);
    center(W / 2, fy - 18, [['This is a computer-generated report, electronically verified by the pathologist, and does not require a physical signature.', 8.2, { color: C.faint }]]);
    center(W / 2, fy - 33, [['Thank you for choosing ', 8.2, { color: C.faint }], ['BeyondSure Healthcare', 8.2, { font: 'F2', color: C.muted }], [' for your diagnostic and health needs.', 8.2, { color: C.faint }]]);
    pages.forEach((pg, i) => {
      ops = pg;
      text(M, 30, 'Demo report generated from sample data', 7, { color: C.faint });
      if (pages.length > 1 && i < pages.length - 1) center(W / 2, 30, [['Continued on next page', 7, { color: C.faint }]]);
      right(R, 30, 'Page ' + (i + 1) + ' of ' + pages.length, 7, { color: C.faint });
    });

    /* ---------- assemble the PDF (ASCII only, so string length = byte length) ----------
       1 catalog, 2 pages, 3-6 fonts, 7 info, then per page: page object + content stream */
    const font = (name) => `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`;
    const pageIds = pages.map((_, i) => 8 + i * 2);
    const objs = [
      '<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /DisplayDocTitle true >> >>',
      `<< /Type /Pages /Kids [${pageIds.map((id) => id + ' 0 R').join(' ')}] /Count ${pages.length} >>`,
      font('Helvetica'), font('Helvetica-Bold'), font('Times-Bold'), font('Times-Roman'),
      `<< /Title ${pdfStr(file.name + ' - ' + (mem.name || ''))} /Author ${pdfStr(lab.name || 'Partner Lab')} /Subject ${pdfStr('Lab report ' + reportNo)} /Creator (BeyondSure Lab Tests) >>`
    ];
    pages.forEach((pg, i) => {
      const stream = pg.join('\n');
      objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${pageIds[i] + 1} 0 R >>`);
      objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });
    let out = '%PDF-1.4\n';
    const offsets = objs.map((o, i) => { const at = out.length; out += `${i + 1} 0 obj\n${o}\nendobj\n`; return at; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return out;
  }

  /* ---------- View / Download (shared by reports.html and report-view.html) ---------- */
  const cache = {};
  /* get the PDF as a browser URL: production = lab's PDF url; demo = Blob from the generated text */
  async function fileUrl(reportId, fileId) {
    const key = reportId + '|' + fileId;
    if (cache[key]) return cache[key];
    const f = await LT.api.getReportFile(reportId, fileId);
    f.href = f.url || URL.createObjectURL(new Blob([f.pdf], { type: 'application/pdf' }));
    delete f.pdf;
    return (cache[key] = f);
  }
  const kb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
  /* browsers that can show a PDF inside the page (desktop Chrome / Edge / Firefox / Safari); most phones cannot */
  const inlinePdf = () => (typeof navigator.pdfViewerEnabled === 'boolean' ? navigator.pdfViewerEnabled : !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent));

  async function download(reportId, fileId, btn) {
    const U = LT.ui;
    try {
      const f = await (btn ? U.busy(btn, () => fileUrl(reportId, fileId)) : fileUrl(reportId, fileId));
      const a = document.createElement('a'); a.href = f.href; a.download = f.fileName; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      U.toast('Downloading ' + f.fileName);
    } catch (e) { U.toast(U.errMsg(e), 'danger'); }
  }

  async function view(reportId, fileId, o) {
    const U = LT.ui; o = o || {};
    let f;
    try { f = await (o.btn ? U.busy(o.btn, () => fileUrl(reportId, fileId)) : fileUrl(reportId, fileId)); }
    catch (e) { return U.toast(U.errMsg(e), 'danger'); }
    const body = inlinePdf()
      ? `<div class="lt-pdfv"><iframe class="lt-pdfv-frame" src="${f.href}#view=FitH" title="${U.esc(f.name)} report (PDF)"></iframe></div>`
      : `<div class="lt-pdfv-fallback"><span class="lt-pdfv-ico"><i class="bi bi-file-earmark-pdf-fill" aria-hidden="true"></i></span>
          <b>${U.esc(f.fileName)}</b><small style="color:white;" >PDF · ${kb(f.size)}</small>
          <p>Your phone opens PDF reports in its own viewer. Tap <b>Open report</b> to read it, or download it to keep a copy.</p></div>`;
    const md = U.modal.open({
      title: f.name, sub: o.sub || 'PDF report shared by the lab', size: 'xl',
      body, footer: `<a class="btn lt-btn-outline" href="${f.href}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> ${inlinePdf() ? 'Open in new tab' : 'Open report'}</a>
        <button type="button" class="btn lt-btn" data-dl><i class="bi bi-download"></i> Download PDF</button>` });
    md.el.classList.add('lt-pdfv-modal');
    md.$('[data-dl]').onclick = (e) => download(reportId, fileId, e.currentTarget);
    return md;
  }

  /* open the PDF directly in a new browser tab (used by My Reports → View).
     The tab is opened right away on the click (browsers block tabs opened after a wait),
     shows "Opening your report…", then loads the PDF once it is ready. */
  async function openTab(reportId, fileId, btn) {
    const U = LT.ui;
    let w = null;
    try { w = window.open('', '_blank'); } catch (e) { w = null; }
    if (w) {
      try {
        w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Opening report…</title></head><body style="margin:0;height:100vh;display:grid;place-items:center;font-family:Arial,Helvetica,sans-serif;color:#6b7488;background:#f6f8fc">'
          + '<div style="text-align:center"><div style="width:38px;height:38px;margin:0 auto 14px;border:4px solid #dbe7fd;border-top-color:#1964ee;border-radius:50%;animation:s 0.8s linear infinite"></div>Opening your report…</div>'
          + '<style>@keyframes s{to{transform:rotate(360deg)}}</style></body></html>');
        w.document.close();
      } catch (e) { /* ignore */ }
    }
    try {
      const f = await (btn ? U.busy(btn, () => fileUrl(reportId, fileId)) : fileUrl(reportId, fileId));
      if (w && !w.closed) { w.location.href = f.href; return; }
      /* pop-ups blocked: try a normal link, otherwise tell the user */
      const a = document.createElement('a'); a.href = f.href; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      U.toast('If the report did not open, allow pop-ups for this site', 'warning');
    } catch (e) {
      if (w && !w.closed) w.close();
      U.toast(U.errMsg(e), 'danger');
    }
  }

  LT.reportPdf = { build, pageCount, asc, fileUrl, view, download, openTab, inlinePdf, kb };
})();
