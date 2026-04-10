---
name: verify-marf-engine
description: Numba JIT 가속 로직의 무결성, 전수 vs 증분 합성 정합성 및 분기(Q)/년(Y)/레이더 스캔 로직을 검증합니다.
---

# MARF Engine 정합성 검증 (verify-marf-engine)

## 목적

MARF 엔진의 핵심 계산 로직이 수학적으로 100% 무결한지 검증합니다:

1. **Math Parity**: 전수 계산(Full Recalc)과 증분 계산(Stateful Synthesis) 간의 오차 0.00% 확인.
2. **JIT Stability**: Numba JIT 함수의 타입 추론 오류 및 런타임 예외 탐지.
3. **Multi-TF Validation**: 일/주/월을 넘어 분기(Q) 및 년(Y) 지표 산출의 연속성 확인.
4. **Radar Logic Accuracy**: 퀀텀 레이더 엔진의 필터 결과가 실제 지표 수치와 일치하는지 검증.

## 실행 시점

- `MARF_Engine.py` 내의 업데이트 틱(`_numba_update_tick_core`) 로직 수정 후.
- `indicator_manager.py`의 ICS 코덱 또는 데이터 로더 수정 후.
- 지표의 가중치나 계산 주기(FFR, PD 등) 파라미터 변경 후.

## 핵심 검사항목 (Workflow)

### Step 1: 합성 정합성 테스트 (Consistency Check)

**파일**: `MARF/src/python/tests/verify_synthesis_logic.py`

**검사**: 삼성전자(005930) 등 대표 종목에 대해 전수 계산 결과와 증분 계산 결과를 비교합니다.

```bash
uv run python MARF/src/python/tests/verify_synthesis_logic.py
```

**PASS 기준**: Gap, ctx, PV 지표의 오차가 **0.00001** 미만이어야 함.

### Step 2: Numba JIT 타입 검증

**파일**: `MARF/src/python/engine/MARF_Engine.py`

**검사**: `@njit(nogil=True)` 데코레이터가 붙은 핵심 함수 중 타입 오류가 발생할 수 있는 구간(특히 `np.nan` 처리 및 나눗셈)을 확인합니다.

```bash
grep -n "@njit" MARF/src/python/engine/MARF_Engine.py
```

### Step 3: 단위 환산 및 다중 주기(Multi-TF) 검증

**파일**: `MARF/src/python/engine/MARF_Indicator_Manager.py`

**검사**: `ICS_Codec` 표준 준수 여부 및 `resample_data`에서 `Q(3mo)`, `Y(1y)` 로직이 정확한지 확인합니다.

```bash
grep -E "3mo|1y" MARF/src/python/engine/MARF_Indicator_Manager.py
```

### Step 4: 퀀텀 레이더 스캔 결과 검증

**파일**: `MARF/src/python/engine/radar_scan_engine.py`

**검사**: 스캔 결과 상위 종목의 실제 지표(PV, 유동비율 등)를 DB와 1:1 대조하여 필터 로직 오류를 탐지합니다.

```bash
uv run python MARF/src/python/engine/radar_scan_engine.py
```

**PASS 기준**: 포착된 종목의 `PV/유동` 값이 전술(Tactics)에서 지정한 임계값(예: 1.0) 이상이어야 함.

## Related Files

| File | Purpose |
|------|---------|
| `MARF/src/python/engine/MARF_Engine.py` | JIT 가속 및 증분 합성 핵심 연산 엔진 |
| `MARF/src/python/engine/MARF_Indicator_Manager.py` | 데이터 로딩 및 ICS 단위 환산 매니저 (Q/Y 확장) |
| `MARF/src/python/engine/radar_scan_engine.py` | 전 종목 다주기 지표 스캔 및 필터링 엔진 |
| `MARF/src/python/tests/verify_synthesis_logic.py` | 정합성 검증 전용 테스트 스크립트 |

## 예외사항

1. **상장 폐지 종목**: 과거 상장 폐지 등으로 데이터가 불연속적인 경우 정합성 오차가 발생할 수 있음.
2. **첫 시작 바(Bar)**: 히스토리가 아예 없는 첫 번째 봉의 경우 상태값이 0으로 초기화되므로 오차 대조군에서 제외 가능.
