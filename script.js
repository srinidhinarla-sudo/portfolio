'use strict';

/* ── Project data ─────────────────────────────────────── */
const PROJECTS = {
  sfp: {
    badge: 'Featured Project',
    title: 'Secure Financial Data Pipeline',
    github: 'https://github.com/srinidhinarla-sudo/secure-financial-pipeline',
    body: 'An end-to-end data engineering pipeline processing 284,000+ real-world credit card transactions with a focus on correctness, security, and production-grade architecture.',
    highlights: [
      'Bronze/Silver/Gold Delta Lake medallion architecture orchestrated by Apache Airflow on a daily schedule',
      'Tamper-evident audit layer: every row is SHA-256 hashed, assembled into a Merkle tree, verified on each run',
      'Isolation Forest anomaly detection across 29 engineered features with strict temporal train/test split — zero label leakage',
      'Automated failure recovery with partial re-run support and idempotent DAG design',
      'Full Docker Compose local deployment with reproducible environments',
    ],
    tags: ['Python', 'PySpark', 'Apache Airflow', 'Delta Lake', 'scikit-learn', 'Docker', 'SQL'],
  },
  ava: {
    badge: 'Systems / Testing',
    title: 'Autonomous Validation Agent',
    github: 'https://github.com/srinidhinarla-sudo/autonomous-validation-agent',
    body: 'A complete validation platform for a 61-state C++ vehicle-infotainment state machine exposed to Python via pybind11. Built to demonstrate rigorous testing in a safety-critical context.',
    highlights: [
      'Model-based test generator achieves 100% transition coverage (217/217 transitions)',
      'Adversarial fuzzer generates random event sequences; ddmin delta debugging reduces 250-step failures to 4-step minimal reproductions',
      'Mutation testing gate in CI: ≥88% kill rate required on every push (currently 92%)',
      'Live FastAPI dashboard with WebSocket real-time event feed and SQLite transition log',
      'Full GitHub Actions CI/CD: 5 jobs (build, pytest, flaky detection, mutation gate, coverage gate) — all green',
    ],
    tags: ['C++', 'Python', 'pybind11', 'FastAPI', 'pytest', 'GitHub Actions', 'CMake', 'WebSocket'],
  },
  nov: {
    badge: 'Novelis Internship',
    title: 'Multilingual Invoice Pipeline',
    body: 'Built during my Enterprise Architect internship at Novelis (Atlanta, GA). An AI-powered ETL pipeline that processed thousands of international invoices for the finance reporting team.',
    highlights: [
      'Ingested and processed 5,000+ invoices from 8 languages using Azure AI Translator and Language services',
      'Built on Azure Databricks with PySpark + Delta Lake for scalable, reliable processing',
      'Currency and date normalization across multiple international formats for downstream finance consumption',
      'Part of a broader data platform modernization initiative supporting SAP integration',
    ],
    tags: ['Azure Databricks', 'PySpark', 'Delta Lake', 'Azure AI Services', 'Python'],
  },
  fin: {
    badge: 'Personal Project',
    title: 'Personal Finance Intelligence Platform',
    body: 'A secure, full-stack personal finance application with JWT-authenticated REST APIs, anomaly detection, and budget strategy forecasting.',
    highlights: [
      'Processes 10,000+ transactions with full CRUD and role-based access control (RBAC)',
      'Isolation Forest anomaly detection flags unusual spending patterns with explainable feature attribution',
      'Budget forecasting engine compares snowball vs. avalanche debt repayment strategies with amortization projections',
      'Deployed on AWS EC2 behind NGINX with Docker Compose; PostgreSQL RDS backend',
    ],
    tags: ['Flask', 'JWT', 'scikit-learn', 'PostgreSQL', 'AWS', 'Docker', 'REST'],
  },
};

/* ── Gauge config ─────────────────────────────────────── */
const GAUGES = [
  { fillId: 'fill-left',  needleId: 'needle-left',  ticksId: 'ticks-left',  target: 0.87  },
  { fillId: 'fill-right', needleId: 'needle-right', ticksId: 'ticks-right', target: 0.925 },
];
const CIRC = 2 * Math.PI * 72;
const ARC  = CIRC * (240 / 360);

