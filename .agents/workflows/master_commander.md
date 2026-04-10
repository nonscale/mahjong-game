---
description: [Master] 각 서브 에이전트를 통제하고 프로젝트 전체의 무결성을 관리하는 사령탑 워크플로우
---

# 🏛️ Antigravity Master Commander Workflow

이 워크플로우는 갈릴레용의 의도를 분석하여 최적의 부서를 배정하고, 서브 에이전트가 완료한 작업의 최종 무결성을 검증합니다.

## 🧭 아키텍처 원칙 (Clean Architecture)
- **Dependency Rule**: 하위 워크플로우(`Data`, `Engine`, `Tactics`)의 세부 사항을 직접 수정하지 않고, 각 부서장에게 명령을 하달합니다.
- **Single Source of Truth**: 모든 진행 상황은 `MISSION_MASTER.md`와 `SYSTEM_EVOLUTION_LOG.md`를 통해 기록합니다.

## 🛠️ 실행 단계

### 1. [해석] 임무 분석
갈릴레용의 명령이 어떤 레이어에 해당하는지 판단합니다.
- **데이터(Raw/DB)** ➔ `/data-sentry`
- **로직(Numba/JIT/Math)** ➔ `/engine-architect`
- **전술(Radar/JSON)** ➔ `/radar-tactician`
- **UI(Dashboard/Aesthetics)** ➔ `/ui-designer`

### 2. [위임] 서브 에이전트 호출
선택된 서브 에이전트의 워크플로우(`.agents/workflows/*.md`)를 로드하여 작업을 실행합니다.

### 3. [검수] 통합 무결성 검증
// turbo
1. 서브 에이전트의 개별 검수(`verify-*` 스킬) 완료 확인
2. `verify-implementation` 스킬을 실행하여 시스템 통합 정합성 감사
3. `MISSION_MASTER.md` 업데이트 및 한글 리포트 생성

### 4. [보고] 최종 완료 보고
- 작업 완료 증빙(✅) 및 포착된 퀀텀 신호 요약.

---
*Created by SanchoRyong: Commander Personality*
