# CLAUDE.md — klp-traffic-view

신호등 인지형 보행 길찾기 모바일 웹앱. 자세한 개요·아키텍처는 [README.md](README.md) 참고.

## 빌드리스 구조 (중요)

빌드 도구·`package.json`이 없다. `index.html`이 CDN에서 React 18 + Babel Standalone을 불러와
`traffic_view/*.jsx`를 **브라우저에서 즉석 트랜스파일**한다.

- 모듈 공유는 **`window` 전역**으로 한다. 각 파일은 끝에서 `Object.assign(window, {...})`로 심볼을 노출하고,
  다른 파일은 이를 bare 식별자(예: `signalPhase`, `PedIcon`)로 참조한다(Babel 비-모듈 스크립트라 window로 해석됨).
- 따라서 **스크립트 로드 순서가 중요**하다 (`index.html`): data → signal_api → icons → map → app.
  새 파일을 추가하면 의존성보다 **앞에** 로드되도록 순서를 잡을 것.

## 실행 / 테스트

```bash
# 로컬 실행 (저장소 루트에서)
python3 -m http.server 8000   # → http://localhost:8000/

# 타이밍 로직 단위 테스트 (무의존성, node 내장 모듈만)
node tests/data.test.js
```

라이브 데모: https://blackdew.github.io/klp-traffic-view/ (GitHub Pages, `main` 루트)

## 컨벤션 / 주의

- **실데이터 대상은 서울**(`signal_api.jsx` `REGION.codePrefix: "11"`). 과거 주석의 "부산"은 정정됨 — 부산은 이 API에서 보행신호 미제공.
- API 키는 `signal_api.jsx`의 `API_KEY`(placeholder). 키 없으면 자동 시뮬레이션 폴백 → 앱은 항상 동작.
- `신호등 길찾기 앱.html`(23MB)은 **원본 제출 스냅샷**이라 소스 최신과 다를 수 있음(빌드 산출물, 수동 갱신 필요).
- 주석·커밋·문서는 한국어.
