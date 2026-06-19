/* app.jsx — screens, app shell, and the live signal clock. */

const { useState, useEffect, useRef, useMemo } = React;

// ---------- theming: light / dark(야간) / a11y(접근성 고대비) ----------
const PALETTES = {
  light: {
    bg: "#F3F1EC", surface: "#FFFFFF", ink: "#1C1D21", ink2: "#6B7079", ink3: "#9AA0A6",
    line: "#ECEAE4", line2: "#E2DFD8", primary: "#1C1D21", primaryText: "#FFFFFF",
    green: "#1FA463", red: "#E5484D", amber: "#E8A317", walk: "#2563EB",
    handleBar: "#D9D6CF", scrim: "rgba(243,241,236,.9)",
  },
  dark: {
    bg: "#14151A", surface: "#1E2027", ink: "#F2F3F5", ink2: "#A4A9B3", ink3: "#6E747F",
    line: "#2A2D36", line2: "#343842", primary: "#F2F3F5", primaryText: "#14151A",
    green: "#2BBE78", red: "#F0565B", amber: "#F0B53D", walk: "#5B8DEF",
    handleBar: "#3A3E48", scrim: "rgba(20,21,26,.92)",
  },
  // 접근성: 순수 흑백 고대비 + 진한 신호색 (라이트/다크 위에 덮어씀)
  a11yLight: {
    bg: "#FFFFFF", surface: "#FFFFFF", ink: "#000000", ink2: "#1F1F1F", ink3: "#4A4A4A",
    line: "#000000", line2: "#000000", primary: "#000000", primaryText: "#FFFFFF",
    green: "#0A7D3C", red: "#C8102E", amber: "#A85D00", walk: "#0033CC",
    handleBar: "#000000", scrim: "rgba(255,255,255,.92)",
  },
  a11yDark: {
    bg: "#000000", surface: "#101216", ink: "#FFFFFF", ink2: "#E6E6E6", ink3: "#B5B5B5",
    line: "#FFFFFF", line2: "#FFFFFF", primary: "#FFFFFF", primaryText: "#000000",
    green: "#34E08A", red: "#FF6168", amber: "#FFC83D", walk: "#7AA7FF",
    handleBar: "#FFFFFF", scrim: "rgba(0,0,0,.92)",
  },
};

// `C` is reassigned by applyTheme; components read it live at render time.
let C = { ...PALETTES.light, fs: 1, a11y: false, dark: false };

function applyTheme({ dark, a11y }) {
  let base = dark ? PALETTES.dark : PALETTES.light;
  if (a11y) base = dark ? PALETTES.a11yDark : PALETTES.a11yLight;
  C = { ...base, fs: a11y ? 1.16 : 1, a11y: !!a11y, dark: !!dark };
  rebuildTokens();
}

// ---------- small UI atoms ----------
function StatusBar() {
  return (
    <div style={{
      height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 22px", fontSize: 14, fontWeight: 600, color: C.ink, flex: "0 0 auto",
      position: "relative", zIndex: 5,
    }}>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Bars /><span style={{ fontSize: 12 }}>5G</span><Battery />
      </div>
    </div>
  );
}
const Bars = () => (
  <svg width="17" height="11" viewBox="0 0 17 11"><g fill={C.ink}>
    <rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" />
    <rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" />
  </g></svg>
);
const Battery = () => (
  <svg width="25" height="12" viewBox="0 0 25 12">
    <rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke={C.ink} opacity="0.4" />
    <rect x="2" y="2" width="16" height="8" rx="1.5" fill={C.ink} />
    <rect x="23" y="3.5" width="1.6" height="5" rx="0.8" fill={C.ink} opacity="0.4" />
  </svg>
);

