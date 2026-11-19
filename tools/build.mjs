#!/usr/bin/env node
// MONARO8 site build. No dependencies.
//   node tools/build.mjs            rebuild every page from tools/data/*.json
//   node tools/build.mjs --no-git   skip counting commits in the local venture repos (use tools/data/stats.json)
//
// Writes: index.html, ventures/index.html, thesis/index.html, contact/index.html,
//         llms.txt, sitemap.xml, tools/data/stats.json
// Hand-edited and not generated: styles.css, script.js, terrain.js, tools/pages/*.html (Thesis/Contact copy).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = p => JSON.parse(read(p));
const write = (p, s) => { const f = path.join(ROOT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('wrote', p); };

const { ventures } = json('tools/data/ventures.json');
const ledger = json('tools/data/ledger.json');
const pipeline = json('tools/data/pipeline.json');
const dem = json('assets/terrain/cooma-dem.json');
const byId = Object.fromEntries(ventures.map(v => [v.id, v]));

// ── formatting ───────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => esc(s).replace(/"/g, '&quot;');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = iso => { const [y, m, d] = iso.split('-'); return `${d} ${MON[+m - 1]} ${y}`; };
const dayShort = iso => { const [, m, d] = iso.split('-'); return `${+d} ${MON[+m - 1]}`; };
const num = n => n.toLocaleString('en-AU');
const lat = v => `${Math.abs(v).toFixed(4)}° ${v < 0 ? 'S' : 'N'}`;
const lon = v => `${Math.abs(v).toFixed(4)}° ${v < 0 ? 'W' : 'E'}`;
const elev = v => `${num(v)} M`;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = n => WORDS[n] ?? String(n);
const cap = s => s[0].toUpperCase() + s.slice(1);
const STAGE = { live: 'Live', beta: 'Beta', early: 'Early access' };

const ICON = {
  right: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>',
  down: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v11M4 9l4 4 4-4"/></svg>',
  out: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12L12 4M6 4h6v6"/></svg>',
};

// ── stats from git (cached in stats.json) ────────
const statsFile = 'tools/data/stats.json';
const cached = fs.existsSync(path.join(ROOT, statsFile)) ? json(statsFile) : { ventures: {} };
const useGit = !process.argv.includes('--no-git');
const today = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
const stats = { asOf: cached.asOf || today, ventures: { ...cached.ventures } };
let gitTouched = false;
for (const v of ventures) {
  if (!useGit || !v.repo) continue;
  const repo = v.repo.replace(/^~/, os.homedir());
  if (!fs.existsSync(path.join(repo, '.git'))) continue;
  try {
    const commits = +execFileSync('git', ['-C', repo, 'rev-list', '--count', 'HEAD']).toString().trim();
    const first = execFileSync('git', ['-C', repo, 'log', '--reverse', '--format=%ad', '--date=short']).toString().split('\n')[0];
    stats.ventures[v.id] = { commits, first };
    gitTouched = true;
  } catch { /* keep cached */ }
}
if (gitTouched) stats.asOf = today;
write(statsFile, JSON.stringify(stats, null, 2) + '\n');

const S = id => stats.ventures[id] || {};
const commitTotal = ventures.reduce((a, v) => a + (S(v.id).commits || 0), 0);
const firstDates = ventures.map(v => S(v.id).first).filter(Boolean).sort();
const commitRange = firstDates.length ? `${dayShort(firstDates[0])} ${firstDates[0].slice(0, 4)} – ${day(stats.asOf)}` : '';
const counts = { live: 0, beta: 0, early: 0 };
ventures.forEach(v => counts[v.stage]++);
const stageSentence = [counts.live && `${word(counts.live)} live`, counts.beta && `${word(counts.beta)} in beta`, counts.early && `${word(counts.early)} in early access`].filter(Boolean)
  .reduce((acc, s, i, a) => acc + (i === 0 ? s : i === a.length - 1 ? ` and ${s}` : `, ${s}`), '');
const stageShort = [counts.live && `${counts.live} live`, counts.beta && `${counts.beta} beta`, counts.early && `${counts.early} early access`].filter(Boolean).join(' · ');
const N = ventures.length;
const names = ventures.map(v => v.name);
const nameList = names.slice(0, -1).join(', ') + ' and ' + names.at(-1);

// ── map projection (DEM sheet → % on the 2D survey map) ──
const mercY = d => Math.log(Math.tan(Math.PI / 4 + d * Math.PI / 360));
const toUV = (la, lo) => [(lo - dem.bounds.west) / (dem.bounds.east - dem.bounds.west), (mercY(dem.bounds.north) - mercY(la)) / (mercY(dem.bounds.north) - mercY(dem.bounds.south))];
const mapPos = (la, lo) => { const [u, v] = toUV(la, lo); return [((u * 1024 - 6) / 1012 * 100).toFixed(2), ((v * 640 - 6) / 628 * 100).toFixed(2)]; };

// ── shared chrome ────────────────────────────────
const SITE = 'https://monaro8.com.au';
const NAV = [['/ventures/', 'Ventures'], ['/thesis/', 'How we work'], ['/contact/', 'Contact']];
const FOOTER_SITE = [['/ventures/', 'Ventures'], ['/thesis/', 'How we work'], ['/advisory/', 'Advisory'], ['/contact/', 'Contact']];

function head({ title, desc, path: p, og, ld, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-3DNY38GVPV"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-3DNY38GVPV');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${attr(desc)}">
<meta name="theme-color" content="#111312">

<meta property="og:type" content="website">
<meta property="og:site_name" content="MONARO8">
<meta property="og:locale" content="en_AU">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${SITE}${p}">
<meta property="og:image" content="${SITE}/og/${og}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og/${og}.png">

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="canonical" href="${SITE}${p}">
<link rel="preload" href="/assets/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
${extraHead}
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
</head>
<body>

<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
  <div class="wrap header-inner">
    <a class="wordmark" href="/" aria-label="MONARO8 home">MONARO<b>8</b></a>
    <div class="coord-badge mono" aria-hidden="true" data-live="false">
      <span class="coord-src"></span><span class="lat">36.2355° S</span><span class="lon">149.1257° E</span><span class="elev">795 M</span>
    </div>
    <nav class="site-nav" id="primary-nav" aria-label="Primary">
${NAV.map(([h, l]) => `      <a href="${h}"${h === p ? ' aria-current="page"' : ''}>${l}</a>`).join('\n')}
    </nav>
    <button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Menu"><i></i>Menu</button>
  </div>
</header>
`;
}

const footer = () => `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div><a class="wordmark" href="/">MONARO<b>8</b></a><span>Independent venture builder</span><span class="mono">36.2355° S 149.1257° E</span></div>
      <div><span class="label">Site</span>${FOOTER_SITE.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</div>
      <div><span class="label">Ventures</span>${ventures.map(v => `<a href="${v.url}" rel="noopener">${esc(v.name)}</a>`).join('')}</div>
      <div><span class="label">Contact</span><a href="mailto:hello@monaro8.com.au">hello@monaro8.com.au</a><span>Cooma NSW 2630</span><a href="https://olivermoran.com.au" rel="noopener">olivermoran.com.au</a></div>
    </div>
    <div class="footer-base mono"><span>© <span id="year">${today.slice(0, 4)}</span> MONARO8, a registered business name of Open County Pty Ltd</span><span>ABN 19 679 154 557</span></div>
  </div>
</footer>

<script src="/script.js"></script>
</body>
</html>
`;

const page = (opts, body) => head(opts) + `\n<main id="main">\n${body}\n</main>\n` + footer();

const pageHero = (h1, lede, meta) => `
  <section class="page-hero" aria-labelledby="page-title">
    <div class="contours contours--dark" data-contours></div>
    <div class="wrap">
      <h1 id="page-title">${h1}</h1>
      <p class="hero-lede">${lede}</p>
      <div class="ph-meta">${meta.map(([cls, t]) => `<span class="${cls}">${t}</span>`).join('')}</div>
    </div>
  </section>
`;

const orgLd = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'MONARO8',
  legalName: 'Open County Pty Ltd',
  url: `${SITE}/`,
  logo: `${SITE}/favicon.svg`,
  image: `${SITE}/og/home.png`,
  description: 'Independent venture builder in Cooma, Snowy Monaro, NSW. MONARO8 finds what wastes people’s time and builds software businesses that fix it.',
  email: 'hello@monaro8.com.au',
  taxID: '19 679 154 557',
  founder: { '@id': `${SITE}/thesis/#oliver-moran` },
  address: { '@type': 'PostalAddress', addressLocality: 'Cooma', addressRegion: 'NSW', postalCode: '2630', addressCountry: 'AU' },
  location: { '@type': 'Place', name: 'Cooma, Snowy Monaro', geo: { '@type': 'GeoCoordinates', latitude: -36.2355, longitude: 149.1257, elevation: '795 m' } },
  areaServed: [{ '@type': 'City', name: 'Canberra' }, { '@type': 'State', name: 'New South Wales' }, { '@type': 'Country', name: 'Australia' }],
  sameAs: ['https://olivermoran.com.au'],
};
const venturesList = {
  '@type': 'ItemList',
  '@id': `${SITE}/ventures/#list`,
  name: 'Ventures built by MONARO8',
  itemListElement: ventures.map((v, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'WebSite', name: v.name, url: v.url, description: v.card, creator: { '@id': `${SITE}/#organization` } } })),
};

// ── ON THE BENCH (pipeline) ──────────────────────
const STATUS = { idea: 'Idea', exploring: 'Exploring', building: 'Building' };
function benchSection() {
  if (!pipeline.show) return '';
  const groups = pipeline.groups.map(g => ({ ...g, items: pipeline.items.filter(i => i.group === g.id) })).filter(g => g.items.length);
  return `
  <section class="sheet section" id="bench" aria-labelledby="bench-title">
    <div class="wrap">
      <div class="survey-rule"></div>
      <div class="section-head">
        <h2 id="bench-title">On the bench</h2>
        <p>What’s being tried, built or thought about next. Some of it will ship, some won’t.</p>
      </div>
      <div class="bench">
${groups.map(g => `        <div class="bench-group">
          <h3>${esc(g.title)}</h3>
          <ul>
${g.items.map(i => `            <li><span class="bench-status label" data-status="${i.status}">${STATUS[i.status] || esc(i.status)}</span><div><strong>${esc(i.title)}</strong>${i.venture && byId[i.venture] ? ` <span class="bench-v mono">${esc(byId[i.venture].name)}</span>` : ''}<p>${esc(i.text)}</p></div></li>`).join('\n')}
          </ul>
        </div>`).join('\n')}
      </div>
    </div>
  </section>
`;
}

// ── HOME ─────────────────────────────────────────
function wpFrame(v, wide) {
  const st = S(v.id);
  return `
          <a class="wp-frame${wide ? ' wp-frame--wide' : ''}" href="${v.url}" data-focus="${v.id}" target="_blank" rel="noopener">
            <div class="wf-top mono"><span class="wf-id">WP ${v.wp}</span><span class="label">${esc(v.category)}</span><span class="wf-stage label" data-stage="${v.stage}">${STAGE[v.stage]}</span></div>
            <figure><img src="/assets/ventures/${v.id}.webp" alt="${attr(v.alt)}" width="1200" height="750" loading="lazy" decoding="async"></figure>
            <div class="wf-body">
              <h3>${esc(v.name)}</h3>
              <p>${esc(v.card)}</p>
              <span class="go">${v.domain}${ICON.out}</span>
            </div>
            <div class="wf-foot mono"><span>${v.code ? v.code + ' ' : ''}${lat(v.lat)} ${lon(v.lon)}</span><span>${elev(v.elev)}</span></div>
          </a>`;
}

function home() {
  const markers = ventures.map(v => `  <div class="wp" data-wp="${v.id}" data-lat="${v.lat}" data-lon="${v.lon}" data-elev="${v.elev}"><span class="mono">WP ${v.wp}<b>${esc(v.name)}</b>${v.code ? v.code + ' ' : ''}${elev(v.elev)}</span></div>`).join('\n');
  const mapMarks = ventures.map(v => { const [l, t] = mapPos(v.lat, v.lon); return `              <div class="map-mark map-mark--wp" style="left:${l}%;top:${t}%"><span class="mono">WP ${v.wp}${v.code ? ' ' + v.code : ''}</span></div>`; }).join('\n');
  const [cl, ct] = mapPos(-36.2355, 149.1257);
  const rows = ledger.entries.map(e => `          <tr><td class="data">${day(e.date)}</td><td class="data"><span class="v">${esc(byId[e.venture]?.name ?? e.venture)}</span></td><td>${esc(e.text)}</td></tr>`).join('\n');
  const grid = ventures.map((v, i) => wpFrame(v, N % 2 === 1 && i === N - 1)).join('');

  const body = `
<canvas id="terrain" aria-hidden="true"></canvas>

<div class="wp-layer" aria-hidden="true">
${markers}
</div>
<div class="wp-layer datum-layer" aria-hidden="true">
  <div class="wp wp--datum" data-wp="cooma" data-lat="-36.2355" data-lon="149.1257" data-elev="795"><span class="mono">Cooma<b>MONARO8</b>795 M</span></div>
</div>
`;
  const main = `
  <section class="window hero" id="top" aria-labelledby="hero-title">
    <div class="contours contours--dark" data-contours></div>
    <div class="wrap">
      <div>
        <h1 id="hero-title">Useful software, built in&nbsp;Cooma.</h1>
        <p class="hero-lede">MONARO8 builds and runs its own web projects out of Cooma. AI tools let a small outfit build what used to take a big team, and keep the price honest. ${cap(word(N))} so far: ${stageSentence}.</p>
        <div class="hero-actions">
          <a class="btn btn-gold" href="#ventures">See the ventures <span class="arr">${ICON.down}</span></a>
          <a class="link-quiet" href="/contact/">Get in touch</a>
        </div>
      </div>

      <aside class="title-block mono" aria-label="Map details">
        <div class="tb-head">
          <span>MONARO8 · Sheet Cooma</span>
          <svg viewBox="0 0 18 22" aria-hidden="true"><path d="M9 1 L15 20 L9 15 L3 20 Z" fill="none" stroke="#C5A880"/><path d="M9 1 L9 15 L3 20 Z" fill="#C5A880"/></svg>
        </div>
        <div class="label tb-tag"><span>Independent venture builder // Snowy Monaro, NSW</span></div>
        <div><span>Datum</span><strong>36.2355° S 149.1257° E</strong></div>
        <div><span>Cooma</span><strong>795 M ASL</strong></div>
        <div><span>Sheet</span><strong>${dem.widthKm} × ${dem.heightKm} KM</strong></div>
        <div><span>Contours</span><strong>20 M · Index 100 M</strong></div>
        <div class="tb-scale"><span>Scale at Cooma</span><span class="sb"><svg class="sb-bar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 9.5H100M0 3V10M50 6V10M100 3V10"/><rect x="0" y="7.5" width="50" height="2"/></svg><span class="sb-label">5 km</span></span></div>
        <div><span class="tb-src">Elevation: SRTM via AWS Terrain Tiles</span></div>
      </aside>
    </div>
  </section>

  <section class="window ventures-home" id="ventures" aria-labelledby="ventures-title">
    <div class="wrap">
      <div class="survey-rule"></div>
      <div class="layout">
        <div class="intro">
          <h2 id="ventures-title">What’s been built so&nbsp;far.</h2>
          <p>Each one started with something that bugs people: rosters on paper, carbon questions in tenders, battery quotes by ring-around, flight status behind a login, public data nobody can find.</p>
          <a class="link-quiet" href="/ventures/">What each one does and how it’s built</a>
        </div>

        <div class="wp-grid">${grid}
        </div>
      </div>
    </div>
  </section>

  <section class="sheet section" id="ledger" aria-labelledby="ledger-title">
    <div class="wrap">
      <div class="survey-rule"></div>
      <div class="section-head">
        <h2 id="ledger-title">Studio Ledger</h2>
        <p>What we shipped, and when. Straight from the commit history.</p>
      </div>
      <table class="ledger">
        <thead class="mono"><tr><th scope="col">Date</th><th scope="col">Venture</th><th scope="col">Shipped</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>
      <div class="ledger-note mono"><span>${num(commitTotal)} commits across ${word(N)} repositories, ${commitRange}</span><span>Updated ${day(ledger.updated)}</span></div>
    </div>
  </section>

${benchSection()}
  <section class="sheet sheet--stone section" id="place" aria-labelledby="place-title">
    <div class="wrap">
      <div class="survey-rule"></div>
      <div class="place">
        <div class="place-copy">
          <h2 id="place-title">Who’s behind&nbsp;it.</h2>
          <p><strong>Oliver Moran.</strong> Fifteen years leading product teams at Qantas, IAG/NRMA, MetLife and Equifax, then Founder in Residence at Antler Singapore, and EnergyLab. Recently elected President of the Cooma Chamber of Commerce.</p>
          <p>Cooma’s a working town. People here run small businesses, work trades and drive a long way for most things. They haven’t got time for software that’s overpriced or hard to use, and neither have we.</p>
          <dl class="creds">
            <div><dt class="label">Previously</dt><dd>Qantas · IAG/NRMA · MetLife · Equifax</dd></div>
            <div><dt class="label">Programs</dt><dd>Antler Singapore · EnergyLab</dd></div>
            <div><dt class="label">Study</dt><dd>MBA (Technology &amp; Digital Strategy) · BA Informatics, University of Sydney</dd></div>
            <div><dt class="label">Community</dt><dd>President, Cooma Chamber of Commerce</dd></div>
            <div><dt class="label">Base</dt><dd>Cooma NSW 2630</dd></div>
          </dl>
          <a class="link-quiet link-ink" href="/thesis/">How we work</a>
        </div>

        <figure class="survey-map">
          <div class="map-frame draw">
            <div class="map-canvas">
              <div class="contours contours--light" data-contours="fit"></div>
              <div class="map-ticks mono" aria-hidden="true">
                <span style="left:3.6%;top:0">148.90° E</span><span class="alt" style="left:32.4%;top:0">149.00° E</span><span style="left:61.2%;top:0">149.10° E</span><span class="alt" style="left:89.9%;top:0;transform:translateX(-60%)">149.20° E</span>
                <span style="right:0;top:29.7%">36.20° S</span><span class="alt" style="right:0;top:58.4%">36.25° S</span><span style="right:0;top:87.2%">36.30° S</span>
              </div>
              <div class="map-mark" style="left:${cl}%;top:${ct}%"><span class="mono">Cooma 795 M</span></div>
${mapMarks}
            </div>
            <div class="map-legend mono">
              <span class="scale-bar"><svg viewBox="0 0 100 10" aria-hidden="true"><path d="M0 9H100M0 3V9M50 6V9M100 3V9"/><rect x="0" y="7" width="50" height="2"/></svg>5 km</span>
              <span class="key"><i></i>20 m</span>
              <span class="key"><i class="idx"></i>100 m index</span>
            </div>
          </div>
          <figcaption>Cooma and the Monaro plains rising west to the Snowy Mountains foothills. Elevation ${num(dem.min)}–${num(dem.max)} m. SRTM via AWS Terrain Tiles.</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="window closing" id="closing" aria-labelledby="closing-title">
    <div class="contours contours--dark" data-contours></div>
    <div class="wrap">
      <h2 id="closing-title">Got a problem that needs&nbsp;fixing?</h2>
      <p>Want to build something together, partner up, or ask about one of the projects? Send a short note.</p>
      <div class="hero-actions">
        <a class="btn btn-gold" href="/contact/">Get in touch <span class="arr">${ICON.right}</span></a>
      </div>
    </div>
  </section>
`;
  const importMap = `<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",
  "gsap": "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js",
  "gsap/ScrollTrigger": "https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js"
} }
</script>`;
  const html = head({
    title: 'MONARO8 | Independent venture builder, Cooma NSW',
    desc: `MONARO8 builds and runs web projects out of Cooma, NSW: ${nameList}. An independent venture builder using AI tools to do more with a small team.`,
    path: '/', og: 'home', extraHead: importMap,
    ld: { '@context': 'https://schema.org', '@graph': [orgLd, { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'MONARO8', publisher: { '@id': `${SITE}/#organization` }, inLanguage: 'en-AU' }, venturesList] },
  }) + body + `\n<main id="main">\n${main}\n</main>\n` + footer();
  write('index.html', html);
}

// ── VENTURES ─────────────────────────────────────
function venturesPage() {
  const sections = ventures.map((v, i) => {
    const st = S(v.id);
    const rows = [
      ['Waypoint', `WP ${v.wp} · ${esc(v.place)}`, ''],
      ['Position', `${lat(v.lat)} ${lon(v.lon)} · ${elev(v.elev)}`, 'mono'],
      ['Category', esc(v.category), ''],
      ['Stage', STAGE[v.stage], v.stage === 'live' ? 'stage-live' : ''],
      v.operator && ['Operator', esc(v.operator), ''],
      st.first && ['Started', day(st.first), 'mono'],
      ['Site', `<a href="${v.url}" rel="noopener">${v.domain}${ICON.out}</a>`, ''],
    ].filter(Boolean).map(([k, val, cls]) => `        <div><dt class="label">${k}</dt><dd${cls ? ` class="${cls}"` : ''}>${val}</dd></div>`).join('\n');
    return `
  <section class="${i % 2 ? 'sheet sheet--stone' : 'sheet'} venture" id="${v.id}" aria-labelledby="${v.id}-title">
    <div class="wrap venture-grid">
      <div class="venture-head">
        <h2 id="${v.id}-title">${esc(v.name)}</h2>
        <p class="tagline">${esc(v.tagline)}</p>
      </div>
      <dl class="venture-meta">
${rows}
      </dl>
      <div class="venture-body">
        <figure class="venture-plate">
          <img src="/assets/ventures/${v.id}.webp" alt="${attr(v.alt)}" width="1200" height="750" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">
          <figcaption class="mono">${v.domain} · captured ${day(v.captured || stats.asOf)}</figcaption>
        </figure>
        <dl class="venture-dl">
          <div><dt>The problem</dt><dd>${esc(v.problem)}</dd></div>
          <div><dt>The idea</dt><dd>${esc(v.thesis)}</dd></div>
          <div><dt>How it’s built</dt><dd>${esc(v.build)}</dd></div>
          <div><dt>Where it’s at</dt><dd>${esc(v.now)}</dd></div>
        </dl>
        <div class="venture-cta"><a class="btn btn-ink" href="${v.url}" rel="noopener">Visit ${esc(v.name)} <span class="arr">${ICON.out}</span></a></div>
      </div>
    </div>
  </section>`;
  }).join('');
  const body = pageHero('The projects, and what each one&nbsp;fixes.',
    'Here’s the problem behind each one, how it’s built and where it’s up to.',
    [['mono', `${N} projects`], ['mono', stageShort], ['label', 'Built in Cooma']]) + sections + `
  <section class="advisory section" aria-labelledby="v-next">
    <div class="wrap read">
      <h2 id="v-next">Working on something similar?</h2>
      <div class="prose">
        <p class="lead">If you know a problem first-hand and want to build the fix together, or your business works in one of these areas, get in touch.</p>
        <a class="btn btn-gold btn-spaced" href="/contact/?route=cobuild">Get in touch <span class="arr">${ICON.right}</span></a>
      </div>
    </div>
  </section>`;
  write('ventures/index.html', page({
    title: `Ventures | ${names.join(', ')} | MONARO8`,
    desc: `The ${word(N)} MONARO8 ventures: ${ventures.map(v => `${v.name} (${v.category.toLowerCase()})`).join(', ')}. Problem, thesis, build and stage for each.`,
    path: '/ventures/', og: 'ventures',
    ld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'MONARO8 ventures', url: `${SITE}/ventures/`, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#organization` }, mainEntity: venturesList },
  }, body));
}

// ── THESIS & CONTACT (copy lives in tools/pages/*.html) ──
const fill = s => s.replace(/\{\{commitTotal\}\}/g, num(commitTotal)).replace(/\{\{commitRange\}\}/g, commitRange)
  .replace(/\{\{ventureCount\}\}/g, cap(word(N))).replace(/\{\{ventureNames\}\}/g, esc(nameList)).replace(/\{\{iconRight\}\}/g, ICON.right);

function thesisPage() {
  const body = pageHero('Find the problem. Build the&nbsp;fix.',
    'That’s most of it. Here’s how it works in practice.',
    [['label', 'How we work'], ['label', 'Cooma NSW 2630'], ['mono', '36.2355° S 149.1257° E']]) + '\n  ' + fill(read('tools/pages/thesis.html'));
  write('thesis/index.html', page({
    title: 'How we work | MONARO8, Cooma NSW',
    desc: 'How MONARO8 picks problems and builds software to fix them, using AI tools to do more with a small team. Who’s behind it, and why Cooma.',
    path: '/thesis/', og: 'thesis',
    ld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'AboutPage', name: 'Thesis and approach', url: `${SITE}/thesis/`, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#organization` } },
      { '@type': 'Person', '@id': `${SITE}/thesis/#oliver-moran`, name: 'Oliver Moran', jobTitle: 'Founder', url: `${SITE}/thesis/`, worksFor: { '@id': `${SITE}/#organization` }, sameAs: ['https://olivermoran.com.au'],
        alumniOf: [{ '@type': 'CollegeOrUniversity', name: 'University of Sydney' }, { '@type': 'Organization', name: 'Antler' }, { '@type': 'Organization', name: 'EnergyLab' }],
        description: 'Fifteen years leading product teams at Qantas, IAG/NRMA, MetLife and Equifax. Founder in Residence at Antler Singapore, EnergyLab alumnus, President of the Cooma Chamber of Commerce. Founder of MONARO8 and ZerraLedger.',
        memberOf: { '@type': 'OrganizationRole', roleName: 'President', memberOf: { '@type': 'Organization', name: 'Cooma Chamber of Commerce' } } },
    ] },
  }, body));
}

