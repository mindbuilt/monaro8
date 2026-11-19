// MONARO8 terrain engine — real Cooma DEM rendered as a contour-sliced relief.
// Data: /assets/terrain/cooma-dem.bin (uint16 decimetres, row-major north→south, west→east)
//       /assets/terrain/cooma-dem.json (bounds, size, optional "glb" override)
// To swap in ELVIS LiDAR: export a decimated Draco .glb in the same footprint and add
//   "glb": { "url": "/assets/terrain/cooma-dem.glb", "minElev": <m>, "maxElev": <m> }
// to cooma-dem.json. The .bin heightfield is still used for cursor picking.

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const EXAG = 3.2;            // vertical exaggeration
const BASE = 700;            // metres at y = 0

const canvas = document.getElementById('terrain');
const meta = await fetch('/assets/terrain/cooma-dem.json').then(r => r.json());
const W = meta.widthKm, D = meta.heightKm;
const buf = await fetch('/assets/terrain/cooma-dem.bin').then(r => r.arrayBuffer());
const H = new Uint16Array(buf);

// ── geo helpers ──────────────────────────────────
const mercY = lat => { const r = lat * Math.PI / 180; return Math.log(Math.tan(Math.PI / 4 + r / 2)); };
const yN = mercY(meta.bounds.north), yS = mercY(meta.bounds.south);
const llToUV = (lat, lon) => [
  (lon - meta.bounds.west) / (meta.bounds.east - meta.bounds.west),
  (yN - mercY(lat)) / (yN - yS),
];
const uvToLL = (u, v) => {
  const my = yN - v * (yN - yS);
  return [(2 * Math.atan(Math.exp(my)) - Math.PI / 2) * 180 / Math.PI, meta.bounds.west + u * (meta.bounds.east - meta.bounds.west)];
};
const elevUV = (u, v) => {
  const x = Math.min(meta.width - 1.001, Math.max(0, u * (meta.width - 1)));
  const y = Math.min(meta.height - 1.001, Math.max(0, v * (meta.height - 1)));
  const x0 = x | 0, y0 = y | 0, dx = x - x0, dy = y - y0, w = meta.width;
  const a = H[y0 * w + x0], b = H[y0 * w + x0 + 1], c = H[(y0 + 1) * w + x0], d = H[(y0 + 1) * w + x0 + 1];
  return (a * (1 - dx) * (1 - dy) + b * dx * (1 - dy) + c * (1 - dx) * dy + d * dx * dy) / 10;
};
const toY = e => (e - BASE) / 1000 * EXAG;
const uvToWorld = (u, v) => new THREE.Vector3((u - 0.5) * W, toY(elevUV(u, v)), (v - 0.5) * D);

// ── renderer ─────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setClearColor(0x111312, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 120);