function PedIcon({ color = "#fff", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4.5" r="2.2" fill={color} />
      <path d="M12 7.5c-1 0-1.7.6-2 1.6l-1.3 4.2M12 7.5c1 0 1.7.6 2 1.6l1.1 3.6M10 13l-1.4 5.5M10 13l3.3.2 1.5 5.3M13.3 13.2l-1 4"
        stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function StopIcon({ color = "#fff", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 13.5V8a2 2 0 0 1 4 0M10 9V6.5a1.8 1.8 0 0 1 3.6 0V9M13.6 9.2V7.4a1.7 1.7 0 0 1 3.4 0V14c0 3.3-2.2 5.5-5.2 5.5-2 0-3.2-.8-4.4-2.6l-2-3c-.6-1 .3-2.2 1.4-1.8l1.6.8"
        stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GearIcon({ color = "#000", size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function VoiceIcon({ color = "#000", size = 18, muted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 9.5v5h3l4.5 4v-13L7 9.5H4Z" fill={color} stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      {muted ? (
        <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M15 9c1.2 1 1.2 5 0 6M17.8 7c2.4 1.8 2.4 8.2 0 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}
function SunMoonIcon({ color = "#000", size = 18, dark }) {
  return dark ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 14.5A8 8 0 1 1 10.2 4 6.3 6.3 0 0 0 20 14.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.3" stroke={color} strokeWidth="1.8" />
      <path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function A11yIcon({ color = "#000", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4" r="1.9" fill={color} />
      <path d="M4.5 7.5c2.4 1 4.8 1.5 7.5 1.5s5.1-.5 7.5-1.5M12 8.7v6M12 14.7l-3 6.3M12 14.7l3 6.3"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function WaveBars({ color, active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2.5, height: 16 }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{
          width: 3, borderRadius: 3, background: color,
          height: active ? undefined : 5,
          animation: active ? `tvwave 0.9s ${i * 0.12}s ease-in-out infinite` : "none",
        }} />
      ))}
    </div>
  );
}

function SignalChip({ color, remain, small }) {
  const isGreen = color === "green";
  const bg = isGreen ? C.green : C.red;
  const txt = C.a11y && C.dark ? "#000" : "#fff";
  const big = C.a11y && !small;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: bg, color: txt, borderRadius: 999,
      padding: small ? "3px 9px 3px 7px" : "5px 12px 5px 9px",
      fontSize: (small ? 12 : 13) * (big ? 1.12 : 1), fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {isGreen ? <PedIcon size={small ? 13 : 15} color={txt} /> : <StopIcon size={small ? 13 : 15} color={txt} />}
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(remain)}초</span>
    </div>
  );
}

// ---------- SEARCH ----------
const RECENTS = [
  { name: "시청역 2번 출구", sub: "도보 11분 · 800m", icon: "🚇" },
  { name: "서울광장 광장", sub: "도보 9분 · 700m", icon: "🌳" },
  { name: "덕수궁 정문", sub: "도보 6분 · 420m", icon: "🏛️" },
];

function DataBadge({ source }) {
  const map = {
    connecting: { c: C.amber, t: "서울 실시간 연결 중…" },
    live: { c: C.green, t: "서울 실시간 신호 연동" },
    sim: { c: C.ink3, t: "시뮬레이션 모드" },
  };
  const s = map[source] || map.sim;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 9px",
      borderRadius: 999, background: C.surface, border: C.a11y ? `2px solid ${C.ink}` : "none",
      boxShadow: C.dark ? "0 1px 6px rgba(0,0,0,.4)" : "0 1px 6px rgba(28,29,33,.07)" }}>
      <span style={{ width: 8, height: 8, borderRadius: 8, background: s.c,
        animation: source === "connecting" ? "tvpulse 1.1s ease-in-out infinite" : "none" }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: C.ink2, whiteSpace: "nowrap" }}>{s.t}</span>
    </div>
  );
}

function SearchScreen({ onRoute, onSettings, settings, dataSource }) {
  const [q, setQ] = useState("");
  const modeOn = settings.dark || settings.a11y || settings.voice !== false;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "0 0 auto", padding: "4px 18px 14px", background: C.bg }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <DataBadge source={dataSource} />
          <button onClick={onSettings} aria-label="설정" style={{
            position: "relative", width: 42, height: 42, borderRadius: 13, border: C.a11y ? `2px solid ${C.ink}` : "none",
            background: C.surface, cursor: "pointer", display: "grid", placeItems: "center",
            boxShadow: C.dark ? "0 2px 10px rgba(0,0,0,.4)" : "0 2px 10px rgba(28,29,33,.1)",
          }}>
            <GearIcon color={C.ink} />
            {modeOn && <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 8, background: C.green, border: `2px solid ${C.surface}` }} />}
          </button>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, whiteSpace: "nowrap", marginBottom: 14 }}>
          어디로 갈까요?
        </div>
        {/* from / to */}
        <div style={{ background: C.surface, borderRadius: 18, padding: 6, boxShadow: C.dark ? "0 2px 14px rgba(0,0,0,.4)" : "0 2px 14px rgba(28,29,33,.06)" }}>
          <Field dot={<span style={{ width: 9, height: 9, borderRadius: 9, border: `3px solid ${C.walk}` }} />}
            value="현재 위치" muted />
          <div style={{ height: 1, background: C.line, margin: "0 14px" }} />
          <Field
            dot={<span style={{ width: 9, height: 9, borderRadius: 2, background: C.ink }} />}
            input value={q} onChange={setQ} placeholder="도착지 검색" />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 6px 18px", background: C.bg }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink3, padding: "8px 16px 6px" }}>최근 검색</div>
        {RECENTS.map((r, i) => (
          <button key={i} onClick={() => onRoute(r.name)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "12px 16px",
              background: "none", border: "none", cursor: "pointer", textAlign: "left",
            }}>
            <span style={{ fontSize: 20, width: 40, height: 40, borderRadius: 12, background: C.surface,
              display: "grid", placeItems: "center", boxShadow: "0 1px 4px rgba(28,29,33,.05)" }}>{r.icon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 16, fontWeight: 600, color: C.ink }}>{r.name}</span>
              <span style={{ display: "block", fontSize: 13, color: C.ink3, marginTop: 2 }}>{r.sub}</span>
            </span>
            <span style={{ color: C.ink3, fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
function Field({ dot, value, onChange, placeholder, input, muted }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
      <span style={{ display: "grid", placeItems: "center", width: 14 }}>{dot}</span>
      {input ? (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontWeight: 600,
            color: C.ink, background: "none", fontFamily: "inherit" }} />
      ) : (
        <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: muted ? C.ink2 : C.ink }}>{value}</span>
      )}
    </div>
  );
}

