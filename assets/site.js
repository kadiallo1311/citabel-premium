/* CITABEL — site behavior
   - Bilingual FR/EN switcher (stored in localStorage)
   - IntersectionObserver scroll reveals
   - Counter animation when stats appear
   - Hero canvas: animated geometric pattern (default)
*/

(function () {
  /* -------- language switcher -------- */
  const STORE_KEY = 'citabel.lang';
  const initialLang = localStorage.getItem(STORE_KEY) || 'fr';

  function applyLang(lang){
    document.documentElement.lang = lang;
    document.body.dataset.lang = lang;
    document.querySelectorAll('[data-fr][data-en]').forEach(el => {
      el.textContent = el.getAttribute('data-' + lang);
    });
    document.querySelectorAll('.lang button').forEach(b => {
      b.classList.toggle('is-on', b.dataset.lang === lang);
    });
    localStorage.setItem(STORE_KEY, lang);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.lang button');
    if (b) applyLang(b.dataset.lang);
  });
  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  onReady(() => applyLang(initialLang));

  /* -------- reveal on scroll -------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

  function revealVisible(){
    const vh = window.innerHeight || 800;
    document.querySelectorAll('.rv:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh - 40 && r.bottom > 0) el.classList.add('in');
    });
  }

  onReady(() => {
    document.querySelectorAll('.rv').forEach(el => io.observe(el));
    revealVisible();
    window.addEventListener('scroll', revealVisible, { passive: true });
    window.addEventListener('resize', revealVisible);
    initCounters();
    initHero();
  });

  /* -------- counters -------- */
  function initCounters(){
    const counters = document.querySelectorAll('[data-count]');
    const cobs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const dur = 1800;
        const t0 = performance.now();
        const fmt = (v) => prefix + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('fr-FR')) + suffix;
        function tick(now){
          const t = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = fmt(target * eased);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cobs.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => cobs.observe(c));
  }

  /* -------- hero: animated pattern -------- */
  const HERO_KEY = 'citabel.hero';
  const heroMode = () => localStorage.getItem(HERO_KEY) || 'pattern';

  function initHero(){
    const host = document.querySelector('[data-hero]');
    if (!host) return;
    renderHero(host, heroMode());
  }

  function renderHero(host, mode){
    host.innerHTML = '';
    host.dataset.mode = mode;
    if (mode === 'gradient') renderGradient(host);
    else if (mode === 'video') renderVideoPlaceholder(host);
    else renderPattern(host);
  }
  window.__citabelSetHero = (mode) => {
    localStorage.setItem(HERO_KEY, mode);
    const host = document.querySelector('[data-hero]');
    if (host) renderHero(host, mode);
  };
  window.__citabelGetHero = heroMode;

  /* PATTERN: animated isometric grid with traveling lights */
  function renderPattern(host){
    const cv = document.createElement('canvas');
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W=0, H=0, dpr= Math.min(2, window.devicePixelRatio || 1);
    function size(){
      const r = host.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W*dpr; cv.height = H*dpr; cv.style.width=W+'px'; cv.style.height=H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    size(); window.addEventListener('resize', size);

    const step = 56;
    const dots = [];
    function rebuildDots(){
      dots.length = 0;
      for (let y=-step; y<H+step; y+= step*0.866){
        const off = (Math.round(y/(step*0.866)) % 2) * (step/2);
        for (let x=-step; x<W+step; x+= step){
          dots.push({ x: x+off, y, ph: Math.random()*Math.PI*2 });
        }
      }
    }
    rebuildDots();
    window.addEventListener('resize', rebuildDots);

    let t0 = performance.now();
    function draw(now){
      const t = (now - t0) / 1000;
      ctx.clearRect(0,0,W,H);
      const g = ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,'#1A1A14'); g.addColorStop(1,'#0A0A07');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      const cx = W*0.7 + Math.sin(t*0.3)*40, cy = H*0.4 + Math.cos(t*0.4)*30;
      const rg = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*0.6);
      rg.addColorStop(0,'rgba(92,130,112,0.35)'); rg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);
      for (const d of dots){
        const pulse = 0.5 + 0.5*Math.sin(t*0.9 + d.ph + d.x*0.005 + d.y*0.004);
        const r = 1 + pulse*1.6;
        ctx.fillStyle = `rgba(220,215,195,${0.10 + pulse*0.35})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI*2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(200,84,26,.7)';
      ctx.lineWidth = 1;
      const sweepY = ((t*60) % (H+200)) - 100;
      ctx.beginPath(); ctx.moveTo(0,sweepY); ctx.lineTo(W,sweepY-40); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,237,227,.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const cxR = W*0.78, cyR = H*0.55;
      const sz = Math.min(W,H)*0.18;
      const rot = t*0.2;
      for (let i=0;i<3;i++){
        const a = rot + i*Math.PI*2/3;
        const x = cxR + Math.cos(a)*sz;
        const y = cyR + Math.sin(a)*sz;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath(); ctx.stroke();
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* GRADIENT */
  function renderGradient(host){
    const el = document.createElement('div');
    el.className = 'visual-fill hero-grad';
    el.innerHTML = `
      <div class="hero-grad__blob hero-grad__a"></div>
      <div class="hero-grad__blob hero-grad__b"></div>
      <div class="hero-grad__blob hero-grad__c"></div>
      <div class="hero-grad__grain"></div>
    `;
    host.appendChild(el);
    if (!document.getElementById('hero-grad-css')){
      const css = document.createElement('style');
      css.id = 'hero-grad-css';
      css.textContent = `
        .hero-grad{background:#0F1410; overflow:hidden}
        .hero-grad__blob{position:absolute; width:70%; aspect-ratio:1; border-radius:50%; filter: blur(60px); mix-blend-mode: screen; opacity:.85;}
        .hero-grad__a{ background: radial-gradient(circle, #5C8270, transparent 70%); top:-10%; left:-10%; animation: floatA 18s ease-in-out infinite alternate; }
        .hero-grad__b{ background: radial-gradient(circle, #2D4A3E, transparent 70%); bottom:-20%; right:-10%; animation: floatB 22s ease-in-out infinite alternate; }
        .hero-grad__c{ background: radial-gradient(circle, #C8541A, transparent 70%); top:30%; left:40%; width:50%; opacity:.4; animation: floatC 26s ease-in-out infinite alternate; }
        .hero-grad__grain{position:absolute; inset:0; background-image: radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px); background-size: 3px 3px; mix-blend-mode: overlay; opacity:.4 }
        @keyframes floatA { to { transform: translate(20%, 15%) scale(1.2) } }
        @keyframes floatB { to { transform: translate(-15%, -20%) scale(1.1) } }
        @keyframes floatC { to { transform: translate(-25%, 30%) scale(1.3) } }
      `;
      document.head.appendChild(css);
    }
  }

  /* VIDEO placeholder */
  function renderVideoPlaceholder(host){
    const el = document.createElement('div');
    el.className = 'visual-fill hero-video';
    el.innerHTML = `
      <div class="hero-video__bg"></div>
      <div class="hero-video__scan"></div>
      <div class="hero-video__chrome">
        <span class="hero-video__rec"></span>
        <span class="hero-video__lbl">VIDEO • CITABEL FACTORY FLOOR — 00:00 / 02:34</span>
      </div>
      <div class="hero-video__play">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
      </div>
    `;
    host.appendChild(el);
    if (!document.getElementById('hero-video-css')){
      const css = document.createElement('style');
      css.id = 'hero-video-css';
      css.textContent = `
        .hero-video{background:#0A0A07; overflow:hidden; display:grid; place-items:center}
        .hero-video__bg{position:absolute; inset:0; background:
          radial-gradient(120% 80% at 30% 30%, #2A2A22 0%, transparent 60%),
          radial-gradient(120% 80% at 80% 80%, #1A1A12 0%, transparent 60%),
          #0A0A07;
          animation: vidpan 14s ease-in-out infinite alternate;
        }
        @keyframes vidpan { to { transform: scale(1.06) translate(-2%, 1%) } }
        .hero-video__scan{position:absolute; inset:0; background: repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 4px); pointer-events:none}
        .hero-video__chrome{position:absolute; top:18px; left:18px; display:flex; align-items:center; gap:10px; font-family: var(--mono); font-size:10px; letter-spacing:.16em; color:rgba(240,237,227,.7); text-transform:uppercase}
        .hero-video__rec{width:8px; height:8px; border-radius:50%; background:#C8541A; animation: blink 1.2s ease-in-out infinite}
        @keyframes blink { 50% { opacity: .25 } }
        .hero-video__play{
          width: 84px; height: 84px; border-radius:50%;
          border:1px solid rgba(240,237,227,.4);
          display:grid; place-items:center;
          color: #F0EDE3;
          backdrop-filter: blur(6px);
          background: rgba(240,237,227,.08);
          transition: transform .25s var(--ease);
        }
        .hero-video__play:hover{ transform: scale(1.08) }
        .hero-video__play svg{ width:32px; height:32px }
      `;
      document.head.appendChild(css);
    }
  }

})();