/* ── Three.js globals ────────────────────────────────── */
let threeScene, threeCamera, threeRenderer, threeScreenMesh;
let camInitPos, camInitLook, camZoomPos, camZoomLook;
let _lerpPos, _lerpLook, _raycaster, _mouse;
let camAnimating = false, camAnimT = 0, camAnimDir = 1, _lastT = 0;

const CAM_INIT_POS  = [0,    0.50, 3.0];
const CAM_INIT_LOOK = [0.35, 0,    0];
const CAM_ZOOM_POS  = [0.36, 0.06, 1.55];
const CAM_ZOOM_LOOK = [0.36, 0.02, 1.10];

/* ── Three.js init ───────────────────────────────────── */
function initThree() {
  const canvas = document.getElementById('three-canvas');
  const W = window.innerWidth, H = window.innerHeight;

  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x0c0d12);

  threeCamera = new THREE.PerspectiveCamera(72, W / H, 0.01, 50);
  threeCamera.position.set(...CAM_INIT_POS);
  threeCamera.lookAt(...CAM_INIT_LOOK);

  threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  threeRenderer.setSize(W, H);
  threeRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  threeRenderer.outputEncoding    = THREE.sRGBEncoding;
  threeRenderer.toneMapping       = THREE.ACESFilmicToneMapping;
  threeRenderer.toneMappingExposure = 1.05;

  camInitPos  = new THREE.Vector3(...CAM_INIT_POS);
  camInitLook = new THREE.Vector3(...CAM_INIT_LOOK);
  camZoomPos  = new THREE.Vector3(...CAM_ZOOM_POS);
  camZoomLook = new THREE.Vector3(...CAM_ZOOM_LOOK);
  _lerpPos    = new THREE.Vector3();
  _lerpLook   = new THREE.Vector3();
  _raycaster  = new THREE.Raycaster();
  _mouse      = new THREE.Vector2();

  buildCarScene();
  positionTapLabel();
  requestAnimationFrame(threeLoop);

  canvas.addEventListener('click', e => {
    if (!inDashboard && !camAnimating && hitScreen(e)) enterDashboard();
  });
  canvas.addEventListener('mousemove', e => {
    if (!inDashboard && !camAnimating)
      canvas.style.cursor = hitScreen(e) ? 'pointer' : 'default';
  });
  window.addEventListener('resize', () => {
    const W = window.innerWidth, H = window.innerHeight;
    threeCamera.aspect = W / H;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(W, H);
    positionTapLabel();
  });
}

