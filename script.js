// This function runs when the button is clicked
document.getElementById('calculateBtn').addEventListener('click', calculateDeltaV);

// Reference point: delta-v budgets (approximate, from Earth's surface,
// idealized totals that in reality include gravity/drag losses).
// Values are read live from the dropdown, defaulting to LEO.

// Ring geometry (must match the r=86 circle in the SVG)
const RING_CIRCUMFERENCE = 2 * Math.PI * 86; // ≈ 540.35

document.getElementById('missionTarget').addEventListener('change', () => {
  // If there's already a result showing, refresh it against the new target
  if (document.getElementById('readoutValue').textContent !== '0') {
    calculateDeltaV();
  }
});

// Real published first-stage / booster specs.
// Exhaust velocity is derived from each engine's sea-level specific impulse (ve = Isp * 9.81).
const ROCKET_PRESETS = {
  falcon9: { wetMass: 433100, dryMass: 22200, exhaustVelocity: 2770, burnTime: 162 },
  saturnv: { wetMass: 2286000, dryMass: 135200, exhaustVelocity: 2600, burnTime: 161 },
  starship: { wetMass: 3600000, dryMass: 200000, exhaustVelocity: 3200, burnTime: 159 },
  atlasv: { wetMass: 306914, dryMass: 22461, exhaustVelocity: 3050, burnTime: 253 }
};

document.getElementById('rocketPreset').addEventListener('change', (e) => {
  const key = e.target.value;
  if (key === 'custom') return;

  const preset = ROCKET_PRESETS[key];
  document.getElementById('wetMass').value = preset.wetMass;
  document.getElementById('dryMass').value = preset.dryMass;
  document.getElementById('exhaustVelocity').value = preset.exhaustVelocity;
  document.getElementById('burnTime').value = preset.burnTime;

  calculateDeltaV();
});

// If the person edits any field by hand after picking a preset, drop back to "Custom"
['wetMass', 'dryMass', 'exhaustVelocity', 'burnTime'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById('rocketPreset').value = 'custom';
  });
});

function calculateDeltaV() {
  const wetMass = parseFloat(document.getElementById('wetMass').value);
  const dryMass = parseFloat(document.getElementById('dryMass').value);
  const exhaustVelocity = parseFloat(document.getElementById('exhaustVelocity').value);
  const burnTime = parseFloat(document.getElementById('burnTime').value);
  const orbitalThreshold = parseFloat(document.getElementById('missionTarget').value);

  const readoutValue = document.getElementById('readoutValue');
  const heroCaption = document.getElementById('heroCaption');
  const ringFill = document.getElementById('ringFill');

  // Validate inputs
  if (isNaN(wetMass) || isNaN(dryMass) || isNaN(exhaustVelocity) || isNaN(burnTime)) {
    heroCaption.textContent = 'Fill in all four fields with numbers';
    return;
  }
  if (dryMass <= 0 || wetMass <= 0 || exhaustVelocity <= 0 || burnTime <= 0) {
    heroCaption.textContent = 'All values must be greater than zero';
    return;
  }
  if (dryMass >= wetMass) {
    heroCaption.textContent = 'Wet mass must exceed dry mass';
    return;
  }

  // The rocket equation: deltaV = exhaustVelocity * ln(wetMass / dryMass)
  const deltaV = exhaustVelocity * Math.log(wetMass / dryMass);

  // Update the big number in the ring
  readoutValue.textContent = Math.round(deltaV).toLocaleString();

  // Update the ring gauge — percent of the way to the selected target
  const percent = Math.min(deltaV / orbitalThreshold, 1);
  const offset = RING_CIRCUMFERENCE * (1 - percent);
  ringFill.style.strokeDashoffset = offset;

  let color, caption;
  if (percent < 0.4) {
    color = 'var(--red)';
    caption = 'Far below target velocity';
  } else if (percent < 0.85) {
    color = 'var(--yellow)';
    caption = 'Approaching target velocity';
  } else {
    color = 'var(--green)';
    caption = 'Meets target velocity';
  }
  ringFill.style.stroke = color;
  heroCaption.textContent = caption;

  // Update stat chips
  document.getElementById('orbitPct').textContent = Math.round(percent * 100) + '%';
  document.getElementById('massRatio').textContent = (wetMass / dryMass).toFixed(1) + ':1';
  document.getElementById('burnDisplay').textContent = burnTime + 's';

  // Build the delta-v curve over the burn (constant fuel burn rate assumed)
  const points = [];
  const steps = 100;
  const fuelMass = wetMass - dryMass;

  for (let i = 0; i <= steps; i++) {
    const t = (burnTime * i) / steps;
    const currentMass = wetMass - (fuelMass * i) / steps;
    const currentDeltaV = exhaustVelocity * Math.log(wetMass / currentMass);
    points.push({ t: t, deltaV: currentDeltaV });
  }

  drawChart(points);
}

function drawChart(points) {
  const canvas = document.getElementById('chart');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padTop = 20;
  const padBottom = 30;
  const padSide = 14;

  ctx.clearRect(0, 0, width, height);

  const maxT = points[points.length - 1].t;
  const maxDeltaV = points[points.length - 1].deltaV;

  function xPos(t) {
    return padSide + (t / maxT) * (width - padSide * 2);
  }
  function yPos(deltaV) {
    return height - padBottom - (deltaV / maxDeltaV) * (height - padTop - padBottom);
  }

  // Gradient fill under the curve (WHOOP-style soft area fill)
  const gradient = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
  gradient.addColorStop(0, 'rgba(0,229,160,0.28)');
  gradient.addColorStop(1, 'rgba(0,229,160,0)');

  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xPos(p.t);
    const y = yPos(p.deltaV);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(xPos(maxT), height - padBottom);
  ctx.lineTo(xPos(0), height - padBottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // The line itself
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xPos(p.t);
    const y = yPos(p.deltaV);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#00e5a0';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // End point dot
  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(xPos(last.t), yPos(last.deltaV), 4, 0, Math.PI * 2);
  ctx.fillStyle = '#00e5a0';
  ctx.fill();

  // Minimal axis labels
  ctx.fillStyle = '#7a7a80';
  ctx.font = '600 11px Inter, sans-serif';
  ctx.fillText('0s', padSide, height - 8);
  ctx.fillText(maxT.toFixed(0) + 's', width - padSide - 26, height - 8);
}
