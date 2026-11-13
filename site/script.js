/* Tropical Implantes — interações */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Título do hero: entra palavra por palavra ---------- */
  const title = $('[data-split]');
  if (title) {
    let i = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--wd', `${0.15 + i++ * 0.07}s`);
            w.append(inner);
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrap(child);
        }
      });
    };
    wrap(title);
    requestAnimationFrame(() => requestAnimationFrame(() => title.classList.add('is-in')));
  }

  /* ---------- Revelar ao rolar ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Contadores ---------- */
  const fmt = (n, dec) => n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = fmt(target, dec) + suffix; return; }
    const dur = 1800;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * eased, dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  } else counters.forEach(runCount);

  /* ---------- Header, progresso, menu ativo, botão flutuante ---------- */
  const header = $('.site-header');
  const bar = $('.scroll-progress span');
  const wa = $('.wa-float');
  const hero = $('.hero');
  const navLinks = $$('.main-nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  let lastY = window.scrollY;
  let ticking = false;

  const arch = $('.arch img');

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    header.classList.toggle('is-scrolled', y > 40);
    const goingDown = y > lastY;
    header.classList.toggle('is-hidden', goingDown && y > window.innerHeight * 0.9 && !root.classList.contains('menu-open'));
    lastY = y;

    wa.classList.toggle('is-visible', y > (hero ? hero.offsetHeight * 0.6 : 400));

    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) current = s; });
    navLinks.forEach((a) => a.classList.toggle('is-active', current && a.getAttribute('href') === `#${current.id}`));

    if (arch && !reduceMotion) {
      const r = arch.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        arch.style.setProperty('--py', `${Math.max(-4, Math.min(4, p * 8)).toFixed(2)}%`);
      }
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Menu móvel ---------- */
  const toggle = $('.menu-toggle');
  const menu = $('#menu-mobile');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (open) menu.hidden = false;
  };
  toggle.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 960) setMenu(false); });

  /* ---------- FAQ ---------- */
  $$('.acc-item').forEach((item) => {
    const btn = $('.acc-btn', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      $$('.acc-item.is-open').forEach((o) => { o.classList.remove('is-open'); $('.acc-btn', o).setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Cards preenchem o tratamento no formulário ---------- */
  const select = $('#f-trat');
  $$('[data-treatment]').forEach((a) => {
    a.addEventListener('click', () => {
      const wanted = a.dataset.treatment;
      const opt = [...select.options].find((o) => o.text === wanted);
      if (opt) {
        select.value = opt.value;
        setTimeout(() => {
          select.classList.remove('is-flash');
          void select.offsetWidth;
          select.classList.add('is-flash');
        }, 700);
      }
    });
  });

  /* ---------- Formulário → WhatsApp ---------- */
  const form = $('#form-contato');
  const err = $('.form-error', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nome = (data.get('nome') || '').toString().trim();
    const tel = (data.get('telefone') || '').toString().trim();
    $('#f-nome').parentElement.classList.toggle('is-invalid', !nome);
    $('#f-tel').parentElement.classList.toggle('is-invalid', !tel);
    if (!nome || !tel) { err.hidden = false; (nome ? $('#f-tel') : $('#f-nome')).focus(); return; }
    err.hidden = true;

    const lines = [
      `Olá! Meu nome é ${nome} e gostaria de agendar uma avaliação.`,
      `Tratamento de interesse: ${data.get('tratamento')}`,
      `Telefone: ${tel}`,
    ];
    const email = (data.get('email') || '').toString().trim();
    const msg = (data.get('mensagem') || '').toString().trim();
    if (email) lines.push(`E-mail: ${email}`);
    if (msg) lines.push('', msg);
    window.open(`https://wa.me/5551980817777?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  });

  /* ---------- Chuva da tarde ---------- */
  const rain = $('.rain');
  if (rain && !reduceMotion) {
    const drops = window.innerWidth < 640 ? 34 : 70;
    for (let i = 0; i < drops; i++) {
      const d = document.createElement('i');
      d.style.left = `${Math.random() * 130}%`;
      d.style.setProperty('--h', `${40 + Math.random() * 70}px`);
      d.style.setProperty('--t', `${0.9 + Math.random() * 0.9}s`);
      d.style.setProperty('--dl', `${-Math.random() * 2}s`);
      d.style.opacity = (0.25 + Math.random() * 0.6).toFixed(2);
      rain.append(d);
    }
  }

  /* ---------- Ano no rodapé ---------- */
  const ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* =========================================================
     Hero: "Encontro das Águas"
     Duas correntes de linhas correm lado a lado, encostam
     uma na outra numa costura sinuosa e não se misturam.
     ========================================================= */
  const canvas = $('.hero-waters');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, running = true, t = 0, raf = 0;
  const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

  // Rio escuro (verde-chá) e rio barrento (argila/dourado), da paleta da marca
  const DARK = [[165, 186, 149], [192, 207, 178], [88, 129, 87]];
  const SANDY = [[200, 165, 90], [160, 122, 92], [230, 207, 152]];

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const seamY = (x, time) => {
    const base = H * (W < 700 ? 0.7 : 0.74);
    const tilt = (x / W - 0.5) * -H * 0.14;
    return base + tilt + Math.sin(x * 0.0024 + time * 0.35) * 22 + Math.sin(x * 0.0061 - time * 0.22) * 9;
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const perSide = W < 700 ? 9 : 15;
    const step = W < 700 ? 10 : 8;

    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;

    for (let side = -1; side <= 1; side += 2) {
      const palette = side < 0 ? DARK : SANDY;
      for (let i = 0; i < perSide; i++) {
        const k = i + 1;
        // linhas mais juntas perto da costura, abrindo para longe dela
        const offset = side * (6 + Math.pow(k, 1.35) * (W < 700 ? 7 : 9));
        const amp = 3 + k * 1.6;
        const freq = 0.004 + (i % 4) * 0.0009;
        const speed = side < 0 ? 0.55 : 0.4; // as águas correm em velocidades diferentes
        const phase = i * 0.7 + (side < 0 ? 0 : 2);
        const c = palette[i % palette.length];
        const alpha = Math.max(0.05, 0.42 - k * (0.36 / perSide));

        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += step) {
          let y = seamY(x, t) + offset + Math.sin(x * freq + t * speed + phase) * amp;
          // as linhas desviam do cursor, como água contornando a mão
          const dx = x - pointer.x, dy = y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 40000) {
            const f = Math.exp(-d2 / 9000);
            y += (dy >= 0 ? 1 : -1) * f * 26;
          }
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
        ctx.lineWidth = k < 3 ? 1.4 : 1;
        ctx.stroke();
      }
    }

    // a costura brilhante onde as águas se encontram
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(230,207,152,0)');
    g.addColorStop(0.3, 'rgba(230,207,152,.55)');
    g.addColorStop(0.7, 'rgba(230,207,152,.55)');
    g.addColorStop(1, 'rgba(230,207,152,0)');
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += step) {
      const y = seamY(x, t);
      if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(230,207,152,.6)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // reflexos de luz flutuando na água
    for (let i = 0; i < 14; i++) {
      const x = ((i * 137.5 + t * (18 + (i % 3) * 6)) % (W + 80)) - 40;
      const y = seamY(x, t) + (i % 2 ? 1 : -1) * (14 + (i * 23) % 90);
      const a = 0.25 + 0.25 * Math.sin(t * 1.4 + i);
      ctx.fillStyle = `rgba(250,249,246,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const loop = () => {
    t += 0.016;
    draw();
    if (running) raf = requestAnimationFrame(loop);
  };

  resize();
  window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(); });

  if (reduceMotion) {
    t = 2; draw();
  } else {
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = e.clientX - r.left;
      pointer.ty = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = -9999; });

    // só anima enquanto o hero está visível e a aba está ativa
    const vis = new IntersectionObserver(([e]) => {
      const should = e.isIntersecting && !document.hidden;
      if (should && !running) { running = true; loop(); }
      if (!should) { running = false; cancelAnimationFrame(raf); }
    });
    vis.observe(hero);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (hero.getBoundingClientRect().bottom > 0 && !running) { running = true; loop(); }
    });
    loop();
  }
})();
