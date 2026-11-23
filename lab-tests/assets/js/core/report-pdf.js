/* Lab Tests – demo PDF report builder + View / Download helpers.
   In production every report is a PDF uploaded by the lab and the API returns its URL.
   For the demo we build a real, valid one-page A4 PDF (no library, works on file://) from the
   report data, so "View" and "Download" behave exactly like they will with the lab's PDF.
   Design follows the BeyondSure document style (same as the Tax Invoice): company header,
   navy serif title + status badge, blue rule, rounded detail boxes, light-header table,
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
  const C = { brand: '#1964ee', title: '#1d4fb8', navy: '#13285a', text: '#1f2a44', muted: '#6b7488', faint: '#98a1b2',
    line: '#dfe5f0', rowline: '#e6eaf2', box: '#f8fafc', head: '#f2f5fa', headline: '#d5dcea',
    okBg: '#e8f8ef', okLine: '#b9e8cc', ok: '#0e8a50', normal: '#0e9f6e', borderline: '#b7791f', abnormal: '#d93036' };

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

  function build({ report, file, params }) {
    const ops = [];
    const fill = (c) => `${rgb(c)} rg`, stroke = (c) => `${rgb(c)} RG`;
    const rect = (x, y, w, h, c) => ops.push(`${fill(c)} ${f2(x)} ${f2(y)} ${f2(w)} ${f2(h)} re f`);
    const line = (x1, y1, x2, y2, c, wd) => ops.push(`${stroke(c)} ${wd || 0.6} w ${f2(x1)} ${f2(y1)} m ${f2(x2)} ${f2(y2)} l S`);
    const rrect = (x, y, w, h, r, bg, border, bw) => {
      const k = 0.5523 * r, p = [`${f2(x + r)} ${f2(y)} m`, `${f2(x + w - r)} ${f2(y)} l`, `${f2(x + w - r + k)} ${f2(y)} ${f2(x + w)} ${f2(y + r - k)} ${f2(x + w)} ${f2(y + r)} c`,
        `${f2(x + w)} ${f2(y + h - r)} l`, `${f2(x + w)} ${f2(y + h - r + k)} ${f2(x + w - r + k)} ${f2(y + h)} ${f2(x + w - r)} ${f2(y + h)} c`, `${f2(x + r)} ${f2(y + h)} l`,
        `${f2(x + r - k)} ${f2(y + h)} ${f2(x)} ${f2(y + h - r + k)} ${f2(x)} ${f2(y + h - r)} c`, `${f2(x)} ${f2(y + r)} l`, `${f2(x)} ${f2(y + r - k)} ${f2(x + r - k)} ${f2(y)} ${f2(x + r)} ${f2(y)} c h`].join(' ');
      ops.push(`${bg ? fill(bg) + ' ' : ''}${border ? stroke(border) + ' ' + (bw || 0.8) + ' w ' : ''}${p} ${bg && border ? 'B' : bg ? 'f' : 'S'}`);
    };
    /* fonts: F1 Helvetica, F2 Helvetica-Bold, F3 Times-Bold, F4 Times-Roman */
    /* Tc (letter spacing) persists in a PDF until changed, so every text block sets it explicitly */
    const text = (x, y, s, size, o) => { o = o || {}; const fnt = o.font || 'F1'; ops.push(`BT /${fnt} ${size} Tf ${fill(o.color || C.text)} ${o.cs || 0} Tc ${f2(x)} ${f2(y)} Td ${pdfStr(s)} Tj ET`); return width(s, size, fnt) + (o.cs ? o.cs * asc(s).length : 0); };
    const right = (xr, y, s, size, o) => text(xr - width(s, size, (o && o.font) || 'F1') - ((o && o.cs) ? o.cs * asc(s).length : 0), y, s, size, o);
    const center = (xm, y, parts) => { const tot = parts.reduce((n, p) => n + width(p[0], p[1], p[2].font || 'F1'), 0); let x = xm - tot / 2; parts.forEach((p) => { x += text(x, y, p[0], p[1], p[2]); }); };
    const wrap = (s, size, maxW, font) => { const out = []; let cur = ''; asc(s).split(/\s+/).forEach((w) => { const t = cur ? cur + ' ' + w : w; if (width(t, size, font) > maxW && cur) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; };
    const cap = (x, y, s) => text(x, y, s.toUpperCase(), 7.6, { font: 'F2', color: '#5b6474', cs: 0.9 }); // box headings: small caps style

    const lab = report.lab || {}, mem = report.member || {};
    const dt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const reportNo = 'BSR' + file.id.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const badges = (lab.badges || []).filter((b) => ['NABL', 'CAP', 'ISO'].includes(b));

    /* ---------- header: logo + company (left) | title + meta + badge (right) ---------- */
    let x = M, y = H - 58;
    x += text(x, y, 'Beyond', 19, { font: 'F2', color: C.navy });
    text(x, y, 'Sure', 19, { font: 'F2', color: C.brand });
    text(x + width('Sure', 19, 'F2') - 1, y + 10, '+', 11, { font: 'F2', color: C.brand });
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
      text(x0 + 13, btop - 44, big, 11.5, { font: 'F2', color: C.text });
      rows.forEach(([k, v], i) => { const yy = btop - 62 - i * 15; text(x0 + 13, yy, k, 9, { font: 'F3', color: C.muted }); text(x0 + 100, yy, v, 9.2, { font: 'F3', color: C.text }); });
    };
    box(bx, 'Patient details', mem.name || '-', [
      ['Age / Gender:', (mem.age ? mem.age + ' yrs' : '-') + ' / ' + (mem.gender === 'male' ? 'Male' : mem.gender === 'female' ? 'Female' : '-')],
      ['Relation:', mem.relationship || '-'],
      ['Booking ID:', report.bookingId || '-']]);
    box(bx + bwid + gap, 'Lab & sample details', lab.name || 'Partner Lab', [
      ['Accreditation:', badges.length ? badges.join(', ') + ' accredited' : 'Accredited laboratory'],
      ['Sample type:', 'Blood / Serum'],
      ['Reported on:', dt(report.date)]]);

    /* ---------- results table ---------- */
    y = btop - bh - 30;
    text(M + 2, y, file.name, 13, { font: 'F2', color: C.text });
    const chip = 'Verified by pathologist', cw = width(chip, 7.2, 'F2') + 12, cx = M + 2 + width(file.name, 13, 'F2') + 10;
    rrect(cx, y - 3.5, cw, 14, 2, C.okBg, C.okLine); text(cx + 6, y + 0.5, chip, 7.2, { font: 'F2', color: C.ok });
    y -= 16;
    rect(M, y - 24, R - M, 24, C.head); line(M, y, R, y, C.line, 0.8); line(M, y - 24, R, y - 24, C.headline, 1.4);
    const col = { n: M + 12, p: M + 36, r: M + 232, u: M + 296, g: M + 366 };
    const th = (xx, s) => text(xx, y - 15.5, s, 7.6, { font: 'F2', color: '#3b4560', cs: 0.6 });
    th(col.n, '#'); th(col.p, 'TEST PARAMETER'); th(col.r, 'RESULT'); th(col.u, 'UNIT'); th(col.g, 'REFERENCE RANGE');
    right(R - 12, y - 15.5, 'FLAG', 7.6, { font: 'F2', color: '#3b4560', cs: 0.6 });
    y -= 24;
    const rangeTxt = (p) => (p.low == null ? 'Refer note' : p.low === 0 ? '< ' + p.high : p.low + ' - ' + p.high);
    const flag = (p) => (p.status === 'normal' ? 'Normal' : p.status === 'abnormal' ? (p.dir === 'low' ? 'Low' : 'High') : (p.dir === 'low' ? 'Borderline low' : 'Borderline high'));
    params.forEach((p, i) => {
      const yy = y - 18, c = C[p.status] || C.text;
      text(col.n, yy, String(i + 1), 9.5, { font: 'F2', color: C.faint });
      text(col.p, yy, p.name, 10, { font: 'F2', color: C.text });
      text(col.r, yy, String(p.value), 10, { font: 'F2', color: c });
      text(col.u, yy, p.unit, 9, { color: C.muted });
      text(col.g, yy, rangeTxt(p), 9.2, { color: C.text });
      right(R - 12, yy, flag(p), 9, { font: 'F2', color: c });
      y -= 28; line(M, y, R, y, C.rowline, 0.7);
    });

    /* ---------- notes + summary boxes ---------- */
    const bad = params.filter((p) => p.status !== 'normal');
    const notes = (bad.length ? bad.map((p) => `${p.name} is ${flag(p).toLowerCase()} (${p.value} ${asc(p.unit)}).`) : ['All values are within the reference range.'])
      .concat(['Values outside the range do not always mean illness - please discuss them with your doctor.', 'Fasting status and medicines can affect some results.']);
    const noteLines = []; notes.forEach((n) => wrap(n, 8.8, bwid - 40).forEach((l, i) => noteLines.push([l, i === 0])));
    const nb = Math.max(118, 44 + noteLines.length * 12.5), ntop = y - 22;
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

    /* ---------- footer ---------- */
    const fy = Math.max(ntop - nb - 26, 72); // right under the boxes, like the invoice
    line(M, fy, R, fy, C.rowline, 0.8);
    center(W / 2, fy - 18, [['This is a computer-generated report, electronically verified by the pathologist, and does not require a physical signature.', 8.2, { color: C.faint }]]);
    center(W / 2, fy - 33, [['Thank you for choosing ', 8.2, { color: C.faint }], ['BeyondSure Healthcare', 8.2, { font: 'F2', color: C.muted }], [' for your diagnostic and health needs.', 8.2, { color: C.faint }]]);
    text(M, 30, 'Demo report generated from sample data', 7, { color: C.faint });
    right(R, 30, 'Page 1 of 1', 7, { color: C.faint });

    /* ---------- assemble the PDF (ASCII only, so string length = byte length) ---------- */
    const stream = ops.join('\n');
    const font = (name) => `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`;
    const objs = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R /F4 8 0 R >> >> /Contents 4 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      font('Helvetica'), font('Helvetica-Bold'), font('Times-Bold'), font('Times-Roman'),
      `<< /Title ${pdfStr(file.name + ' - ' + (mem.name || ''))} /Author ${pdfStr(lab.name || 'Partner Lab')} /Creator (BeyondSure Lab Tests) >>`
    ];
    let out = '%PDF-1.4\n';
    const offsets = objs.map((o, i) => { const at = out.length; out += `${i + 1} 0 obj\n${o}\nendobj\n`; return at; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`;
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
          <b>${U.esc(f.fileName)}</b><small>PDF · ${kb(f.size)}</small>
          <p>Your phone opens PDF reports in its own viewer. Tap <b>Open report</b> to read it, or download it to keep a copy.</p></div>`;
    const md = U.modal.open({ title: f.name, sub: o.sub || 'PDF report shared by the lab', size: 'xl',
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

  LT.reportPdf = { build, asc, fileUrl, view, download, openTab, inlinePdf, kb };
})();