/* ── Build 3D scene ──────────────────────────────────── */
function buildCarScene() {
  const s = threeScene;

  /* Lighting */
  s.add(new THREE.HemisphereLight(0xd4e4f0, 0x06080e, 0.50));
  const sun = new THREE.DirectionalLight(0xfff4e6, 0.90);
  sun.position.set(0, 8, 4);
  s.add(sun);
  const fill = new THREE.DirectionalLight(0x507898, 0.14);
  fill.position.set(-4, 2, 2);
  s.add(fill);

  /* Material factory */
  const mat = (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

  const darkPlastic = mat(0x18191f, 0.90, 0.04);
  const deepBlack   = mat(0x08090e, 0.92, 0.02);
  const walnut      = mat(0x5a3212, 0.62, 0.10);
  const bezelMat    = mat(0x0d0e15, 0.70, 0.18);
  const rimMetal    = mat(0x28293a, 0.28, 0.78);
  const spokeMat    = mat(0x1b1c25, 0.82, 0.08);
  const leatherGray = mat(0x8c9298, 0.88, 0.00);
  const consoleMat  = mat(0x111318, 0.88, 0.05);

  /* Screen uses CanvasTexture with portfolio info */
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x04080f,
    roughness: 0.04,
    metalness: 0.12,
    emissive: new THREE.Color(0x020508),
    emissiveIntensity: 0.20,
    map: makeScreenTexture(),
  });

  /* Mesh helper */
  const add = (geo, material, px, py, pz) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(px, py, pz);
    s.add(m);
    return m;
  };

  /* ── Sky + mountains ── */
  add(new THREE.PlaneGeometry(16, 6),   new THREE.MeshBasicMaterial({ color: 0x2e4a64 }), 0,  1.15, -2.9);
  add(new THREE.PlaneGeometry(16, 2.2), new THREE.MeshBasicMaterial({ color: 0x162434 }), 0,  0.18, -2.85);
  add(new THREE.PlaneGeometry(16, 0.5), new THREE.MeshBasicMaterial({ color: 0xc0d4e0 }), 0, -0.35, -2.80);

  /* ── Headliner ── */
  add(new THREE.BoxGeometry(7.5, 0.16, 5), deepBlack, 0, 1.28, -0.4);

  /* ── A-pillars ── */
  const apL = add(new THREE.BoxGeometry(0.10, 2.4, 0.16), deepBlack, -2.18, 0.30, -0.60);
  apL.rotation.z =  0.13;
  const apR = add(new THREE.BoxGeometry(0.10, 2.4, 0.16), deepBlack,  2.18, 0.30, -0.60);
  apR.rotation.z = -0.13;

  /* ── Door panels ── */
  add(new THREE.BoxGeometry(0.10, 3.0, 5.0), deepBlack, -2.42, 0, -0.4);
  add(new THREE.BoxGeometry(0.10, 3.0, 5.0), deepBlack,  2.42, 0, -0.4);

  /* ── Dashboard body ── */
  const dash = add(new THREE.BoxGeometry(5.6, 0.65, 1.25), darkPlastic, 0, -0.24, 0.52);
  dash.rotation.x = -0.14;

  /* ── Dashboard angled top cap (toward windshield) ── */
  const dashTop = add(new THREE.BoxGeometry(5.6, 0.12, 1.0), darkPlastic, 0, 0.18, -0.06);
  dashTop.rotation.x = -0.42;

  /* ── Wood trim strip ── */
  const wood = add(new THREE.BoxGeometry(5.6, 0.055, 0.24), walnut, 0, 0.10, 0.94);
  wood.rotation.x = -0.14;

  /* ── Instrument cluster (driver side) ── */
  const cl = add(new THREE.BoxGeometry(0.58, 0.18, 0.048), bezelMat, -0.88, 0.03, 1.07);
  cl.rotation.x = -0.14;
  const cls = add(new THREE.PlaneGeometry(0.52, 0.13),
    mat(0x030610, 0.04, 0.10), -0.88, 0.03, 1.095);
  cls.rotation.x = -0.14;

  /* ── Screen bezel ── */
  const bezel = add(new THREE.BoxGeometry(1.38, 0.54, 0.050), bezelMat, 0.36, 0.02, 1.08);
  bezel.rotation.x = -0.14;

  /* ── Screen face (CanvasTexture) ── */
  threeScreenMesh = add(new THREE.PlaneGeometry(1.30, 0.46), screenMat, 0.36, 0.02, 1.107);
  threeScreenMesh.rotation.x = -0.14;

  /* ── Climate strip ── */
  const clim = add(new THREE.BoxGeometry(1.38, 0.10, 0.044), darkPlastic, 0.36, -0.27, 1.08);
  clim.rotation.x = -0.14;

  /* ── Vent grilles (left and right of screen) ── */
  [[-1.20, 1.07], [1.72, 1.07]].forEach(([vx, vz]) => {
    const v = add(new THREE.BoxGeometry(0.30, 0.12, 0.032), bezelMat, vx, 0.02, vz);
    v.rotation.x = -0.14;
  });

  /* ── Steering column ── */
  const col = add(new THREE.CylinderGeometry(0.054, 0.066, 0.90, 16), deepBlack, -0.62, -0.56, 1.44);
  col.rotation.x = 0.28;

  /* ── Steering wheel ── */
  const WX = -0.62, WY = -0.20, WZ = 1.73, WT = 0.28, rimR = 0.34;

  /* Rim torus — faces driver (rotation.x = WT) */
  const rim = add(new THREE.TorusGeometry(rimR, 0.040, 24, 128), rimMetal, WX, WY, WZ);
  rim.rotation.x = WT;

  /* Stick helper: CylinderGeometry from world A to world B */
  function stick(ax, ay, az, bx, by, bz, radius, material) {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const geo = new THREE.CylinderGeometry(radius, radius, len, 10);
    const m = new THREE.Mesh(geo, material);
    m.position.set((ax+bx)/2, (ay+by)/2, (az+bz)/2);
    m.setRotationFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(dx, dy, dz).normalize()
      )
    );
    s.add(m);
  }

  /* Wheel local → world (accounts for wheel tilt WT around X) */
  function wlToW(lx, ly) {
    return [WX + lx, WY + ly * Math.cos(WT), WZ + ly * Math.sin(WT)];
  }

  /* Three spokes: upper-left (10 o'clock), upper-right (2 o'clock), bottom (6 o'clock) */
  [
    [-rimR * Math.sin(Math.PI / 6),  rimR * Math.cos(Math.PI / 6)],
    [ rimR * Math.sin(Math.PI / 6),  rimR * Math.cos(Math.PI / 6)],
    [0, -rimR],
  ].forEach(([lx, ly]) => {
    const [ex, ey, ez] = wlToW(lx, ly);
    stick(WX, WY, WZ, ex, ey, ez, 0.018, spokeMat);
  });

  /* Hub sphere */
  add(new THREE.SphereGeometry(0.068, 24, 16), deepBlack, WX, WY, WZ);

  /* Paddle shifters */
  const [plx, ply, plz] = wlToW(-rimR - 0.05, 0);
  const padL = add(new THREE.BoxGeometry(0.062, 0.14, 0.042), bezelMat, plx - 0.04, ply, plz);
  padL.rotation.x = WT;
  const [prx, pry, prz] = wlToW(rimR + 0.05, 0);
  const padR = add(new THREE.BoxGeometry(0.062, 0.14, 0.042), bezelMat, prx + 0.04, pry, prz);
  padR.rotation.x = WT;

  /* ── Floor ── */
  const floor = add(new THREE.PlaneGeometry(6, 5), deepBlack, 0, -0.98, 0.65);
  floor.rotation.x = -Math.PI / 2;

  /* ── Driver seat (light gray — contrasts dark interior) ── */
  add(new THREE.BoxGeometry(0.90, 0.10, 1.7), leatherGray, -1.56, -0.70, 1.05);
  const dsb = add(new THREE.BoxGeometry(0.90, 1.35, 0.14), leatherGray, -1.56, 0.02, 0.06);
  dsb.rotation.x = 0.05;

  /* ── Passenger seat ── */
  add(new THREE.BoxGeometry(0.90, 0.10, 1.7), leatherGray,  1.56, -0.70, 1.05);
  const psb = add(new THREE.BoxGeometry(0.90, 1.35, 0.14), leatherGray,  1.56, 0.02, 0.06);
  psb.rotation.x = 0.05;

  /* ── Center console ── */
  add(new THREE.BoxGeometry(0.58, 0.28, 2.0),  consoleMat, 0, -0.67, 1.05);
  add(new THREE.BoxGeometry(0.54, 0.08, 0.68), deepBlack,  0, -0.47, 1.12);
}

