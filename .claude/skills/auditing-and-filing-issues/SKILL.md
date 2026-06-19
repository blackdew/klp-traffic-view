---
name: auditing-and-filing-issues
description: 코드베이스를 점검해 버그·개선점·부족한 부분을 파악하고, 심각도(High/Medium/Low)로 트리아지해 GitHub 이슈로 일괄 등록하는 워크플로우. "개선점/버그 파악해서 이슈로 등록해", "점검하고 이슈 만들어줘", "문제 찾아서 이슈로 등록", "audit and file issues", "turn findings into issues"처럼 발견을 추적 가능한 백로그로 만들고 싶을 때 사용. 각 이슈에 배경·작업 체크리스트·완료 기준을 넣고 priority 라벨로 묶으며, 일괄 생성 후 제목↔본문↔라벨 정합성을 반드시 검증하는 것이 핵심. 깊은 진단만 원하면 health-check, 이미 있는 이슈를 해결하려면 resolving-github-issues, 이슈 등록 없이 분석만 원하면 일반 분석을 사용.
argument-hint: "[--security|--docs|--quality] (선택, 기본: 전체 점검)"
---

# Auditing and Filing Issues

코드베이스를 점검해 나온 버그·개선점·부족한 부분을 **추적 가능한 GitHub 이슈 백로그**로 만든다.
점검 자체보다, **발견을 잊히지 않게 구조화하는 것**이 이 스킬의 목적이다.

## 핵심 원칙 (왜 이렇게 하나)

- **발견은 추적 가능한 형태로**: 라벨·완료 기준 없는 이슈는 다시 잊힌다. 심각도 라벨과 "닫아도 되는 기준"이 있어야 백로그가 살아 있다.
- **일괄 생성은 반드시 검증한다**: `gh issue create`가 URL을 N개 뱉으면 성공처럼 보이지만, 제목·본문·라벨이 어긋났을 수 있다. 출력만 보고 끝내면 잘못된 이슈가 그대로 남는다. (실제 사례: zsh 배열 인덱싱으로 제목이 한 칸씩 밀림 — 아래 "일괄 생성 함정" 참고)
- **심각도로 트리아지**: 발견을 평면 목록이 아니라 High/Medium/Low로 나눠야, 무엇부터 손볼지가 분명해진다.

## 워크플로우 체크리스트

작업 시작 시 이 체크리스트를 응답에 복사해 추적한다:

```
점검→이슈 등록 진행:
- [ ] 1. 점검 — 카테고리별 스캔 (보안·타입·데드코드·문서·품질)
- [ ] 2. 트리아지 — High/Medium/Low 분류, 사소한 Low는 체크리스트 1건으로 묶기
- [ ] 3. 라벨 준비 — priority:high/medium/low + 배치 출처 라벨
- [ ] 4. 본문 작성 — 각 이슈에 배경·작업·완료 기준
- [ ] 5. 일괄 생성 — gh issue create
- [ ] 6. 정합성 검증 — 제목↔본문↔라벨 전수 확인, 어긋나면 gh issue edit로 정정
- [ ] 7. 요약 보고 — 심각도별 목록 + 라벨 필터 안내
```

### 1. 점검

카테고리별로 스캔한다: **보안**(하드코딩 시크릿·열린 설정·gitignore 누락), **타입/빌드**, **데드코드**(미사용 export·TODO·빈 파일), **문서 동기화**(README·주석이 실제와 일치하는지), **품질**(거대 파일·테스트 부재·중복).
깊은 진단이 필요하면 `health-check` 스킬을 활용하고, 그 결과를 이 워크플로우의 입력으로 쓴다.

### 2. 트리아지

각 발견을 심각도로 나눈다:
- **High**: 동작을 오도하거나(예: 코드와 정반대인 주석), 정합성이 깨진 산출물.
- **Medium**: 테스트 부재, 거대 파일, 중복, 유지보수 부채.
- **Low**: README 드리프트, 사소한 정비.

**사소한 Low 여러 건은 체크리스트 1개 이슈로 묶는다** — 이슈 노이즈를 줄이고 한 번에 정리하기 위함.

### 3. 라벨 준비

```bash
gh label create "priority:high"   --color d73a4a --description "조속히 개선" --force
gh label create "priority:medium" --color e8a317 --description "개선 권장"   --force
gh label create "priority:low"    --color fbca04 --description "참고"        --force
gh label create "audit-YYYY-MM-DD" --color 5319e7 --description "이번 점검 배치" --force
```

심각도 라벨은 트리아지용, **배치 출처 라벨**(예: `audit-2026-06-19`)은 "이번 점검에서 나온 항목"을 한 번에 필터링하기 위함.

### 4. 본문 작성

각 이슈는 아래 구조를 따른다. 본문은 임시 파일로 작성해 `gh issue create -F`로 넣으면 따옴표·줄바꿈 문제가 없다.

```
## 배경
<무엇이 왜 문제인지 — 근거가 되는 파일:라인 포함>

## 작업
- [ ] <구체적 작업 1>
- [ ] <구체적 작업 2>

## 완료 기준
- <이 이슈를 닫아도 되는 객관적 조건>
```

### 5. 일괄 생성

```bash
gh issue create -t "<제목>" -F <본문파일> -l "priority:high,documentation,audit-YYYY-MM-DD"
```

### 6. 정합성 검증 (가장 중요)

생성 후 **제목↔본문첫줄↔priority 라벨을 전수 확인**한다:

```bash
for n in <생성된 번호들>; do
  gh issue view $n --json number,title,labels,body \
    -q '"#\(.number) [\([.labels[].name|select(startswith("priority"))]|join(""))] \(.title)\n  본문: \(.body|split("\n")[1][0:50])"'
done
```

제목이 본문과 어긋나면 `gh issue edit <n> --title "..."`, 라벨은 `--add-label`/`--remove-label`로 정정한다. 누락된 발견이 있으면 추가 생성한다.

### 7. 요약 보고

심각도별로 묶은 목록과 `--label audit-YYYY-MM-DD` 필터 방법을 사용자에게 보고한다.

## 일괄 생성 함정

**셸은 zsh다(이 환경). zsh 배열은 1-인덱싱**이라, bash의 0-인덱싱을 가정한 `${arr[$((i-1))]}` 루프는 조용히 어긋난다 — 제목이 본문보다 한 칸씩 밀리고 첫 항목이 `title can't be blank`로 실패하며, **출력(URL 목록)만으론 정상처럼 보인다.**

대응:
- 항목이 적으면 **배열 인덱싱 대신 이슈별 명시적 `gh issue create` 명령**을 나열한다.
- 인덱스가 꼭 필요하면 `#!/usr/bin/env bash` 스크립트 파일로 만들어 실행한다.
- 어느 쪽이든 **6단계 정합성 검증을 건너뛰지 않는다.**

## 이 스킬을 쓰지 않을 때

- **깊은 진단만** 원하고 이슈 등록은 불필요할 때 → `health-check`.
- **다중 페르소나로 버그만** 집중 탐지할 때 → `bug-finder`.
- **이미 등록된 이슈를 해결**할 때 → `resolving-github-issues`.
- 점검 결과를 **이슈가 아니라 문서/리포트**로만 남길 때 → 일반 분석.
