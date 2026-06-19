/* signal_api.jsx — 실시간 교통 신호정보 연동 레이어
   data.go.kr · End Point: https://apis.data.go.kr/B551982/rti
   오퍼레이션: /tl_drct_info (신호제어기 신호잔여시간)

   ── 실제 응답 스키마 (확인 완료) ──────────────────────────────
   body.items.item[] : 교차로 1개 = 1행
     stdgCd   법정동코드 (예 "2600000000" = 부산광역시, 앞 2자리 26)
     lclgvNm  지자체명   (예 "부산광역시")
     crsrdId  교차로 ID
     {방향}{종류}RmndCs / {방향}{종류}SttsNm
       방향: nt(북) et(동) st(남) wt(서) ne(북동) se(남동) sw(남서) nw(북서)
       종류: Bssg(버스) Bcsg(자전거) Ltsg(좌회전) Pdsg(보행) Stsg(직진) Utsg(유턴)
     ★ 보행신호 = Pdsg.  RmndCs 는 1/10초 단위, 36000↑ 는 "미정" 센티넬.
     SttsNm: *-Movement-Allowed = 보행(초록), stop-And-Remain = 정지(빨강)

   ── 라이브로 켜려면 ───────────────────────────────────────────
   PROXY 에 배포한 프록시 주소만 넣으면 됩니다 (proxy/cloudflare-worker.js).
   MAP 을 비워두면 부산 보행신호 교차로를 경로에 "자동 배정"해 바로 동작합니다.
*/

const SignalAPI = {
  // data.go.kr 서비스키. 공공데이터포털에서 발급받아 넣으세요. (README 참고)
  API_KEY: "YOUR_SERVICE_KEY",

  BASE: "https://apis.data.go.kr/B551982/rti",
  OP_SIGNAL: "/tl_drct_info",

  // 배포된 전용 Cloudflare Worker 프록시 (apis.data.go.kr 만 허용).
  PROXY: "https://traffic-view.dmsrb0507.workers.dev/?url=",

  // 대상: 서울특별시. (이 API의 보행신호 실데이터는 서울에서 제공됨.
  //  부산=미제공, 울산=보행신호 없음, 제주/서울만 유효)
  REGION: { codePrefix: "11", name: "서울" },

  // (참고) 서버측 지역 필터 파라미터는 무시되어 전체를 반환 → 클라이언트에서 필터.
  PARAMS: {},

  // 내 경로 신호등(SIGNALS.id) ↔ 실제 (crsrdId, 방향) 수동 매핑.
  // 비워두면 부산 보행신호 교차로를 순서대로 자동 배정합니다.
  MAP: {
    // s1: { crsrdId: "12345", dir: "nt" },
  },

  DIRS: ["nt", "et", "st", "wt", "ne", "se", "sw", "nw"],
  MAX_PAGES: 1,        // 서울은 첫 페이지에 다수 포함되어 1페이지면 충분
  ROWS: 1000,
  TIMEOUT_MS: 9000,

  _url(pageNo) {
    const qs = new URLSearchParams({
      serviceKey: this.API_KEY, type: "json", numOfRows: String(this.ROWS), pageNo: String(pageNo),
      ...this.PARAMS,
    });
    const full = `${this.BASE}${this.OP_SIGNAL}?${qs.toString()}`;
    return this.PROXY ? this.PROXY + encodeURIComponent(full) : full;
  },

  async _getPage(pageNo) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.TIMEOUT_MS);
    try {
      const res = await fetch(this._url(pageNo), { signal: ctrl.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  },

  _rows(data) {
    const it = data?.body?.items?.item ?? data?.response?.body?.items?.item ?? [];
    return Array.isArray(it) ? it : (it ? [it] : []);
  },

  _inRegion(r) {
    const code = String(r.stdgCd ?? "");
    const name = String(r.lclgvNm ?? "");
    return code.startsWith(this.REGION.codePrefix) || name.includes(this.REGION.name);
  },

  // 한 행에서 보행신호가 있는 방향들을 추출
  _pedsOf(r) {
    const out = [];
    this.DIRS.forEach((d) => {
      const stt = r[`${d}PdsgSttsNm`];
      if (!stt) return; // 해당 방향에 보행신호 없음
      let rmd = Number(r[`${d}PdsgRmndCs`]);
      if (!isFinite(rmd) || rmd >= 36000) return; // 미정 센티넬
      out.push({
        crsrdId: String(r.crsrdId),
        dir: d,
        remain: Math.max(0, Math.round(rmd / 10)),   // 1/10초 → 초
        color: /Movement-Allowed/i.test(stt) ? "green" : "red",
        state: stt,
      });
    });
    return out;
  },

  // 메인: 부산 보행신호를 조회해 { [signalId]: {color, remain, cycle} } 반환
  async fetchOnce() {
    // 1) 대상 지역 행 수집 (필요 시 여러 페이지)
    let region = [];
    const first = await this._getPage(1);
    const total = Number(first?.body?.totalCount ?? 0);
    region = this._rows(first).filter((r) => this._inRegion(r));
    const pages = Math.min(this.MAX_PAGES, Math.ceil(total / this.ROWS) || 1);
    for (let p = 2; p <= pages && region.length < SIGNALS.length; p++) {
      const data = await this._getPage(p);
      region = region.concat(this._rows(data).filter((r) => this._inRegion(r)));
    }
    if (region.length === 0) throw new Error("대상 지역 신호 데이터 없음");

    // 2) 보행신호 목록 (교차로당 1개로 다양화)
    const peds = [];
    const seen = new Set();
    region.forEach((r) => {
      const ps = this._pedsOf(r);
      if (ps.length && !seen.has(ps[0].crsrdId)) { seen.add(ps[0].crsrdId); peds.push(ps[0]); }
    });
    if (peds.length === 0) throw new Error("보행신호 없음");

    // 3) 매핑 (수동 MAP 우선, 없으면 자동 배정)
    const out = {};
    const manual = Object.keys(this.MAP).length > 0;
    SIGNALS.forEach((s, i) => {
      let p;
      if (manual && this.MAP[s.id]) {
        const m = this.MAP[s.id];
        const row = region.find((r) => String(r.crsrdId) === String(m.crsrdId));
        if (row) {
          const stt = row[`${m.dir}PdsgSttsNm`];
          let rmd = Number(row[`${m.dir}PdsgRmndCs`]);
          if (stt && isFinite(rmd) && rmd < 36000) {
            p = { remain: Math.max(0, Math.round(rmd / 10)), color: /Movement-Allowed/i.test(stt) ? "green" : "red" };
          }
        }
      } else {
        p = peds[i % peds.length];
      }
      if (p) out[s.id] = { color: p.color, remain: p.remain, cycle: Math.max(60, p.remain + 5) };
    });
    if (Object.keys(out).length === 0) throw new Error("매핑된 보행신호 없음");
    return out;
  },
};

window.SignalAPI = SignalAPI;