/* ── Screen canvas texture ───────────────────────────── */
function makeScreenTexture() {
  const W = 1300, H = 460;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  /* Background — dark navy */
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  /* Status bar */
  ctx.fillStyle = '#0a0d13';
  ctx.fillRect(0, 0, W, 32);
  ctx.fillStyle = 'rgba(75, 110, 142, 0.68)';
  ctx.font = '400 13px Menlo, Consolas, "Courier New", monospace';
  ctx.textAlign = 'left';  ctx.fillText('09:41', 22, 22);
  ctx.textAlign = 'center'; ctx.fillText('PORTFOLIO OS', W / 2, 22);
  ctx.textAlign = 'right';  ctx.fillText('▪ WIFI', W - 22, 22);

  ctx.strokeStyle = 'rgba(28, 52, 74, 0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 33); ctx.lineTo(W, 33); ctx.stroke();

  /* Name */
  ctx.fillStyle = 'rgba(230, 242, 255, 0.92)';
  ctx.font = '700 62px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Srinidhi Narla', W / 2, 126);

  /* Subtitle */
  ctx.fillStyle = 'rgba(85, 126, 162, 0.85)';
  ctx.font = '400 18px Menlo, Consolas, "Courier New", monospace';
  ctx.fillText('CS SENIOR  ·  UT DALLAS  ·  OPEN TO WORK', W / 2, 162);

  /* Divider */
  ctx.strokeStyle = 'rgba(22, 48, 70, 0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(110, 182); ctx.lineTo(W - 110, 182); ctx.stroke();

  /* Stats */
  [['GPA', '3.7'], ['PROJECTS', '5+'], ['INTERNSHIPS', '2'], ['CERTIFIED', 'AWS']].forEach(([label, val], i) => {
    const x = 168 + i * 245;
    ctx.fillStyle = 'rgba(62, 104, 138, 0.90)';
    ctx.font = '400 15px Menlo, Consolas, "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, 234);
    ctx.fillStyle = 'rgba(198, 228, 248, 0.95)';
    ctx.font = '600 40px system-ui, -apple-system, sans-serif';
    ctx.fillText(val, x, 294);
    if (i < 3) {
      ctx.strokeStyle = 'rgba(22, 48, 70, 0.52)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 114, 208); ctx.lineTo(x + 114, 316); ctx.stroke();
    }
  });

  /* Divider */
  ctx.strokeStyle = 'rgba(22, 48, 70, 0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(110, 328); ctx.lineTo(W - 110, 328); ctx.stroke();

  /* Tap prompt */
  ctx.fillStyle = 'rgba(88, 138, 175, 0.50)';
  ctx.font = '400 15px Menlo, Consolas, "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TAP TO EXPLORE PORTFOLIO', W / 2, 416);

  return new THREE.CanvasTexture(c);
}

