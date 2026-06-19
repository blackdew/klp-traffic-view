/* map.jsx — minimal procedural city map (SVG) with route, signals, and walker. */

const SIG_COLORS = {
  green: "#1FA463",
  red: "#E5484D",
  amber: "#E8A317",
};

// Static building/road geometry, generated once.
function buildCity() {
  const vRoads = [75, 200, 345];
  const hRoads = [80, 180, 340, 500, 620];
  const RW = 13; // road half-width
  // Building cells between roads
  const xEdges = [-20, ...vRoads, 420];
  const yEdges = [-20, ...hRoads, 720];
  const blocks = [];
  for (let i = 0; i < xEdges.length - 1; i++) {
    for (let j = 0; j < yEdges.length - 1; j++) {
      let x0 = xEdges[i] + (i === 0 ? 0 : RW + 4);
      let x1 = xEdges[i + 1] - (i === xEdges.length - 2 ? 0 : RW + 4);
      let y0 = yEdges[j] + (j === 0 ? 0 : RW + 4);
      let y1 = yEdges[j + 1] - (j === yEdges.length - 2 ? 0 : RW + 4);
      const w = x1 - x0, h = y1 - y0;
      if (w < 8 || h < 8) continue;
      // split larger blocks into 1–2 parcels for texture
      const parcels = [];
      if (h > 120) {
        const cut = y0 + h * (0.45 + 0.1 * ((i + j) % 3) / 2);
        parcels.push([x0, y0, w, cut - y0 - 5]);
        parcels.push([x0, cut + 5, w, y1 - cut - 5]);
      } else {
        parcels.push([x0, y0, w, h]);
      }
      parcels.forEach((p, k) => {
        const shade = (i + j + k) % 3;
        blocks.push({ x: p[0], y: p[1], w: p[2], h: p[3], shade });
      });
    }
  }
  return { vRoads, hRoads, RW, blocks };
}

const CITY = buildCity();
const SHADES = ["#E8EAED", "#EDEFF2", "#E2E5E9"];

const MAP_THEMES = {
  light: { bg: "#F3F1EC", park: "#DCE7DA", parkLine: "#CBD9C8", road: "#FBFAF7",
    shades: ["#E8EAED", "#EDEFF2", "#E2E5E9"], casing: "#FFFFFF", route: "#2B2B30",
    walked: "#9AA0A6", dest: "#2B2B30", destDot: "#fff", marker: "#fff", passed: "#C7CBD1", walk: "#2563EB",
    green: "#1FA463", red: "#E5484D", labelText: "#fff" },
  dark: { bg: "#0E0F13", park: "#16241B", parkLine: "#1E3326", road: "#1C1E25",
    shades: ["#191B22", "#1E2129", "#15171D"], casing: "#000000", route: "#E7E9EE",
    walked: "#4A4E58", dest: "#E7E9EE", destDot: "#0E0F13", marker: "#0E0F13", passed: "#3A3E48", walk: "#5B8DEF",
    green: "#2BBE78", red: "#F0565B", labelText: "#0E0F13" },
};