// ── geometry ─────────────────────────────────────
async function buildGeometry() {
  if (meta.glb && meta.glb.url) {
    try {
      const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'), import('three/addons/loaders/DRACOLoader.js')]);
      const loader = new GLTFLoader();
      const draco = new DRACOLoader(); draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/');
      loader.setDRACOLoader(draco);
      const gltf = await loader.loadAsync(meta.glb.url);
      let mesh; gltf.scene.traverse(o => { if (!mesh && o.isMesh) mesh = o; });
      const g = mesh.geometry.clone(); g.computeBoundingBox();
      const bb = g.boundingBox, p = g.attributes.position, elev = new Float32Array(p.count);
      for (let i = 0; i < p.count; i++) {
        const t = (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y || 1);
        const e = meta.glb.minElev + t * (meta.glb.maxElev - meta.glb.minElev);
        elev[i] = e;
        p.setXYZ(i, ((p.getX(i) - bb.min.x) / (bb.max.x - bb.min.x) - 0.5) * W, toY(e), ((p.getZ(i) - bb.min.z) / (bb.max.z - bb.min.z) - 0.5) * D);
      }
      g.setAttribute('aElev', new THREE.BufferAttribute(elev, 1));
      g.computeVertexNormals();
      g.computeBoundingSphere();
      return g;
    } catch (err) { console.warn('[terrain] glb load failed, using DEM heightfield', err); }
  }
  const g = new THREE.PlaneGeometry(W, D, meta.width - 1, meta.height - 1);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, elev = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { const e = H[i] / 10; elev[i] = e; p.setY(i, toY(e)); }
  g.setAttribute('aElev', new THREE.BufferAttribute(elev, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

const uniforms = {
  uBase: { value: new THREE.Color(0x111312) },
  uMinor: { value: new THREE.Color(0x8F978E) },
  uIndex: { value: new THREE.Color(0xC5A880) },
  uBand: { value: 0 }, uBandMix: { value: 0 },
  uFocus: { value: new THREE.Vector2(0, 0) }, uFocusMix: { value: 0 },
  uHalf: { value: new THREE.Vector2(W / 2, D / 2) },
  uReveal: { value: 0 },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */`
    attribute float aElev;
    varying float vElev; varying vec3 vWorld; varying vec3 vNormal;
    void main() {
      vElev = aElev;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uBase, uMinor, uIndex;
    uniform float uBand, uBandMix, uFocusMix, uReveal;
    uniform vec2 uFocus, uHalf;
    varying float vElev; varying vec3 vWorld; varying vec3 vNormal;
    float iso(float e, float interval, float width) {
      float f = e / interval;
      float d = abs(fract(f - 0.5) - 0.5) / max(fwidth(f), 1e-4);
      return 1.0 - clamp(d / width, 0.0, 1.0);
    }
    void main() {
      vec3 n = normalize(vNormal);
      float shade = clamp(dot(n, normalize(vec3(-0.55, 0.75, -0.4))), 0.0, 1.0);
      // elevation tint: eucalypt on the plains rising to lichen on the foothills, lit by hillshade
      float h = clamp((vElev - 720.0) / 600.0, 0.0, 1.0);
      vec3 tint = mix(vec3(0.290, 0.329, 0.282), vec3(0.561, 0.592, 0.557), h);
      vec3 col = mix(uBase, tint, 0.16 + 0.34 * shade) * (0.7 + 0.6 * shade);

      float focus = 1.0 + uFocusMix * 1.4 * smoothstep(3.2, 0.0, distance(vWorld.xz, uFocus));
      // reveal sweeps contours in from low to high elevation
      float rev = smoothstep(vElev - 40.0, vElev, mix(680.0, 1360.0, uReveal));
      float minor = iso(vElev, 20.0, 1.0) * 0.42 * focus * rev;
      float index = iso(vElev, 100.0, 1.35) * 0.85 * rev;
      col = mix(col, uMinor, clamp(minor, 0.0, 1.0));
      col = mix(col, uIndex, clamp(index, 0.0, 1.0));

      // waypoint elevation band: the one contour at the venture's height
      float bd = abs(vElev - uBand) / max(fwidth(vElev), 1e-4);
      float band = (1.0 - clamp(bd / 1.9, 0.0, 1.0)) * uBandMix;
      col = mix(col, uIndex * 1.25, band);

      // fade the sheet edge and distance into basalt
      vec2 e = uHalf - abs(vWorld.xz);
      float edge = smoothstep(0.0, 2.2, min(e.x, e.y));
      float dist = length(vWorld - cameraPosition);
      float fog = exp(-pow(max(dist - 6.0, 0.0) * 0.055, 2.0));
      gl_FragColor = vec4(mix(uBase, col, edge * fog), 1.0);
    }`,
  extensions: { derivatives: true },
});

const mesh = new THREE.Mesh(await buildGeometry(), material);
scene.add(mesh);

// ── waypoints ────────────────────────────────────
const layer = document.querySelector('.wp-layer:not(.datum-layer)');
const datumLayer = document.querySelector('.datum-layer');
const wps = [...document.querySelectorAll('[data-wp]')].map(el => {
  const [u, v] = llToUV(+el.dataset.lat, +el.dataset.lon);
  return { el, id: el.dataset.wp, elev: +el.dataset.elev, pos: uvToWorld(u, v) };
});
const wpById = Object.fromEntries(wps.map(w => [w.id, w]));

// ── camera choreography ──────────────────────────
// Each keyframe: camera position + look target, in km-space (x east, z south).
const KF = {
  hero:     { p: [14.5, 4.4, 8.6],   t: [0.5, 0.0, -2.8] },    // over the plains east of Cooma, looking west
  ventures: { p: [0.5, 17.5, 15.0],  t: [-5.0, 0.0, 0.2] },    // high oblique survey across the whole sheet
  closing:  { p: [-1.5, 4.2, 6.5],   t: [-12.5, 1.4, -5.0] },  // up into the western foothills
};
const v3 = a => new THREE.Vector3(...a);
const cam = { p: v3(KF.hero.p), t: v3(KF.hero.t) };
const seg = { a: 0, b: 0 }; // scroll progress hero→ventures, ventures→closing

function scrollState(out) {
  const a = seg.a, b = seg.b;
  const p = v3(KF.hero.p).lerp(v3(KF.ventures.p), a).lerp(v3(KF.closing.p), b);
  const t = v3(KF.hero.t).lerp(v3(KF.ventures.t), a).lerp(v3(KF.closing.t), b);
  out.p.copy(p); out.t.copy(t);
}

const ventures = document.getElementById('ventures');
const closing = document.getElementById('closing');
if (ventures) gsap.to(seg, { a: 1, ease: 'none', scrollTrigger: { trigger: ventures, start: 'top bottom', end: 'top 15%', scrub: 1.2 } });
if (closing) gsap.to(seg, { b: 1, ease: 'none', scrollTrigger: { trigger: closing, start: 'top bottom', end: 'center center', scrub: 1.2 } });

const hero = document.getElementById('top');
const sbBar = document.querySelector('.sb-bar'), sbLabel = document.querySelector('.sb-label');
const gridEl = document.querySelector('.wp-grid'), introEl = document.querySelector('.ventures-home .intro');

// hover → fly to waypoint
const hover = { mix: 0, p: new THREE.Vector3(), t: new THREE.Vector3() };
function focusWp(id) {
  const w = wpById[id]; if (!w) return;
  hover.t.copy(w.pos);
  hover.p.copy(w.pos).add(new THREE.Vector3(2.6, 3.4, 5.2));
  uniforms.uBand.value = w.elev;
  uniforms.uFocus.value.set(w.pos.x, w.pos.z);
  gsap.to(hover, { mix: 1, duration: 1.6, ease: 'expo.out', overwrite: true });
  gsap.to(uniforms.uBandMix, { value: 1, duration: 0.9, ease: 'expo.out', overwrite: true });
  gsap.to(uniforms.uFocusMix, { value: 1, duration: 0.9, ease: 'expo.out', overwrite: true });
  wps.forEach(x => x.el.classList.toggle('active', x.id === id));
}
function blurWp() {
  gsap.to(hover, { mix: 0, duration: 1.4, ease: 'expo.out', overwrite: true });
  gsap.to([uniforms.uBandMix, uniforms.uFocusMix], { value: 0, duration: 0.8, ease: 'expo.out', overwrite: true });
  wps.forEach(x => x.el.classList.remove('active'));
}
document.querySelectorAll('[data-focus]').forEach(f => {
  f.addEventListener('pointerenter', () => { focusWp(f.dataset.focus); f.classList.add('active'); });
  f.addEventListener('pointerleave', () => { blurWp(); f.classList.remove('active'); });
  f.addEventListener('focus', () => focusWp(f.dataset.focus));
  f.addEventListener('blur', blurWp);
});

// cursor parallax + coordinate readout
const pointer = { x: 0, y: 0, sx: 0, sy: 0, cx: -1, cy: -1, moved: false };
window.addEventListener('pointermove', e => {
  pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = e.clientY / innerHeight * 2 - 1;
  pointer.cx = e.clientX; pointer.cy = e.clientY; pointer.moved = true;
}, { passive: true });

const badge = document.querySelector('.coord-badge');
const badgeLat = badge?.querySelector('.lat'), badgeLon = badge?.querySelector('.lon'), badgeEl = badge?.querySelector('.elev');
const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v < 0 ? neg : pos}`;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick() {
  ndc.set(pointer.cx / innerWidth * 2 - 1, -(pointer.cy / innerHeight * 2 - 1));
  ray.setFromCamera(ndc, camera);
  const o = ray.ray.origin, d = ray.ray.direction;
  for (let s = 0.2; s < 70; s += 0.08) {
    const x = o.x + d.x * s, y = o.y + d.y * s, z = o.z + d.z * s;
    const u = x / W + 0.5, v = z / D + 0.5;
    if (u < 0 || u > 1 || v < 0 || v > 1) { if (s > 40) break; continue; }
    if (y <= toY(elevUV(u, v))) return [u, v];
  }
  return null;
}
function updateBadge(onTerrain) {
  if (!badge) return;
  if (onTerrain) {
    const [lat, lon] = uvToLL(onTerrain[0], onTerrain[1]);
    badgeLat.textContent = fmt(lat, 'N', 'S'); badgeLon.textContent = fmt(lon, 'E', 'W');
    badgeEl.textContent = `${Math.round(elevUV(onTerrain[0], onTerrain[1])).toLocaleString('en-AU')} M`;
    badge.dataset.live = 'true';
  } else if (badge.dataset.live === 'true') {
    badgeLat.textContent = '36.2355° S'; badgeLon.textContent = '149.1257° E'; badgeEl.textContent = '795 M';
    badge.dataset.live = 'false';
  }
}

// ── loop ─────────────────────────────────────────
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
resize(); addEventListener('resize', resize);

const base = { p: new THREE.Vector3(), t: new THREE.Vector3() };
const off = new THREE.Vector3(), sph = new THREE.Spherical(), proj = new THREE.Vector3();
const clock = new THREE.Clock();
let visible = true;

function frame() {
  const time = clock.getElapsedTime();
  scrollState(base);
  base.p.lerp(hover.p, hover.mix); base.t.lerp(hover.t, hover.mix);

  pointer.sx += (pointer.x - pointer.sx) * 0.045; pointer.sy += (pointer.y - pointer.sy) * 0.045;
  off.copy(base.p).sub(base.t); sph.setFromVector3(off);
  sph.theta += THREE.MathUtils.degToRad(-pointer.sx * 2.6 + Math.sin(time * 0.06) * 1.4);
  sph.phi = THREE.MathUtils.clamp(sph.phi + THREE.MathUtils.degToRad(pointer.sy * 2.0 + Math.sin(time * 0.045) * 0.6), 0.15, 1.52);
  off.setFromSpherical(sph);
  camera.position.copy(base.t).add(off);
  camera.lookAt(base.t);

  // during the ventures section, shift the optical centre into the open left column
  const shiftAmt = seg.a * (1 - seg.b) * (innerWidth > 1100 ? 1 : 0);
  if (shiftAmt > 0.001) camera.setViewOffset(innerWidth, innerHeight, innerWidth * 0.27 * shiftAmt, -innerHeight * 0.16 * shiftAmt, innerWidth, innerHeight);
  else if (camera.view && camera.view.enabled) camera.clearViewOffset();

  renderer.render(scene, camera);

  // live scale bar: true screen length of 5 km at the Cooma datum
  if (sbBar && wpById.cooma) {
    proj.copy(wpById.cooma.pos).project(camera); const ax = proj.x, ay = proj.y;
    proj.copy(wpById.cooma.pos).add(new THREE.Vector3(5, 0, 0)).project(camera);
    const px = Math.hypot((proj.x - ax) / 2 * innerWidth, (proj.y - ay) / 2 * innerHeight);
    if (isFinite(px) && px > 4) {
      const km = px > 220 ? 1 : px > 110 ? 2 : 5;
      sbBar.style.width = `${Math.min(200, px * km / 5).toFixed(0)}px`;
      if (sbLabel.textContent !== `${km} km`) sbLabel.textContent = `${km} km`;
    }
  }

  {
    // which marker set is live, and where markers may sit without covering content
    const vr = ventures?.getBoundingClientRect();
    const venturesOn = !!vr && vr.top < innerHeight * 0.45 && vr.bottom > innerHeight * 0.6;
    const datumOn = !!hero && scrollY < hero.offsetHeight * 0.45;
    layer?.classList.toggle('on', venturesOn);
    datumLayer?.classList.toggle('on', datumOn);
    const grid = gridEl?.getBoundingClientRect(), intro = introEl?.getBoundingClientRect();
    for (const w of wps) {
      proj.copy(w.pos).project(camera);
      const sx = (proj.x + 1) / 2 * innerWidth, sy = (1 - proj.y) / 2 * innerHeight;
      let hidden = proj.z > 1 || sx < 8 || sx > innerWidth - 8 || sy < 90 || sy > innerHeight - 8;
      if (w.id !== 'cooma' && grid && intro) {
        const wide = innerWidth > 1100;
        if (wide && sx > grid.left - 200) hidden = true;                          // label must clear the venture grid
        if (wide && sy < intro.bottom + 40 && sx < intro.right + 40) hidden = true; // and the intro copy
      }
      w.el.classList.toggle('hidden', hidden);
      if (!hidden) w.el.style.transform = `translate(${sx}px, ${sy}px)`;
    }
  }
  if (pointer.moved) {
    pointer.moved = false;
    const overUI = document.elementFromPoint(pointer.cx, pointer.cy)?.closest('.sheet, .wp-frame, .site-header, .title-block, .site-footer, .hero h1, .hero-lede, .hero-actions');
    updateBadge(overUI ? null : pick());
  }
}

// pause rendering whenever no terrain window is on screen
const windows = new Set();
const io = new IntersectionObserver(entries => {
  entries.forEach(e => e.isIntersecting ? windows.add(e.target) : windows.delete(e.target));
  const on = windows.size > 0 && !document.hidden;
  if (on !== visible) { visible = on; renderer.setAnimationLoop(on ? frame : null); if (!on) updateBadge(null); }
});
document.querySelectorAll('.window').forEach(w => io.observe(w));
renderer.setAnimationLoop(frame);

canvas.classList.add('ready');
gsap.fromTo(uniforms.uReveal, { value: 0 }, { value: 1, duration: 3.2, ease: 'power2.out', delay: 0.15 });