/* ── Position tap-label below the 3D screen ─────────── */
function positionTapLabel() {
  if (!threeScreenMesh || !threeCamera) return;
  const pt = threeScreenMesh.position.clone();
  pt.y -= 0.30;
  pt.project(threeCamera);
  const x = ((pt.x + 1) / 2) * 100;
  const y = ((-pt.y + 1) / 2) * 100;
  const tl = document.getElementById('tap-label');
  if (tl) { tl.style.left = x + '%'; tl.style.top = y + '%'; }
}

/* ── Raycaster hit test ───────────────────────────────── */
function hitScreen(e) {
  _mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  _mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  _raycaster.setFromCamera(_mouse, threeCamera);
  return _raycaster.intersectObjects([threeScreenMesh]).length > 0;
}

/* ── Render loop ─────────────────────────────────────── */
function threeLoop(t = 0) {
  requestAnimationFrame(threeLoop);
  const dt = Math.min((t - _lastT) / 1000, 0.1);
  _lastT = t;

  if (camAnimating) {
    camAnimT = Math.min(camAnimT + dt * 0.85, 1);
    const e = easeIO(camAnimT);

    if (camAnimDir === 1) {
      _lerpPos.lerpVectors(camInitPos, camZoomPos, e);
      _lerpLook.lerpVectors(camInitLook, camZoomLook, e);
    } else {
      _lerpPos.lerpVectors(camZoomPos, camInitPos, e);
      _lerpLook.lerpVectors(camZoomLook, camInitLook, e);
    }
    threeCamera.position.copy(_lerpPos);
    threeCamera.lookAt(_lerpLook);

    if (camAnimT >= 1) {
      camAnimating = false;
      if (camAnimDir === 1) {
        document.getElementById('car-scene').classList.add('hidden');
        document.getElementById('dashboard-ui').classList.add('visible');
        setTimeout(animateGauges, 300);
      } else {
        setTimeout(() => {
          const tl = document.getElementById('tap-label');
          if (tl) tl.classList.remove('hidden');
        }, 200);
      }
    }
  }

  threeRenderer.render(threeScene, threeCamera);
}