function CityMap({ userDist, signalsState, mode, onSignalTap, activeSignalId, dark, a11y }) {
  const M = dark ? MAP_THEMES.dark : MAP_THEMES.light;
  const sigCol = (color) => (color === "green" ? M.green : M.red);
  // Camera: summary = whole route framed; nav = zoom on walker.
  const u = svgAtDist(userDist);
  let vb;
  if (mode === "nav") {
    const z = 190; // half viewport in svg units
    let cx = u.x, cy = u.y - 30;
    cx = Math.max(z * 0.5, Math.min(400 - z * 0.5, cx));
    cy = Math.max(z * 0.6, Math.min(700 - z * 0.6, cy));
    vb = `${cx - z / 2} ${cy - z * 0.6} ${z} ${z * 1.2}`;
  } else {
    vb = `20 30 360 620`;
  }

  return (
    <svg
      viewBox={vb}
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        background: M.bg, transition: "all 700ms cubic-bezier(.4,0,.2,1)",
      }}
    >
      {/* park near the destination */}
      <rect x={358} y={-20} width={62} height={150} fill={M.park} />
      <rect x={358} y={130} width={62} height={6} fill={M.parkLine} />

      {/* roads (drawn as wide soft strokes) */}
      <g stroke={M.road} strokeLinecap="round">
        {CITY.hRoads.map((y, i) => (
          <line key={"h" + i} x1={-20} y1={y} x2={420} y2={y} strokeWidth={CITY.RW * 2} />
        ))}
        {CITY.vRoads.map((x, i) => (
          <line key={"v" + i} x1={x} y1={-20} x2={x} y2={720} strokeWidth={CITY.RW * 2} />
        ))}
      </g>

      {/* buildings */}
      <g>
        {CITY.blocks.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={4}
            fill={M.shades[b.shade]} />
        ))}
      </g>

      {/* route: soft casing + line */}
      <path d={routePath()} fill="none" stroke={M.casing} strokeWidth={11}
        strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
      <path d={routePath()} fill="none" stroke={M.route} strokeWidth={6}
        strokeLinejoin="round" strokeLinecap="round" />
      {/* walked portion dimmed */}
      <path d={routePath()} fill="none" stroke={M.walked} strokeWidth={6}
        strokeLinejoin="round" strokeLinecap="round"
        strokeDasharray={`${routeLenBefore(userDist)} 9999`} opacity={0.9} />

      {/* destination flag */}
      {(() => {
        const d = NODES[NODES.length - 1].svg;
        return (
          <g key="dest">
            <circle cx={d.x} cy={d.y} r={9} fill={M.dest} />
            <circle cx={d.x} cy={d.y} r={3.4} fill={M.destDot} />
          </g>
        );
      })()}

      {/* signal markers */}
      {SIGNALS.map((sig) => {
        const p = svgAtDist(sig.d);
        const st = signalsState[sig.id];
        const c = st ? sigCol(st.color) : "#888";
        const active = sig.id === activeSignalId;
        const passed = userDist > sig.d + 4;
        return (
          <g key={sig.id} style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); onSignalTap && onSignalTap(sig.id); }}>
            {active && <circle cx={p.x} cy={p.y} r={17} fill={c} opacity={0.18} />}
            <circle cx={p.x} cy={p.y} r={10.5} fill={M.marker} stroke={passed ? M.passed : c}
              strokeWidth={3} />
            <circle cx={p.x} cy={p.y} r={5} fill={passed ? M.passed : c} />
            {mode === "nav" && st && !passed && (
              <g>
                <rect x={p.x - 12} y={p.y - 30} width={24} height={16} rx={5} fill={c} />
                <text x={p.x} y={p.y - 18} textAnchor="middle" fontSize={10}
                  fontWeight="700" fill={M.labelText} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(st.remain)}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* walker */}
      <g style={{ transition: "all 900ms linear" }}>
        <circle cx={u.x} cy={u.y} r={13} fill={M.walk} opacity={0.16} />
        <circle cx={u.x} cy={u.y} r={7.5} fill={M.walk} stroke={M.bg} strokeWidth={3} />
      </g>
    </svg>
  );
}

// approximate drawn length of route before given distance, for dash animation (svg units)
function routeLenBefore(dist) {
  let acc = 0;
  for (let i = 1; i < NODES.length; i++) {
    const a = NODES[i - 1], b = NODES[i];
    const segLen = Math.hypot(b.svg.x - a.svg.x, b.svg.y - a.svg.y);
    if (dist <= b.d) {
      const t = (dist - a.d) / (b.d - a.d || 1);
      return acc + segLen * Math.max(0, t);
    }
    acc += segLen;
  }
  return acc;
}

Object.assign(window, { CityMap, SIG_COLORS });
