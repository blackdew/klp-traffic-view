/* icons.jsx — 순수 SVG 아이콘 컴포넌트 (props 전용, 테마/상태 비의존)
   app.jsx 에서 분리(#12). data.jsx 와 동일하게 window 전역으로 노출해 공유한다.
   ⚠️ 테마 토큰 C 를 참조하는 StatusBar/Bars/Battery/SignalChip 은 app.jsx 에 남는다. */

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

Object.assign(window, { PedIcon, StopIcon, GearIcon, VoiceIcon, SunMoonIcon, A11yIcon, WaveBars });