function easeIO(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ── Clock ───────────────────────────────────────────── */
function updateClock() {
  const n = new Date(), p = v => String(v).padStart(2, '0');
  const el = document.getElementById('hud-clock');
  if (el) el.textContent = `${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ── Build SVG tick marks ────────────────────────────── */
function buildTicks(id) {
  const g = document.getElementById(id);
  if (!g || g.childElementCount) return;
  for (let i = 0; i <= 24; i++) {
    const deg = 150 + (i / 24) * 240, rad = deg * Math.PI / 180;
    const major = i % 4 === 0, r = 86, len = major ? 8 : 4;
    const x1 = 100 + r * Math.sin(rad), y1 = 100 - r * Math.cos(rad);
    const x2 = 100 + (r - len) * Math.sin(rad), y2 = 100 - (r - len) * Math.cos(rad);
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x1.toFixed(2)); l.setAttribute('y1', y1.toFixed(2));
    l.setAttribute('x2', x2.toFixed(2)); l.setAttribute('y2', y2.toFixed(2));
    l.style.stroke      = '#1a3a50';
    l.style.strokeWidth = major ? '1.5' : '1';
    l.style.opacity     = major ? '0.7' : '0.35';
    g.appendChild(l);
  }
}

/* ── Animate gauges ──────────────────────────────────── */
function animateGauges() {
  GAUGES.forEach(cfg => {
    const filled = ARC * cfg.target, gap = CIRC - filled;
    const deg    = 150 + cfg.target * 240;
    const fill   = document.getElementById(cfg.fillId);
    const needle = document.getElementById(cfg.needleId);
    buildTicks(cfg.ticksId);
    if (fill)   fill.style.strokeDasharray = `${filled.toFixed(2)} ${gap.toFixed(2)}`;
    if (needle) needle.style.transform     = `rotate(${deg}deg)`;
  });
}

/* ── Panel switching ─────────────────────────────────── */
function switchPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const t = document.getElementById(`panel-${name}`);
  if (t) t.classList.add('active');
  document.querySelectorAll('.dtab').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
  document.querySelectorAll('.nb').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
}
document.querySelectorAll('.dtab').forEach(t => t.addEventListener('click', () => switchPanel(t.dataset.panel)));
document.querySelectorAll('.nb').forEach(b => b.addEventListener('click', () => switchPanel(b.dataset.panel)));
window.switchPanel = switchPanel;

/* ── Project detail overlay ──────────────────────────── */
function openProject(key) {
  const d = PROJECTS[key]; if (!d) return;
  const el = document.getElementById('proj-detail');
  el.innerHTML = `
    <p class="pd-badge">${d.badge}</p>
    <h2 class="pd-title">${d.title}</h2>
    <div class="pd-body"><p>${d.body}</p><ul class="pd-highlights">${d.highlights.map(h => `<li>${h}</li>`).join('')}</ul></div>
    <div class="pd-tags">${d.tags.map(t => `<span>${t}</span>`).join('')}</div>
    <div class="pd-links">${d.github ? `<a href="${d.github}" target="_blank" class="dbtn primary" style="text-decoration:none;display:inline-flex;align-items:center;padding:8px 16px;border-radius:4px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.1em;background:#00c0f0;color:#000;font-weight:700">View on GitHub ↗</a>` : ''}</div>
  `;
  document.getElementById('proj-overlay').classList.add('open');
}
function closeProject() { document.getElementById('proj-overlay').classList.remove('open'); }
window.openProject  = openProject;
window.closeProject = closeProject;

/* ── Dashboard enter / exit ──────────────────────────── */
let inDashboard = false;

function enterDashboard() {
  if (inDashboard || camAnimating) return;
  inDashboard = true;
  const tl = document.getElementById('tap-label');
  if (tl) tl.classList.add('hidden');
  camAnimDir = 1; camAnimT = 0; camAnimating = true;
}

function exitDashboard() {
  if (!inDashboard) return;
  inDashboard = false;
  document.getElementById('dashboard-ui').classList.remove('visible');
  setTimeout(() => {
    const scene = document.getElementById('car-scene');
    scene.classList.remove('hidden');
    threeCamera.position.copy(camZoomPos);
    threeCamera.lookAt(camZoomLook);
    camAnimDir = -1; camAnimT = 0; camAnimating = true;
  }, 200);
}

window.enterDashboard = enterDashboard;
window.exitDashboard  = exitDashboard;

/* ── Boot ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', initThree);
