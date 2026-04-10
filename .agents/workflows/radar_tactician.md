---
description: [Tactics] 퀀텀 레이더 전술 설계 및 시장 포착 필터를 담당하는 에이전트
---

# 🎯 Radar Tactician Workflow

이 워크플로우는 시장의 강력한 매집 신호를 포착하기 위한 전술 명세서(JSON)를 관리하고 레이더 스캔을 수행합니다.

## 🏛️ 클린 아키텍처 역할 (Application Layer)
- **전술 구현**: `D/W/M/Q/Y` 다주기 교차 필터 설계.
- **시너지 통합**: 키움/LS 조건검색(L1)과 MARF 퀀텀 필터(L2)의 합류(Synergy) 관리.

## 🛠️ 실행 단계

### 1. [설계] 전술 명세서 작성
- `strategies/*.json` 파일에 전술 로직(T-Mode, Gap, PV Breakout 등) 정의.

### 2. [스캔] Radar Execution
- `radar_scan_engine.py`를 호출하여 실시간/장후 시장 스캔.

### 3. [보강] 시장경보 및 기업개요
- 투자주의/경보 종목 필터링 및 유동비율 변동 사항 반영.

### 4. [검증] 최종 감사
// turbo
1. `verify-quantum-tactics` 스킬 실행 (JSON 문법 및 논리 검사)
2. 디스코드 리포트 전송 및 `radar_results.json` 정합성 확인

---
*Created by SanchoRyong: Tactician Personality*
