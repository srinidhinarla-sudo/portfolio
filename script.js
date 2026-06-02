'use strict';

/* ── Config ─────────────────────────────────────────────── */
const GAUGES = [
  { fillId: 'fill-left',  needleId: 'needle-left',  valId: 'val-left',  ticksId: 'ticks-left',  target: 0.87,  displayVal: '87' },
  { fillId: 'fill-right', needleId: 'needle-right', valId: 'val-right', ticksId: 'ticks-right', target: 0.925, displayVal: '3.7' }
];

const ARC_START_DEG = 150;
const ARC_SWEEP_DEG = 240;
const GAUGE_R       = 72;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;
const ARC_LENGTH    = (ARC_SWEEP_DEG / 360) * CIRCUMFERENCE;

/* ── Clock ──────────────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const el = document.getElementById('hud-clock');
  if (el) el.textContent = `${hh}:${mm}:${ss}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ── Gauge tick marks ───────────────────────────────────── */
function buildTicks(containerId) {
  const g = document.getElementById(containerId);
  if (!g) return;
  const cx = 100, cy = 100, r = 86;
  const numTicks = 24;
  for (let i = 0; i <= numTicks; i++) {
    const angleDeg = ARC_START_DEG + (i / numTicks) * ARC_SWEEP_DEG;
    const rad = (angleDeg * Math.PI) / 180;
    const isMajor = i % 4 === 0;
    const len = isMajor ? 8 : 4;
    const x1 = cx + r * Math.sin(rad);
    const y1 = cy - r * Math.cos(rad);
    const x2 = cx + (r - len) * Math.sin(rad);
    const y2 = cy - (r - len) * Math.cos(rad);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toFixed(2));
    line.setAttribute('y1', y1.toFixed(2));
    line.setAttribute('x2', x2.toFixed(2));
    line.setAttribute('y2', y2.toFixed(2));
    line.style.strokeWidth = isMajor ? '1.5' : '1';
    line.style.opacity = isMajor ? '0.7' : '0.35';
    g.appendChild(line);
  }
}

/* ── Animate gauges ─────────────────────────────────────── */
function animateGauges() {
  GAUGES.forEach(cfg => {
    const filled = ARC_LENGTH * cfg.target;
    const gap    = CIRCUMFERENCE - filled;

    const fillEl   = document.getElementById(cfg.fillId);
    const needleEl = document.getElementById(cfg.needleId);

    if (fillEl) {
      fillEl.style.strokeDasharray = `${filled.toFixed(2)} ${gap.toFixed(2)}`;
    }

    if (needleEl) {
      const deg = ARC_START_DEG + cfg.target * ARC_SWEEP_DEG;
      needleEl.style.transform = `rotate(${deg}deg)`;
    }
  });
}

/* ── Panel switching ────────────────────────────────────── */
function switchPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`panel-${name}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.d-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.panel === name);
  });

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.panel === name);
  });
}

document.querySelectorAll('.d-tab').forEach(tab => {
  tab.addEventListener('click', () => switchPanel(tab.dataset.panel));
});

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});

window.switchPanel = switchPanel;

/* ── Boot sequence ──────────────────────────────────────── */
const BOOT_LINE_IDS = ['b1', 'b2', 'b3', 'b4', 'b5'];
const BOOT_DELAYS   = [400, 900, 1400, 1900, 2400];

function runBoot() {
  const boot     = document.getElementById('boot');
  const dash     = document.getElementById('dashboard');
  const progress = document.getElementById('boot-progress');

  BOOT_LINE_IDS.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
      const pct = ((i + 1) / BOOT_LINE_IDS.length) * 100;
      if (progress) progress.style.width = pct + '%';
    }, BOOT_DELAYS[i]);
  });

  const totalDelay = BOOT_DELAYS[BOOT_LINE_IDS.length - 1] + 700;

  setTimeout(() => {
    GAUGES.forEach(g => buildTicks(g.ticksId));
    boot.classList.add('fade-out');
    dash.classList.add('visible');
    setTimeout(animateGauges, 300);
    setTimeout(() => boot.remove(), 700);
  }, totalDelay);
}

runBoot();
