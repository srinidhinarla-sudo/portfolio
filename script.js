'use strict';

/* ── Project data ───────────────────────────────────────── */
const PROJECTS = {
  sfp: {
    title: 'Secure Financial Data Pipeline',
    badge: 'Featured Project',
    github: 'https://github.com/srinidhinarla-sudo/secure-financial-pipeline',
    body: `An end-to-end data engineering pipeline built to process 284,000+ real-world credit card transactions with a focus on correctness, security, and production-grade architecture.`,
    highlights: [
      'Bronze/Silver/Gold Delta Lake medallion architecture orchestrated by Apache Airflow on a daily schedule',
      'Tamper-evident audit layer: every row is SHA-256 hashed, assembled into a Merkle tree, and verified on each pipeline run',
      'Isolation Forest anomaly detection across 29 engineered features with strict train/test temporal split — no label leakage',
      'Automated failure recovery with partial re-run support and idempotent DAG design',
      'Full Docker Compose local deployment with reproducible environments',
    ],
    tags: ['Python', 'PySpark', 'Apache Airflow', 'Delta Lake', 'scikit-learn', 'Docker', 'SQL'],
  },
  ava: {
    title: 'Autonomous Validation Agent',
    badge: 'Systems / Testing',
    github: 'https://github.com/srinidhinarla-sudo/autonomous-validation-agent',
    body: `A complete validation platform for a 61-state C++ vehicle-infotainment state machine, exposed to Python via pybind11. Built to demonstrate rigorous software testing techniques in a safety-critical context.`,
    highlights: [
      'Model-based test generator achieves 100% transition coverage (217/217 transitions) on the state machine graph',
      'Adversarial fuzzer generates random event sequences; ddmin delta debugging reduces 250-step failure traces to 4-step minimal reproductions',
      'Mutation testing gate enforced in CI: ≥88% kill rate required on every push (currently 92%)',
      'Live FastAPI dashboard with WebSocket real-time feed and SQLite transition log',
      'Full GitHub Actions CI/CD: build (CMake + pybind11), pytest, flaky-test detection, mutation testing, coverage gate — all 5 jobs green',
    ],
    tags: ['C++', 'Python', 'pybind11', 'FastAPI', 'pytest', 'GitHub Actions', 'CMake', 'WebSocket'],
  },
  nov: {
    title: 'Multilingual Invoice Pipeline',
    badge: 'Novelis Internship',
    body: `Built during my Enterprise Architect internship at Novelis (Atlanta, GA). An AI-powered ETL pipeline that processed thousands of international invoices for the finance reporting team.`,
    highlights: [
      'Ingested and processed 5,000+ invoices from 8 different languages using Azure AI Translator and Language services',
      'Built on Azure Databricks with PySpark + Delta Lake for scalable, reliable processing',
      'Currency and date normalization across multiple international formats for downstream finance consumption',
      'Part of a broader data platform modernization initiative supporting SAP integration',
    ],
    tags: ['Azure Databricks', 'PySpark', 'Delta Lake', 'Azure AI Services', 'Python'],
  },
  fin: {
    title: 'Personal Finance Intelligence Platform',
    badge: 'Personal Project',
    body: `A secure, full-stack personal finance application with JWT-authenticated REST APIs, anomaly detection, and budget strategy forecasting.`,
    highlights: [
      'Processes 10,000+ transactions with full CRUD and role-based access control (RBAC)',
      'Isolation Forest anomaly detection flags unusual spending patterns with explainable feature attribution',
      'Budget forecasting engine compares snowball vs. avalanche debt repayment strategies with amortization projections',
      'Deployed on AWS EC2 behind NGINX with Docker Compose; PostgreSQL RDS backend',
    ],
    tags: ['Flask', 'JWT', 'scikit-learn', 'PostgreSQL', 'AWS', 'Docker', 'REST'],
  },
};

/* ── Gauge config ───────────────────────────────────────── */
const GAUGES = [
  { fillId: 'fill-left',  needleId: 'needle-left',  ticksId: 'ticks-left',  target: 0.87  },
  { fillId: 'fill-right', needleId: 'needle-right', ticksId: 'ticks-right', target: 0.925 },
];

/* r=72 on main gauges: circumference=452.39, 240° arc=301.59 */
const CIRCUMFERENCE = 2 * Math.PI * 72;  // 452.39
const ARC_LENGTH    = CIRCUMFERENCE * (240 / 360); // 301.59

/* r=48 on landing preview gauges: circum=301.59, 240°=201.06 */
const DB_CIRC = 2 * Math.PI * 48; // 301.59
const DB_ARC  = DB_CIRC * (240 / 360); // 201.06