function contactPage() {
  const body = pageHero('Get in touch.',
    'A few lines about what you’re working on is plenty. You’ll hear back within one business day.',
    [['label', 'Cooma NSW 2630'], ['label', 'Reply within one business day']]) + '\n  ' + fill(read('tools/pages/contact.html'));
  write('contact/index.html', page({
    title: 'Contact | MONARO8',
    desc: `Start an enquiry with MONARO8: venture co-build or partnership, a question about ${nameList}, or selective strategic advisory.`,
    path: '/contact/', og: 'contact',
    ld: { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact MONARO8', url: `${SITE}/contact/`, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#organization` } },
  }, body));
}

function advisoryPage() {
  const body = pageHero('Independent digital and product advice for&nbsp;Canberra.',
    'Digital strategy, AI and product leadership from someone who builds this stuff for a living. For government agencies and businesses that want an experienced person, not a big consulting firm.',
    [['label', 'Digital strategy'], ['label', 'Product leadership'], ['label', 'AI and delivery'], ['label', 'Canberra · NSW · remote']]) + '\n  ' + fill(read('tools/pages/advisory.html'));
  write('advisory/index.html', page({
    title: 'Independent digital advisory, Canberra | Digital strategy & product leadership | MONARO8',
    desc: 'Independent digital advisory for Canberra public-sector agencies and enterprises: digital strategy, AI strategy, platform decisions and fractional product leadership, from a senior practitioner rather than a Big Four firm.',
    path: '/advisory/', og: 'advisory',
    ld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'ProfessionalService', '@id': `${SITE}/advisory/#service`, name: 'MONARO8 independent digital advisory', url: `${SITE}/advisory/`, provider: { '@id': `${SITE}/#organization` }, parentOrganization: { '@id': `${SITE}/#organization` },
        description: 'Independent digital strategy, AI strategy, platform and vendor decisions, fractional product leadership and prototype delivery.',
        areaServed: [{ '@type': 'City', name: 'Canberra' }, { '@type': 'State', name: 'Australian Capital Territory' }, { '@type': 'State', name: 'New South Wales' }],
        address: { '@type': 'PostalAddress', addressLocality: 'Cooma', addressRegion: 'NSW', postalCode: '2630', addressCountry: 'AU' },
        email: 'hello@monaro8.com.au',
        hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Advisory', itemListElement: ['Digital strategy and roadmaps', 'AI strategy', 'Platform, vendor and build-or-buy decisions', 'Fractional head of product', 'Product and customer-journey reviews', 'Prototypes and AI pilots'].map(n => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: n } })) } },
      { '@type': 'WebPage', name: 'Independent digital advisory', url: `${SITE}/advisory/`, isPartOf: { '@id': `${SITE}/#website` } },
    ] },
  }, body));
}

