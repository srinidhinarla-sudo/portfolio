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
  { fillId:'fill-left',  needleId:'needle-left',  ticksId:'ticks-left',  target:0.87  },
  { fillId:'fill-right', needleId:'needle-right', ticksId:'ticks-right', target:0.925 },
];
const CIRC = 2 * Math.PI * 72;
const ARC  = CIRC * (240/360);

/* ── Clock ────────────────────────────────────────────── */
function updateClock() {
  const n = new Date(), p = v => String(v).padStart(2,'0');
  const el = document.getElementById('hud-clock');
  if (el) el.textContent = `${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ── Build SVG tick marks ─────────────────────────────── */
function buildTicks(id) {
  const g = document.getElementById(id);
  if (!g || g.childElementCount) return; // don't rebuild
  for (let i = 0; i <= 24; i++) {
    const deg = 150 + (i/24)*240, rad = deg*Math.PI/180;
    const major = i%4===0, r=86, len=major?8:4;
    const x1 = 100+r*Math.sin(rad), y1 = 100-r*Math.cos(rad);
    const x2 = 100+(r-len)*Math.sin(rad), y2 = 100-(r-len)*Math.cos(rad);
    const l = document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('x1',x1.toFixed(2)); l.setAttribute('y1',y1.toFixed(2));
    l.setAttribute('x2',x2.toFixed(2)); l.setAttribute('y2',y2.toFixed(2));
    l.style.stroke      = '#1a3a50';
    l.style.strokeWidth = major?'1.5':'1';
    l.style.opacity     = major?'0.7':'0.35';
    g.appendChild(l);
  }
}

/* ── Animate gauges ───────────────────────────────────── */
function animateGauges() {
  GAUGES.forEach(cfg => {
    const filled = ARC * cfg.target, gap = CIRC - filled;
    const deg    = 150 + cfg.target * 240;
    const fill   = document.getElementById(cfg.fillId);
    const needle = document.getElementById(cfg.needleId);
    if (fill)   fill.style.strokeDasharray = `${filled.toFixed(2)} ${gap.toFixed(2)}`;
    if (needle) needle.style.transform     = `rotate(${deg}deg)`;
  });
}

/* ── Panel switching ──────────────────────────────────── */
function switchPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const t = document.getElementById(`panel-${name}`);
  if (t) t.classList.add('active');
  document.querySelectorAll('.dtab').forEach(b => b.classList.toggle('active', b.dataset.panel===name));
  document.querySelectorAll('.nb').forEach(b => b.classList.toggle('active', b.dataset.panel===name));
}
document.querySelectorAll('.dtab').forEach(t => t.addEventListener('click', () => switchPanel(t.dataset.panel)));
document.querySelectorAll('.nb').forEach(b => b.addEventListener('click', () => switchPanel(b.dataset.panel)));
window.switchPanel = switchPanel;

/* ── Project detail overlay ───────────────────────────── */
function openProject(key) {
  const d = PROJECTS[key]; if (!d) return;
  const el = document.getElementById('proj-detail');
  el.innerHTML = `
    <p class="pd-badge">${d.badge}</p>
    <h2 class="pd-title">${d.title}</h2>
    <div class="pd-body"><p>${d.body}</p><ul class="pd-highlights">${d.highlights.map(h=>`<li>${h}</li>`).join('')}</ul></div>
    <div class="pd-tags">${d.tags.map(t=>`<span>${t}</span>`).join('')}</div>
    <div class="pd-links">${d.github ? `<a href="${d.github}" target="_blank" class="dbtn primary" style="text-decoration:none;display:inline-flex;align-items:center;padding:8px 16px;border-radius:4px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.1em;background:#00c0f0;color:#000;font-weight:700">View on GitHub ↗</a>` : ''}</div>
  `;
  document.getElementById('proj-overlay').classList.add('open');
}
function closeProject() { document.getElementById('proj-overlay').classList.remove('open'); }
window.openProject  = openProject;
window.closeProject = closeProject;

/* ── Dashboard enter/exit ─────────────────────────────── */
let inDashboard = false;

function enterDashboard() {
  if (inDashboard) return;
  inDashboard = true;

  const scene     = document.getElementById('car-scene');
  const tapLabel  = document.getElementById('tap-label');
  const screenTap = document.getElementById('screen-tap');
  const ui        = document.getElementById('dashboard-ui');

  if (tapLabel)  tapLabel.classList.add('hidden');
  if (screenTap) screenTap.style.pointerEvents = 'none';

  scene.classList.add('zooming');
  GAUGES.forEach(g => buildTicks(g.ticksId));

  setTimeout(() => {
    scene.classList.add('hidden');
    ui.classList.add('visible');
    setTimeout(animateGauges, 300);
  }, 1200);
}

function exitDashboard() {
  if (!inDashboard) return;
  inDashboard = false;

  const scene     = document.getElementById('car-scene');
  const tapLabel  = document.getElementById('tap-label');
  const screenTap = document.getElementById('screen-tap');
  const ui        = document.getElementById('dashboard-ui');

  ui.classList.remove('visible');

  setTimeout(() => {
    scene.classList.remove('hidden');
    scene.classList.remove('zooming');
    void scene.offsetWidth; // force reflow to restart idle animation
    if (screenTap) screenTap.style.pointerEvents = '';
    setTimeout(() => { if (tapLabel) tapLabel.classList.remove('hidden'); }, 400);
  }, 400);
}

window.enterDashboard = enterDashboard;
window.exitDashboard  = exitDashboard;

/* user clicks the screen to enter — no auto-launch */