/* ── Clock ──────────────────────────────────────────────── */
function updateClock() {
  const n = new Date();
  const pad = v => String(v).padStart(2, '0');
  const el = document.getElementById('hud-clock');
  if (el) el.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ── Build SVG tick marks ───────────────────────────────── */
function buildTicks(containerId) {
  const g = document.getElementById(containerId);
  if (!g) return;
  const total = 24;
  for (let i = 0; i <= total; i++) {
    const deg = 150 + (i / total) * 240;
    const rad = deg * Math.PI / 180;
    const major = i % 4 === 0;
    const r = 86, len = major ? 8 : 4;
    const x1 = 100 + r * Math.sin(rad);
    const y1 = 100 - r * Math.cos(rad);
    const x2 = 100 + (r - len) * Math.sin(rad);
    const y2 = 100 - (r - len) * Math.cos(rad);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toFixed(2));
    line.setAttribute('y1', y1.toFixed(2));
    line.setAttribute('x2', x2.toFixed(2));
    line.setAttribute('y2', y2.toFixed(2));
    line.style.strokeWidth = major ? '1.5' : '1';
    line.style.opacity     = major ? '0.7'  : '0.35';
    g.appendChild(line);
  }
}

/* ── Animate main dashboard gauges ─────────────────────── */
function animateGauges() {
  GAUGES.forEach(cfg => {
    const filled = ARC_LENGTH * cfg.target;
    const gap    = CIRCUMFERENCE - filled;
    const deg    = 150 + cfg.target * 240;

    const fill   = document.getElementById(cfg.fillId);
    const needle = document.getElementById(cfg.needleId);
    if (fill)   fill.style.strokeDasharray = `${filled.toFixed(2)} ${gap.toFixed(2)}`;
    if (needle) needle.style.transform     = `rotate(${deg}deg)`;
  });
}

/* ── Animate landing (preview) gauges ───────────────────── */
function animateLandingGauges() {
  const configs = [
    { fillId: 'db-fill-left',  needleId: 'db-needle-left',  target: 0.87  },
    { fillId: 'db-fill-right', needleId: 'db-needle-right', target: 0.925 },
  ];
  configs.forEach(cfg => {
    const filled = DB_ARC * cfg.target;
    const gap    = DB_CIRC - filled;
    const deg    = 150 + cfg.target * 240;

    const fill   = document.getElementById(cfg.fillId);
    const needle = document.getElementById(cfg.needleId);
    if (fill)   fill.style.strokeDasharray = `${filled.toFixed(2)} ${gap.toFixed(2)}`;
    if (needle) needle.style.transform     = `rotate(${deg}deg)`;
  });
}

/* ── Panel switching ────────────────────────────────────── */
function switchPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`panel-${name}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.d-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.panel === name));
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.panel === name));
}

document.querySelectorAll('.d-tab').forEach(t =>
  t.addEventListener('click', () => switchPanel(t.dataset.panel)));
document.querySelectorAll('.nav-btn').forEach(b =>
  b.addEventListener('click', () => switchPanel(b.dataset.panel)));

window.switchPanel = switchPanel;

/* ── Screen zoom (collapse gauges) ─────────────────────── */
let screenZoomed = false;

function zoomInScreen() {
  screenZoomed = true;
  document.getElementById('dash-body').classList.add('screen-zoomed');
  document.getElementById('zoom-out-btn').style.display = 'block';
  document.getElementById('zoom-hint-btn').style.display = 'none';
}

function zoomOutScreen() {
  screenZoomed = false;
  document.getElementById('dash-body').classList.remove('screen-zoomed');
  document.getElementById('zoom-out-btn').style.display = 'none';
  document.getElementById('zoom-hint-btn').style.display = 'block';
}

window.zoomInScreen  = zoomInScreen;
window.zoomOutScreen = zoomOutScreen;

/* ── Project detail overlay ─────────────────────────────── */
function openProject(key) {
  const data    = PROJECTS[key];
  if (!data) return;
  const overlay = document.getElementById('proj-overlay');
  const content = document.getElementById('proj-detail-content');

  const highlightHTML = data.highlights
    .map(h => `<li>${h}</li>`)
    .join('');

  const tagsHTML = data.tags.map(t => `<span>${t}</span>`).join('');

  const githubBtn = data.github
    ? `<a href="${data.github}" target="_blank" class="dash-btn primary" style="text-decoration:none">View on GitHub ↗</a>`
    : '';

  content.innerHTML = `
    <p class="pd-badge">${data.badge}</p>
    <h2 class="pd-title">${data.title}</h2>
    <div class="pd-body">
      <p>${data.body}</p>
      <ul class="pd-highlights">${highlightHTML}</ul>
    </div>
    <div class="pd-tags">${tagsHTML}</div>
    <div class="pd-links">${githubBtn}</div>
  `;

  overlay.classList.add('open');
}

function closeProject() {
  document.getElementById('proj-overlay').classList.remove('open');
}

window.openProject  = openProject;
window.closeProject = closeProject;

/* ── Landing entry animation ────────────────────────────── */
function enterVehicle() {
  const landing = document.getElementById('landing');
  const dashboard = document.getElementById('dashboard');

  landing.classList.add('entering');

  setTimeout(() => {
    landing.style.display = 'none';
    dashboard.classList.add('visible');

    /* Build tick marks first, then animate */
    GAUGES.forEach(g => buildTicks(g.ticksId));
    setTimeout(animateGauges, 350);
  }, 680);
}

document.getElementById('enter-btn').addEventListener('click', enterVehicle);

/* Also allow clicking anywhere on the landing dash-bar screen */
document.getElementById('db-screen').addEventListener('click', enterVehicle);

/* ── Animate landing gauges after a short delay ─────────── */
/* Give fonts a moment to load before animating */
setTimeout(animateLandingGauges, 600);
