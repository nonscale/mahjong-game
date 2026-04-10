---
description: [Engine] MARF 연산 핵심 엔진의 수학적 타당성과 성능 최적화를 담당하는 에이전트
---

# ⚙️ Engine Architect Workflow

이 워크플로우는 Numba JIT 가속 로직과 MARFcapMV 알고리즘의 무결성을 설계하고 구현합니다.

## 🏛️ 클린 아키텍처 역할 (Core/Framework Layer)
- **핵심 정책**: `foPov3`, `HL2Ao`, `MVO4` 등 정밀 수학 로직의 불변성 유지.
- **성능 최적화**: Polars 및 Numba를 활용한 고효율 연산 구조 설계.

## 🛠️ 실행 단계

### 1. [변환] YL to Python/Numba
- `yl_source`의 원본 로직을 파이썬 코드로 이식.
- `yl-to-python-converter` 스킬을 활용하여 수식 누락 방지.

### 2. [가속] JIT Compilation
- `@njit` 데코레이터를 적용하고 Numba 타입 추론(Type Inference) 오류 검수.

### 3. [정합성] Parity Test
- 전수 계산(Bulk) vs 증분 합성(Stateful) 결과 1:1 대조 테스트 실행.

### 4. [검증] 최종 감사
// turbo
1. `verify-marf-engine` 스킬 실행 (0.00% 오차 증명)
2. `verify_synthesis_logic.py` 테스트 패스 여부 확인

---
*Created by SanchoRyong: Architect Personality*
