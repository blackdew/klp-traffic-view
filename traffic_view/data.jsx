/* data.jsx — route geometry, traffic-signal data, and timing logic
   All signals are pedestrian crossings. SVG coords live in a 400x700 viewBox. */

// Route nodes: start + signals + destination, in walking order.
// d = cumulative distance from start (meters). svg = position in map.
const NODES = [
  { id: "start", name: "현재 위치", svg: { x: 55, y: 620 }, d: 0 },
  { id: "s1", name: "중앙로 입구 횡단보도", svg: { x: 75, y: 500 }, d: 110 },
  { id: "s2", name: "중앙로 사거리", svg: { x: 200, y: 500 }, d: 240 },
  { id: "s3", name: "구립도서관 앞", svg: { x: 200, y: 340 }, d: 400 },
  { id: "s4", name: "시청역 사거리", svg: { x: 345, y: 340 }, d: 540 },
  { id: "s5", name: "근린공원 횡단보도", svg: { x: 345, y: 180 }, d: 700 },
  { id: "dest", name: "도착", svg: { x: 345, y: 80 }, d: 800 },
];

// Signal definitions (the crossings). cycle = green + red (seconds). offset phases them.
const SIGNALS = [
  { id: "s1", name: "중앙로 입구 횡단보도", cross: "왕복 4차로", d: 110, green: 28, red: 36, offset: 5 },
  { id: "s2", name: "중앙로 사거리", cross: "왕복 6차로", d: 240, green: 24, red: 44, offset: 31 },
  { id: "s3", name: "구립도서관 앞", cross: "왕복 2차로", d: 400, green: 35, red: 25, offset: 12 },
  { id: "s4", name: "시청역 사거리", cross: "왕복 8차로", d: 540, green: 22, red: 48, offset: 50 },
  { id: "s5", name: "근린공원 횡단보도", cross: "왕복 4차로", d: 700, green: 30, red: 30, offset: 18 },
];

const TOTAL_DIST = 800;        // meters
const BASE_SPEED = 1.25;       // comfortable walking m/s (~4.5 km/h)
const SPEED_MIN = 0.7;         // slowest we'd recommend
const SPEED_MAX = 1.95;        // fastest brisk walk

// ---- timing logic -----------------------------------------------------------

// Current phase of a signal at absolute time `t` (seconds).
function signalPhase(sig, t) {
  const cycle = sig.green + sig.red;
  let p = ((t + sig.offset) % cycle + cycle) % cycle;
  if (p < sig.green) {
    return { color: "green", remain: sig.green - p, cycle };
  }
  return { color: "red", remain: cycle - p, cycle };
}

// List of upcoming green windows (start,end relative to now) within `horizon` seconds.
function greenWindows(sig, now, horizon = 180) {
  const cycle = sig.green + sig.red;
  let p = ((now + sig.offset) % cycle + cycle) % cycle;
  const windows = [];
  // time until the start of the next green window (0 if currently green)
  let firstStart;
  if (p < sig.green) {
    windows.push({ start: 0, end: sig.green - p });
    firstStart = sig.green - p + sig.red; // next green after this one ends + red
  } else {
    firstStart = cycle - p;
  }
  let s = firstStart;
  while (s < horizon) {
    windows.push({ start: s, end: s + sig.green });
    s += cycle;
  }
  return windows;
}

// Recommended speed (m/s) to reach a signal `dist` meters ahead during a green window.
// Returns { speed, arrive: 'green'|'caution', etaIn, hint, advice }
function recommendSpeed(distAhead, sig, now) {
  if (distAhead <= 0) return { speed: BASE_SPEED, arrive: "green", etaIn: 0, hint: "유지", advice: "" };
  const windows = greenWindows(sig, now, 200);
  // For each window, the speed needed to arrive between start and end.
  // Prefer arriving a touch after green starts, at a speed nearest BASE_SPEED.
  let best = null;
  for (const w of windows) {
    // feasible arrival time band for THIS window
    const tEarliest = Math.max(w.start + 1, distAhead / SPEED_MAX);
    const tLatest = Math.min(w.end - 1, distAhead / SPEED_MIN);
    if (tEarliest > tLatest) continue; // can't make this window comfortably
    // pick arrival time giving speed closest to BASE_SPEED
    const tIdeal = distAhead / BASE_SPEED;
    const tArrive = Math.min(Math.max(tIdeal, tEarliest), tLatest);
    const speed = distAhead / tArrive;
    const score = Math.abs(speed - BASE_SPEED);
    if (!best || score < best.score) {
      best = { speed, score, etaIn: tArrive, arrive: "green" };
    }
  }
  if (!best) {
    // Can't comfortably hit any green — just walk at base speed (will wait).
    return {
      speed: BASE_SPEED,
      arrive: "caution",
      etaIn: distAhead / BASE_SPEED,
      hint: "유지",
      advice: "다음 신호에서 잠시 대기할 수 있어요",
    };
  }
  const diff = best.speed - BASE_SPEED;
  let hint = "유지";
  if (diff > 0.18) hint = "조금 빠르게";
  else if (diff < -0.18) hint = "천천히";
  const advice =
    hint === "천천히"
      ? "초록불에 맞춰 천천히 걸으세요"
      : hint === "조금 빠르게"
      ? "초록불을 놓치지 않게 발걸음을 재촉하세요"
      : "지금 속도를 유지하세요";
  return { speed: best.speed, arrive: "green", etaIn: best.etaIn, hint, advice };
}

// Interpolate an SVG point at a given cumulative distance along the route.
function svgAtDist(d) {
  d = Math.max(0, Math.min(TOTAL_DIST, d));
  for (let i = 1; i < NODES.length; i++) {
    const a = NODES[i - 1], b = NODES[i];
    if (d <= b.d) {
      const t = (d - a.d) / (b.d - a.d || 1);
      return { x: a.svg.x + (b.svg.x - a.svg.x) * t, y: a.svg.y + (b.svg.y - a.svg.y) * t };
    }
  }
  const last = NODES[NODES.length - 1];
  return { ...last.svg };
}

// Build the route polyline path string.
function routePath() {
  return NODES.map((n, i) => `${i === 0 ? "M" : "L"} ${n.svg.x} ${n.svg.y}`).join(" ");
}

const mmss = (sec) => {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}`;
};
const kmh = (ms) => (ms * 3.6).toFixed(1);
const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`);

Object.assign(window, {
  NODES, SIGNALS, TOTAL_DIST, BASE_SPEED, SPEED_MIN, SPEED_MAX,
  signalPhase, greenWindows, recommendSpeed, svgAtDist, routePath,
  mmss, kmh, fmtDist,
});
