(() => {
  const root = document.documentElement;
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ── mobile nav ──
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  if (header && toggle) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // ── terrain gate: motion allowed + WebGL2 + not on Save-Data ──
  const canvas = document.getElementById('terrain');
  const saveData = navigator.connection && navigator.connection.saveData;
  const wantsTerrain = canvas && !saveData && matchMedia('(prefers-reduced-motion: no-preference)').matches && (() => {
    try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
  })();
  if (wantsTerrain) {
    root.classList.add('has-terrain');
    import('/terrain.js').catch(err => {
      console.warn('[terrain] falling back to static contours', err);
      root.classList.remove('has-terrain'); root.classList.add('no-terrain');
    });
  } else if (canvas) {
    root.classList.add('no-terrain');
    canvas.remove();
  }

  // ── reveal-on-view (survey rules, contour draw) ──
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('drawn'); reveal.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.survey-rule').forEach(r => {
    r.innerHTML = '<svg viewBox="0 0 100 9" preserveAspectRatio="none" aria-hidden="true"><line class="base" x1="0" y1="8.5" x2="100" y2="8.5" pathLength="1"/>' +
      [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100].map((x, i) => `<line class="tick" style="--i:${i}" x1="${x}" y1="${i % 4 === 0 ? 0 : 4}" x2="${x}" y2="8.5"/>`).join('') + '</svg>';
    reveal.observe(r);
  });

  // ── inject real DEM contours where asked ──
  const slots = document.querySelectorAll('[data-contours]');
  if (slots.length) {
    fetch('/assets/terrain/cooma-contours.svg').then(r => r.text()).then(svg => {
      slots.forEach(s => {
        s.insertAdjacentHTML('afterbegin', svg);
        const el = s.querySelector('svg'); el.setAttribute('aria-hidden', 'true'); el.setAttribute('focusable', 'false');
        if (s.dataset.contours === 'fit') el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        // static fallback: scale bar from the sliced contour sheet (1012 units ≈ 31.2 km)
        const sb = s.closest('.hero') && document.querySelector('.sb-bar');
        if (sb && root.classList.contains('no-terrain')) {
          const fit = () => { const r = s.getBoundingClientRect(); const pxPerKm = Math.max(r.width / 1012, r.height / 628) * (1024 / 31.6);
            sb.style.width = `${Math.round(pxPerKm * 2)}px`; document.querySelector('.sb-label').textContent = '2 km'; };
          fit(); addEventListener('resize', fit);
        }
        const frame = s.closest('.map-frame.draw');
        if (frame) reveal.observe(frame);
      });
    }).catch(() => {});
  }

  // ── enquiry form (Formspree, mailto fallback) ──
  const form = document.getElementById('enquiry-form');
  if (form) {
    const params = new URLSearchParams(location.search);
    const pre = params.get('route');
    if (pre) { const r = form.querySelector(`input[name="route"][value="${CSS.escape(pre)}"]`); if (r) r.checked = true; }

    const status = form.querySelector('.form-status');
    const btn = form.querySelector('button[type="submit"]');
    const show = (msg, kind) => { status.textContent = msg; status.className = `form-status show ${kind}`; status.focus(); };
    const setErr = (field, msg) => {
      const input = form.elements[field]; const err = form.querySelector(`#${field}-err`);
      if (input && input.setAttribute) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(form);
      let ok = true;
      ['name', 'email', 'message'].forEach(f => setErr(f, ''));
      if (!String(data.get('name') || '').trim()) { setErr('name', 'Add your name so we know who to reply to.'); ok = false; }
      const email = String(data.get('email') || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Enter an email address we can reply to, like name@company.com.au.'); ok = false; }
      if (String(data.get('message') || '').trim().length < 10) { setErr('message', 'Tell us a little more: a sentence or two is plenty.'); ok = false; }
      if (!ok) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }

      const routeLabel = form.querySelector('input[name="route"]:checked')?.dataset.label || 'General enquiry';
      data.set('_subject', `MONARO8 enquiry: ${routeLabel}`);
      const endpoint = form.dataset.endpoint;

      if (!endpoint) {
        const body = `${data.get('message')}\n\n${data.get('name')}${data.get('organisation') ? ', ' + data.get('organisation') : ''}\n${email}`;
        location.href = `mailto:hello@monaro8.com.au?subject=${encodeURIComponent(data.get('_subject'))}&body=${encodeURIComponent(body)}`;
        show('Your email app should open with the enquiry ready to send. If it doesn’t, write to hello@monaro8.com.au.', 'ok');
        return;
      }

      btn.disabled = true; btn.querySelector('.btn-text').textContent = 'Sending…';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        show('Sent. We read every enquiry and reply within one business day.', 'ok');
      } catch {
        show('That didn’t send, and nothing was lost: your words are still in the form. Try again, or email hello@monaro8.com.au directly.', 'bad');
      } finally {
        btn.disabled = false; btn.querySelector('.btn-text').textContent = 'Send';
      }
    });
  }
})();
