// data.jsx 순수 타이밍 로직 단위 테스트 (#10)
// 무의존성: node 내장 vm/assert/fs 만 사용 → `node tests/data.test.js`
//
// data.jsx 는 JSX 문법이 없는 순수 JS이고 끝에서 Object.assign(window, {...}) 로
// 심볼을 노출한다. 가짜 window 를 주입한 vm 컨텍스트에서 평가해 함수를 꺼낸다.

const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "../traffic_view/data.jsx"), "utf8");
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const {
  SIGNALS, BASE_SPEED, SPEED_MIN, SPEED_MAX,
  signalPhase, greenWindows, recommendSpeed, mmss, kmh, fmtDist,
} = sandbox.window;

// ---- 초소형 테스트 하네스 -------------------------------------------------
let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); pass++; }
  catch (e) { console.log(`  ✗ ${name}\n    ${e.message}`); fail++; }
}

// s1: green 28, red 36, offset 5 → cycle 64
const s1 = SIGNALS.find((s) => s.id === "s1");

test("signalPhase: 초록 구간 잔여시간 (t=0)", () => {
  // p = (0+5)%64 = 5 < 28 → green, remain 28-5 = 23
  const ph = signalPhase(s1, 0);
  assert.strictEqual(ph.color, "green");
  assert.strictEqual(ph.remain, 23);
  assert.strictEqual(ph.cycle, 64);
});

test("signalPhase: 빨강 구간 잔여시간 (t=30)", () => {
  // p = (30+5)%64 = 35 >= 28 → red, remain 64-35 = 29
  const ph = signalPhase(s1, 30);
  assert.strictEqual(ph.color, "red");
  assert.strictEqual(ph.remain, 29);
});

test("signalPhase: offset 이 주기보다 커도 정규화", () => {
  const ph = signalPhase({ green: 10, red: 10, offset: 25 }, 0); // (0+25)%20=5<10 → green5
  assert.strictEqual(ph.color, "green");
  assert.strictEqual(ph.remain, 5);
});

test("greenWindows: 현재 초록이면 첫 창은 start 0", () => {
  const ws = greenWindows(s1, 0, 200);
  assert.ok(ws.length >= 1);
  assert.strictEqual(ws[0].start, 0);
  assert.strictEqual(ws[0].end, 23); // 현재 초록 잔여
  // 이후 창들은 cycle 간격으로 증가
  assert.ok(ws[1].start > ws[0].end);
});

test("recommendSpeed: 도착거리 0 이하 → 기준속도 유지", () => {
  const r = recommendSpeed(0, s1, 0);
  assert.strictEqual(r.speed, BASE_SPEED);
  assert.strictEqual(r.hint, "유지");
  assert.strictEqual(r.arrive, "green");
});

test("recommendSpeed: 권장속도는 항상 보행 가능 범위 내", () => {
  for (const d of [40, 110, 240, 400]) {
    const r = recommendSpeed(d, s1, 0);
    assert.ok(r.speed >= SPEED_MIN - 1e-9 && r.speed <= SPEED_MAX + 1e-9,
      `d=${d} speed=${r.speed} 범위 밖`);
    assert.ok(["유지", "조금 빠르게", "천천히"].includes(r.hint), `hint=${r.hint}`);
    assert.ok(["green", "caution"].includes(r.arrive));
  }
});

test("포맷 헬퍼: mmss / kmh / fmtDist", () => {
  assert.strictEqual(mmss(65), "1:05");
  assert.strictEqual(mmss(9), "9");
  assert.strictEqual(kmh(BASE_SPEED), "4.5"); // 1.25 * 3.6
  assert.strictEqual(fmtDist(800), "800m");
  assert.strictEqual(fmtDist(1200), "1.2km");
});

console.log(`\n결과: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
