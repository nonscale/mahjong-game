---
name: verify-quantum-tactics
description: JSON 기반 퀀텀 레이더 전술 명세서의 문법 및 논리 정합성을 검증합니다.
---

# 퀀텀 전술 검증 (verify-quantum-tactics)

## 목적

JSON으로 작성된 퀀텀 레이더 전술(Tactics)이 엔진에서 오류 없이 실행되는지 확인합니다:

1. **Schema Validation**: JSON 문법 오류 및 필수 필드(`strategy_name`, `logic`) 누락 탐지.
2. **Logic Tree Consistency**: `AND/OR` 연산자의 하위 조건(`conditions`) 구조가 올바른지 확인.
3. **Parameter Integrity**: 필터별 파라미터(예: `price`의 `min/max`) 수치 유효성 검사.
4. **Registry Match**: 전술에서 사용한 `id`가 엔진의 필터 사전(Filter Registry)에 등록되어 있는지 확인.

## 실행 시점

- `MARF/strategies/*.json` 파일을 새로 생성하거나 수정했을 때.
- `radar_scan_engine.py`의 필터 처리 로직을 변경했을 때.
- 레이더 스캔 실행 시 `KeyError` 또는 `FileNotFoundError` 발생 시.

## 핵심 검사항목 (Workflow)

### Step 1: 전술 파일 로드 테스트

**파일**: `MARF/src/python/engine/radar_scan_engine.py`

**검사**: 엔진이 특정 전술 파일을 에러 없이 로드하는지 확인합니다.

```bash
python -c "import sys; from pathlib import Path; sys.path.append(str(Path('MARF/src/python').resolve())); from engine.radar_scan_engine import QuantumRadarEngine; radar = QuantumRadarEngine(); radar.load_tactic('radar_tactics_v1')"
```

### Step 2: 불리언 논리(AND/OR) 구조 검증

**파일**: `MARF/strategies/radar_tactics_v1.json`

**검사**: `operator`가 있는 곳에 반드시 `conditions` 리스트가 존재하는지 확인합니다.

```bash
grep -A 1 "operator" MARF/strategies/radar_tactics_v1.json
```

### Step 3: 수치 파라미터 유효성 검사

**검사**: 가격(`price`)이나 시총(`float_cap`)의 `min`값이 `max`값보다 작은지 육안 또는 스크립트로 확인합니다.

## Related Files

| File | Purpose |
|------|---------|
| `MARF/strategies/radar_tactics_v1.json` | 퀀텀 레이더 스캔 전술 명세서 (JSON) |
| `MARF/src/python/engine/radar_scan_engine.py` | JSON 전술을 Polars 쿼리로 변환하는 엔진 |

## 예외사항

1. **주석 처리**: JSON 파일 내에 비표준 주석(`//`)이 포함된 경우 파싱 에러가 날 수 있으므로 주의 필요.
2. **미등록 ID**: 향후 추가될 예정인 실험적 필터 ID는 실패로 간주하지 않고 경고(Warning) 처리 가능.