// ---------- SUMMARY ----------
function SummaryScreen({ dest, signalsState, simNow, onStart, onBack, onSignalTap }) {
  const greenCount = SIGNALS.filter((s) => signalsState[s.id]?.color === "green").length;
  // crude expected total wait: half of red cycle on average per signal we'd hit on red
  const expWait = useMemo(() => {
    let w = 0;
    SIGNALS.forEach((s) => { w += (s.red * s.red) / (2 * (s.green + s.red)); });
    return Math.round(w);
  }, []);
  const walkMin = Math.round(TOTAL_DIST / BASE_SPEED / 60);
  const arrive = new Date(Date.now() + (walkMin * 60 + expWait) * 1000);
  const arriveStr = `${arrive.getHours()}:${String(arrive.getMinutes()).padStart(2, "0")}`;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", pointerEvents: "none" }}>
      <div style={{ flex: "0 0 auto", padding: "8px 16px", pointerEvents: "auto" }}>
        <button onClick={onBack} style={roundBtn}>‹</button>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{
        flex: "0 0 auto", background: C.surface, borderRadius: "26px 26px 0 0",
        boxShadow: "0 -6px 28px rgba(28,29,33,.12)", padding: "10px 20px 22px", pointerEvents: "auto",
        maxHeight: "62%", display: "flex", flexDirection: "column",
      }}>
        <div style={handle} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, fontVariantNumeric: "tabular-nums" }}>
            {walkMin}분
          </span>
          <span style={{ fontSize: 15, color: C.ink2, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtDist(TOTAL_DIST)} · {arriveStr} 도착</span>
        </div>
        <div style={{ fontSize: 14, color: C.ink2, marginTop: 3 }}>{dest}까지 보행자 경로</div>

        {/* stat row */}
        <div style={{ display: "flex", gap: 10, margin: "16px 0 6px" }}>
          <Stat big={`${SIGNALS.length}개`} label="신호등" />
          <Stat big={`약 ${expWait}초`} label="예상 대기" />
          <Stat big={`${greenCount}/${SIGNALS.length}`} label="현재 초록불" accent={C.green} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink3, margin: "12px 2px 4px" }}>경로 신호등</div>
        <div style={{ overflowY: "auto", margin: "0 -4px" }}>
          {SIGNALS.map((s) => {
            const st = signalsState[s.id];
            return (
              <button key={s.id} onClick={() => onSignalTap(s.id)} style={listRow}>
                <span style={{ width: 28, color: C.ink3, fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {fmtDist(s.d)}
                </span>
                <span style={{ flex: 1, textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: C.ink }}>{s.name}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: C.ink3 }}>{s.cross}</span>
                </span>
                {st && <SignalChip color={st.color} remain={st.remain} small />}
              </button>
            );
          })}
        </div>

        <button onClick={onStart} style={{ ...primaryBtn, marginTop: 14 }}>
          <PedIcon size={18} /> 안내 시작
        </button>
      </div>
    </div>
  );
}
function Stat({ big, label, accent }) {
  return (
    <div style={{ flex: 1, background: C.bg, borderRadius: 14, padding: "11px 12px" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent || C.ink, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{big}</div>
      <div style={{ fontSize: 12, color: C.ink2, marginTop: 1 }}>{label}</div>
    </div>
  );
}

// ---------- NAV ----------
function NavScreen({ userDist, signalsState, simNow, speedMul, setSpeedMul, onSignalTap, onExit,
  caption, voiceEnabled, canMuteVoice, onToggleVoice, a11y }) {
  const nextSig = SIGNALS.find((s) => s.d > userDist - 2) || null;
  const distAhead = nextSig ? Math.max(0, nextSig.d - userDist) : 0;
  const phase = nextSig ? signalsState[nextSig.id] : null;
  const rec = nextSig ? recommendSpeed(distAhead, nextSig, simNow) : null;
  const atSignal = nextSig && distAhead < 6;
  const fs = C.fs;
  const tile = a11y ? 110 : 92;
  const upcoming = SIGNALS.filter((s) => s.d > userDist - 2);
  const sh = C.dark ? "0 6px 26px rgba(0,0,0,.5)" : "0 6px 26px rgba(28,29,33,.14)";

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", pointerEvents: "none" }}>
      {/* TOP: next signal banner */}
      <div style={{ flex: "0 0 auto", padding: "8px 14px 0", pointerEvents: "auto" }}>
        <div style={{
          background: C.surface, borderRadius: 22, padding: 16,
          boxShadow: sh, border: a11y ? `2px solid ${C.ink}` : "none",
        }}>
          {nextSig ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13 * fs, fontWeight: 700, color: C.ink3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {fmtDist(distAhead)} 앞 · {nextSig.name}
                </div>
                <button onClick={onToggleVoice} aria-label="음성 안내"
                  style={{ ...roundBtnSm, flex: "0 0 auto", opacity: canMuteVoice ? 1 : 0.55, background: voiceEnabled ? C.green : roundBtnSm.background, display: "grid", placeItems: "center" }}>
                  <VoiceIcon size={15} color={voiceEnabled ? (C.a11y && C.dark ? "#000" : "#fff") : C.ink2} muted={!voiceEnabled} />
                </button>
                <button onClick={onExit} style={{ ...roundBtnSm, flex: "0 0 auto" }}>✕</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                {/* big countdown */}
                <div style={{
                  width: tile, height: tile, borderRadius: 24, flex: "0 0 auto",
                  background: phase?.color === "green" ? C.green : C.red,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  color: C.a11y && C.dark ? "#000" : "#fff",
                }}>
                  {phase?.color === "green" ? <PedIcon size={a11y ? 26 : 22} color={C.a11y && C.dark ? "#000" : "#fff"} /> : <StopIcon size={a11y ? 26 : 22} color={C.a11y && C.dark ? "#000" : "#fff"} />}
                  <span style={{ fontSize: a11y ? 40 : 30, fontWeight: 800, lineHeight: 1, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
                    {phase ? Math.round(phase.remain) : "--"}
                  </span>
                </div>
                {/* recommendation */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: (atSignal ? 16 : 14) * fs, fontWeight: atSignal ? 800 : 600,
                    color: atSignal ? (phase?.color === "green" ? C.green : C.red) : C.ink, marginBottom: 8, minHeight: 38 }}>
                    {atSignal
                      ? (phase?.color === "green" ? "지금 건너세요" : "잠시 기다리세요")
                      : (rec?.advice || "")}
                  </div>
                  <SpeedGauge rec={rec} />
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 16 * fs, fontWeight: 700, color: C.ink, padding: 6 }}>경로의 모든 신호등을 지났어요</div>
          )}
        </div>

        {/* voice caption bar */}
        {voiceEnabled && caption && (
          <div style={{
            marginTop: 8, display: "flex", alignItems: "center", gap: 10,
            background: C.ink, color: C.bg, borderRadius: 14, padding: a11y ? "12px 14px" : "9px 13px",
            boxShadow: sh,
          }}>
            <WaveBars color={C.bg} active={true} />
            <span style={{ flex: 1, fontSize: (a11y ? 15 : 13) * 1, fontWeight: 600, lineHeight: 1.35 }}>{caption}</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* BOTTOM: progress + upcoming list */}
      <div style={{
        flex: "0 0 auto", background: C.surface, borderRadius: "26px 26px 0 0",
        boxShadow: C.dark ? "0 -6px 28px rgba(0,0,0,.5)" : "0 -6px 28px rgba(28,29,33,.12)",
        padding: "10px 18px 18px", pointerEvents: "auto", border: a11y ? `2px solid ${C.ink}` : "none",
        borderBottom: "none", maxHeight: "46%", display: "flex", flexDirection: "column",
      }}>
        <div style={handle} />
        {/* progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 10px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 7, borderRadius: 7, background: C.line, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(userDist / TOTAL_DIST) * 100}%`,
                background: C.ink, borderRadius: 7, transition: "width 900ms linear" }} />
            </div>
            <div style={{ fontSize: 12.5 * fs, color: C.ink2, marginTop: 5 }}>
              {fmtDist(TOTAL_DIST - userDist)} 남음 · 남은 신호 {upcoming.length}개
            </div>
          </div>
          <SpeedToggle val={speedMul} set={setSpeedMul} />
        </div>

        <div style={{ overflowY: "auto", margin: "0 -2px" }}>
          {upcoming.map((s) => {
            const st = signalsState[s.id];
            return (
              <button key={s.id} onClick={() => onSignalTap(s.id)} style={{ ...listRow, padding: "10px 6px" }}>
                <span style={{ width: 30, color: C.ink3, fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {fmtDist(Math.max(0, s.d - userDist))}
                </span>
                <span style={{ flex: 1, textAlign: "left", fontSize: 14.5, fontWeight: 600, color: C.ink }}>{s.name}</span>
                {st && <SignalChip color={st.color} remain={st.remain} small />}
              </button>
            );
          })}
          {upcoming.length === 0 && (
            <div style={{ textAlign: "center", color: C.ink2, fontSize: 14, padding: "14px 0" }}>곧 도착합니다</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpeedGauge({ rec }) {
  if (!rec) return null;
  // map speed (SPEED_MIN..SPEED_MAX) to 0..1
  const t = Math.max(0, Math.min(1, (rec.speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)));
  const color = rec.hint === "유지" ? C.green : rec.hint === "천천히" ? C.amber : C.red;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: C.ink3, fontWeight: 700, whiteSpace: "nowrap" }}>권장 속도</span>
        <span><span style={{ fontSize: 19, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{kmh(rec.speed)}</span>
          <span style={{ fontSize: 12, color: C.ink2, fontWeight: 600 }}> km/h</span></span>
      </div>
      <div style={{ position: "relative", height: 8, borderRadius: 8,
        background: "linear-gradient(90deg,#E8A317 0%,#1FA463 50%,#E5484D 100%)", opacity: 0.85 }}>
        <div style={{ position: "absolute", top: -3, left: `calc(${t * 100}% - 7px)`, width: 14, height: 14,
          borderRadius: 14, background: "#fff", border: `3px solid ${color}`, transition: "left 600ms ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.ink3, marginTop: 4, fontWeight: 600, whiteSpace: "nowrap" }}>
        <span>천천히</span><span style={{ color, fontWeight: 800 }}>{rec.hint}</span><span>빠르게</span>
      </div>
    </div>
  );
}
function SpeedToggle({ val, set }) {
  return (
    <div style={{ display: "flex", background: C.bg, borderRadius: 10, padding: 3, gap: 2 }}>
      {[1, 2, 4].map((m) => (
        <button key={m} onClick={() => set(m)} style={{
          border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "5px 9px",
          borderRadius: 8, fontVariantNumeric: "tabular-nums",
          background: val === m ? C.ink : "transparent", color: val === m ? "#fff" : C.ink2,
        }}>{m}×</button>
      ))}
    </div>
  );
}

// ---------- SIGNAL DETAIL (sheet over map) ----------
function DetailSheet({ sigId, signalsState, userDist, onClose }) {
  const sig = SIGNALS.find((s) => s.id === sigId);
  const st = signalsState[sigId];
  if (!sig || !st) return null;
  const distAhead = sig.d - userDist;
  const gPct = (sig.green / st.cycle) * 100;
  // marker position along the cycle bar
  const elapsedInCycle = st.color === "green" ? sig.green - st.remain : sig.green + (sig.red - st.remain);
  const markPct = (elapsedInCycle / st.cycle) * 100;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,20,24,.28)" }} />
      <div style={{ position: "relative", background: C.surface, borderRadius: "26px 26px 0 0", padding: "10px 22px 24px",
        boxShadow: "0 -10px 40px rgba(0,0,0,.2)" }}>
        <div style={handle} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, color: C.ink, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{sig.name}</div>
            <div style={{ fontSize: 14, color: C.ink2, marginTop: 2 }}>보행자 신호 · {sig.cross}
              {distAhead > 0 && ` · ${fmtDist(distAhead)} 앞`}</div>
          </div>
          <button onClick={onClose} style={roundBtnSm}>✕</button>
        </div>

        {/* big state */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "18px 0 8px" }}>
          <div style={{ width: 104, height: 104, borderRadius: 28, flex: "0 0 auto",
            background: st.color === "green" ? C.green : C.red, color: C.a11y && C.dark ? "#000" : "#fff",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {st.color === "green" ? <PedIcon size={26} color={C.a11y && C.dark ? "#000" : "#fff"} /> : <StopIcon size={26} color={C.a11y && C.dark ? "#000" : "#fff"} />}
            <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{Math.round(st.remain)}</span>
            <span style={{ fontSize: 12, opacity: 0.9, fontWeight: 600, whiteSpace: "nowrap" }}>초 남음</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: st.color === "green" ? C.green : C.red, marginBottom: 8 }}>
              {st.color === "green" ? "보행 가능" : "정지 · 대기"}
            </div>
            <Row k="초록불 시간" v={`${sig.green}초`} />
            <Row k="빨간불 시간" v={`${sig.red}초`} />
            <Row k="전체 주기" v={`${st.cycle}초`} />
          </div>
        </div>

        {/* cycle timeline */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink3, marginBottom: 6 }}>신호 주기</div>
          <div style={{ position: "relative", height: 14, borderRadius: 7, overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${gPct}%`, background: C.green }} />
            <div style={{ flex: 1, background: C.red }} />
            <div style={{ position: "absolute", top: -3, left: `calc(${markPct}% - 2px)`, width: 4, height: 20,
              background: C.ink, borderRadius: 3, boxShadow: "0 0 0 2px #fff", transition: "left 400ms linear" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.ink3, marginTop: 5, fontWeight: 600 }}>
            <span>초록 {sig.green}s</span><span>빨강 {sig.red}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function Row({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14, gap: 10 }}>
      <span style={{ color: C.ink2, whiteSpace: "nowrap" }}>{k}</span>
      <span style={{ color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>
  );
}

// ---------- SETTINGS ----------
function SettingsSheet({ settings, setSetting, onClose }) {
  const a11y = !!settings.a11y;
  const items = [
    {
      key: "dark", on: !!settings.dark, icon: <SunMoonIcon color={C.ink} dark={!!settings.dark} />,
      title: "야간 보행 모드", sub: "어두운 화면 · 눈부심 감소", toggle: () => setSetting("dark", !settings.dark),
    },
    {
      key: "voice", on: a11y || settings.voice !== false, icon: <VoiceIcon color={C.ink} muted={!(a11y || settings.voice !== false)} />,
      title: "음성 안내", sub: a11y ? "접근성 모드에서 항상 켜짐" : "신호 상태·건너기 시점을 말로 안내",
      toggle: () => !a11y && setSetting("voice", settings.voice === false), locked: a11y,
    },
    {
      key: "a11y", on: a11y, icon: <A11yIcon color={C.ink} />,
      title: "접근성 모드", sub: "고대비 · 큰 글씨 · 음성·진동 강화", toggle: () => setSetting("a11y", !settings.a11y),
    },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)" }} />
      <div style={{ position: "relative", background: C.surface, borderRadius: "26px 26px 0 0", padding: "10px 20px 26px",
        boxShadow: "0 -10px 40px rgba(0,0,0,.3)" }}>
        <div style={handle} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0 14px" }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.ink, whiteSpace: "nowrap" }}>설정</div>
          <button onClick={onClose} style={roundBtnSm}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it) => (
            <button key={it.key} onClick={it.toggle} disabled={it.locked} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16,
              background: C.bg, border: C.a11y ? `2px solid ${C.ink}` : "none",
              cursor: it.locked ? "default" : "pointer", textAlign: "left", opacity: it.locked ? 0.7 : 1,
            }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: C.surface, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                {it.icon}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: C.ink }}>{it.title}</span>
                <span style={{ display: "block", fontSize: 12.5, color: C.ink3, marginTop: 2 }}>{it.sub}</span>
              </span>
              <Switch on={it.on} />
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.ink3, marginTop: 16, lineHeight: 1.5, textAlign: "center" }}>
          설정은 이 기기에 저장돼요. 안내 중에도 음성 버튼으로 빠르게 켜고 끌 수 있어요.
        </div>
      </div>
    </div>
  );
}
function Switch({ on }) {
  return (
    <span style={{
      width: 46, height: 28, borderRadius: 28, flex: "0 0 auto", position: "relative",
      background: on ? C.green : (C.dark ? "#3A3E48" : "#D5D2CB"), transition: "background 200ms",
      border: C.a11y ? `2px solid ${C.ink}` : "none",
    }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 22,
        background: "#fff", transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
      }} />
    </span>
  );
}

// ---------- shared style tokens (rebuilt on theme change) ----------
let handle, roundBtn, roundBtnSm, primaryBtn, listRow;
function rebuildTokens() {
  handle = { width: 38, height: 5, borderRadius: 5, background: C.handleBar, margin: "0 auto 4px" };
  roundBtn = { width: 40, height: 40, borderRadius: 13, border: C.a11y ? `2px solid ${C.ink}` : "none",
    background: C.surface, color: C.ink, fontSize: 22, fontWeight: 700, cursor: "pointer",
    boxShadow: C.dark ? "0 2px 10px rgba(0,0,0,.4)" : "0 2px 10px rgba(28,29,33,.12)", lineHeight: 1 };
  roundBtnSm = { width: 30, height: 30, borderRadius: 10, border: C.a11y ? `2px solid ${C.ink}` : "none",
    background: C.a11y ? C.surface : C.bg, color: C.ink2, fontSize: 14, fontWeight: 700, cursor: "pointer", lineHeight: 1 };
  primaryBtn = { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: C.primary, color: C.primaryText, border: "none", borderRadius: 16, padding: `${Math.round(16 * C.fs)}px`,
    fontSize: Math.round(16 * C.fs), fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" };
  listRow = { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 6px",
    background: "none", border: "none", borderBottom: `1px solid ${C.line}`, cursor: "pointer" };
}
rebuildTokens();

// ---------- voice engine ----------
function speakNow(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR"; u.rate = 1.04; u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

// ---------- APP ----------
function App() {
  const [screen, setScreen] = useState("search"); // search | summary | nav | done
  const [dest, setDest] = useState("");
  const [userDist, setUserDist] = useState(0);
  const [simNow, setSimNow] = useState(0);
  const [detailId, setDetailId] = useState(null);
  const [speedMul, setSpeedMul] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [caption, setCaption] = useState("");
  const [, forceTick] = useState(0);

  // settings (persisted)
  const [settings, setSettings] = useState(() => {
    try { return { voice: true, dark: false, a11y: false, ...(JSON.parse(localStorage.getItem("tv_settings")) || {}) }; }
    catch (e) { return { voice: true, dark: false, a11y: false }; }
  });
  const dark = !!settings.dark, a11y = !!settings.a11y;
  const voiceEnabled = a11y || settings.voice !== false; // a11y forces voice on
  const setSetting = (k, v) => setSettings((s) => {
    const ns = { ...s, [k]: v };
    try { localStorage.setItem("tv_settings", JSON.stringify(ns)); } catch (e) {}
    return ns;
  });

  // apply theme whenever it changes
  useEffect(() => {
    applyTheme({ dark, a11y });
    document.body.style.background = dark ? "#000" : "#E4E1DA";
    const ph = document.getElementById("phone");
    if (ph) ph.style.background = C.bg;
    forceTick((n) => n + 1);
  }, [dark, a11y]);

  const voiceRef = useRef(voiceEnabled);
  useEffect(() => {
    voiceRef.current = voiceEnabled;
    if (!voiceEnabled) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }, [voiceEnabled]);

  const lastSpeakRef = useRef("");
  const announce = (key, text) => {
    if (key === lastSpeakRef.current) return;
    lastSpeakRef.current = key;
    setCaption(text);
    if (voiceRef.current) speakNow(text);
    try { navigator.vibrate && navigator.vibrate(25); } catch (e) {}
  };

  const userDistRef = useRef(0);
  const screenRef = useRef("search");
  const mulRef = useRef(1);
  const simNowRef = useRef(0);
  useEffect(() => { userDistRef.current = userDist; }, [userDist]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { mulRef.current = speedMul; }, [speedMul]);
  useEffect(() => { simNowRef.current = simNow; }, [simNow]);

  // master clock + walker advance
  useEffect(() => {
    let raf, last = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.1, (t - last) / 1000) * mulRef.current;
      last = t;
      setSimNow((n) => {
        const now = n + dt;
        if (screenRef.current === "nav") {
          let ud = userDistRef.current;
          if (ud < TOTAL_DIST) {
            const next = SIGNALS.find((s) => s.d > ud + 0.5);
            let speed = BASE_SPEED;
            if (next) speed = recommendSpeed(next.d - ud, next, now).speed;
            let nd = ud + speed * dt;
            if (next) {
              const ph = signalPhase(next, now);
              if (ph.color === "red" && nd >= next.d - 1.2) nd = Math.min(nd, next.d - 1.2);
            }
            nd = Math.min(nd, TOTAL_DIST);
            userDistRef.current = nd;
            setUserDist(nd);
            if (nd >= TOTAL_DIST) screenRef.current = "done", setScreen("done");
          }
        }
        return now;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ----- 실시간 신호 데이터 연동 (B551982 /tl_drct_info, 부산) -----
  const [dataSource, setDataSource] = useState("connecting");
  const liveRef = useRef(null);     // { data, baseSim }
  useEffect(() => {
    let stop = false, timer;
    const poll = async () => {
      try {
        const got = await window.SignalAPI.fetchOnce();
        if (stop) return;
        liveRef.current = { data: got, baseSim: simNowRef.current };
        setDataSource("live");
      } catch (e) {
        if (stop) return;
        liveRef.current = null;
        setDataSource("sim");
      }
      if (!stop) timer = setTimeout(poll, 5000);
    };
    poll();
    return () => { stop = true; clearTimeout(timer); };
  }, []);

  const signalsState = useMemo(() => {
    const m = {};
    const live = liveRef.current;
    SIGNALS.forEach((s) => {
      if (live && live.data[s.id]) {
        const lv = live.data[s.id];
        const elapsed = simNow - live.baseSim;
        m[s.id] = { color: lv.color, remain: Math.max(0, lv.remain - elapsed), cycle: lv.cycle };
      } else {
        m[s.id] = signalPhase(s, simNow);
      }
    });
    return m;
  }, [simNow, dataSource]);

  // voice/caption: announce route situation while navigating
  useEffect(() => {
    if (screen !== "nav" || userDist >= TOTAL_DIST) return;
    const next = SIGNALS.find((s) => s.d > userDist - 2);
    if (!next) return;
    const ph = signalsState[next.id];
    const d = next.d - userDist;
    if (d < 6) {
      if (ph.color === "green") announce("cross-" + next.id, `초록불입니다. 지금 ${next.name}을 건너세요.`);
      else announce("wait-" + next.id, `${next.name}, 빨간불입니다. ${Math.round(ph.remain)}초 후 보행 가능합니다.`);
    } else if (d < 35) {
      announce("near-" + next.id + "-" + ph.color,
        `${Math.round(d)}미터 앞 ${next.name}, ${ph.color === "green" ? "초록불" : "빨간불"} ${Math.round(ph.remain)}초.`);
    } else {
      const rec = recommendSpeed(d, next, simNow);
      announce("rec-" + next.id + "-" + rec.hint, rec.advice + ".");
    }
  }, [simNow, screen]);

  // intro / arrival announcements
  useEffect(() => {
    if (screen === "nav") { lastSpeakRef.current = ""; announce("start", `${dest}까지 안내를 시작합니다. 경로에 신호등 ${SIGNALS.length}개가 있어요.`); }
    else if (screen === "done") announce("arrive", "목적지에 도착했습니다. 신호 대기 없이 도착했어요.");
    else setCaption("");
  }, [screen]);

  const goRoute = (name) => { setDest(name); setUserDist(0); userDistRef.current = 0; setScreen("summary"); };
  const startNav = () => { setUserDist(0); userDistRef.current = 0; lastSpeakRef.current = ""; setScreen("nav"); };
  const mapMode = screen === "nav" ? "nav" : "map";

  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, overflow: "hidden",
      fontFamily: "'Pretendard', system-ui, sans-serif", transition: "background 300ms" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <CityMap userDist={userDist} signalsState={signalsState} mode={mapMode} dark={dark} a11y={a11y}
          activeSignalId={detailId}
          onSignalTap={(id) => (screen === "summary" || screen === "nav") && setDetailId(id)} />
      </div>

      {screen !== "search" && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120,
          background: `linear-gradient(180deg,${C.scrim},transparent)`, pointerEvents: "none" }} />
      )}

      {screen === "search" && (
        <div style={{ position: "absolute", inset: 0, background: C.bg }}>
          <SearchScreen onRoute={goRoute} onSettings={() => setShowSettings(true)} settings={settings} dataSource={dataSource} />
        </div>
      )}
      {screen === "summary" && (
        <SummaryScreen dest={dest} signalsState={signalsState} simNow={simNow}
          onStart={startNav} onBack={() => setScreen("search")}
          onSignalTap={(id) => setDetailId(id)} />
      )}
      {screen === "nav" && (
        <NavScreen userDist={userDist} signalsState={signalsState} simNow={simNow}
          speedMul={speedMul} setSpeedMul={setSpeedMul} caption={caption}
          voiceEnabled={voiceEnabled} canMuteVoice={!a11y} onToggleVoice={() => setSetting("voice", settings.voice === false)}
          a11y={a11y} onSignalTap={(id) => setDetailId(id)} onExit={() => setScreen("summary")} />
      )}
      {screen === "done" && (
        <ArrivedScreen dest={dest} onAgain={() => setScreen("search")} />
      )}

      {detailId && (
        <DetailSheet sigId={detailId} signalsState={signalsState} userDist={userDist}
          onClose={() => setDetailId(null)} />
      )}

      {showSettings && (
        <SettingsSheet settings={settings} setSetting={setSetting} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

function ArrivedScreen({ dest, onAgain }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", pointerEvents: "none" }}>
      <div style={{ background: C.surface, borderRadius: "26px 26px 0 0", padding: "26px 22px 24px",
        boxShadow: C.dark ? "0 -6px 28px rgba(0,0,0,.5)" : "0 -6px 28px rgba(28,29,33,.12)", pointerEvents: "auto", textAlign: "center",
        border: C.a11y ? `2px solid ${C.ink}` : "none", borderBottom: "none" }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: C.green, display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
          <PedIcon size={28} color={C.a11y && C.dark ? "#000" : "#fff"} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>도착했어요</div>
        <div style={{ fontSize: 14, color: C.ink2, marginTop: 4, marginBottom: 20 }}>
          {dest}까지 안전하게 안내했어요 · 신호 대기 없이 도착!
        </div>
        <button onClick={onAgain} style={primaryBtn}>새 경로 검색</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