// ── llms.txt & sitemap ───────────────────────────
function meta() {
  write('llms.txt', `# MONARO8

> MONARO8 is an independent venture builder based in Cooma, Snowy Monaro, NSW, Australia (36.2355° S, 149.1257° E). It finds what wastes people’s time and builds software businesses that fix it, using AI tools to do more with a small team. MONARO8 is a registered business name of Open County Pty Ltd (ABN 19 679 154 557).

MONARO8 is led by founder Oliver Moran, who spent fifteen years leading product teams at Qantas, IAG/NRMA, MetLife and Equifax. He was Founder in Residence at Antler Singapore, is an EnergyLab alumnus, holds an MBA (Technology and Digital Strategy) from the University of Sydney, and is President of the Cooma Chamber of Commerce.

Alongside the ventures, MONARO8 provides independent digital and product advisory, mostly for Canberra public-sector and enterprise teams: digital strategy, AI strategy, platform and vendor decisions, and fractional product leadership.

## Pages

- [Home](${SITE}/): positioning, the ventures, the Studio Ledger build log, founder and place
- [Ventures](${SITE}/ventures/): problem, thesis, build and current stage for each venture
- [How we work](${SITE}/thesis/): how problems are picked and built, founder background
- [Advisory](${SITE}/advisory/): independent digital strategy, AI strategy and product leadership for Canberra public-sector and enterprise teams
- [Contact](${SITE}/contact/): enquiry form; email hello@monaro8.com.au

## Ventures

${ventures.map(v => `- [${v.name}](${v.url}) (${STAGE[v.stage].toLowerCase()}${v.operator && v.operator !== 'Open County Pty Ltd' ? `; operated by ${v.operator}` : ''}): ${v.card}`).join('\n')}
`);
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['/', '/ventures/', '/thesis/', '/advisory/', '/contact/'].map(p => `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
}

home(); venturesPage(); thesisPage(); advisoryPage(); contactPage(); meta();
console.log(`\n${N} ventures · ${stageShort} · ${num(commitTotal)} commits (${commitRange}) · ledger ${ledger.entries.length} entries`);
