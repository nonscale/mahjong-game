---
name: verify-ui-dashboard
description: 7분할 대시보드의 데이터 바인딩 및 주기별 지표 렌더링 정합성을 검증합니다.
---

# MARF UI 대시보드 검증 (verify-ui-dashboard)

## 목적

7분할 수직 대시보드와 범례(Legend) 연동의 UI/UX 결함 및 데이터 정합성을 검증합니다:

1. **Legend Sync**: 마지막 봉 데이터와 상단 범례 수치의 100% 일치성.
2. **Timeframe Switching**: 주기 전환(D, W, M, Q, Y) 시 데이터 로드 실패나 렌더링 렉(Lag) 점검.
3. **Responsive Layout**: 7개 페인의 수직 정렬 및 범례 배치가 모니터 해상도(Wide/Standard)에 맞게 조정되는지 확인.
4. **Unit Formatting**: V(만 주), M(억 원) 단위 표기가 올바르게 적용되었는지 체크.

## 실행 시점

- `dashboard.py` 내의 레이아웃 또는 차트 엔진(`renderLightweightCharts`) 수정 후.
- 범례 스타일(CSS)이나 툴팁 표시 로직 변경 후.
- 새로운 주종목 필터링 로직 추가 후.

## 핵심 검사항목 (Workflow)

### Step 1: 렌더링 엔진 로딩 확인

**파일**: `MARF/src/python/ui/dashboard.py`

**검사**: `streamlit_lightweight_charts`가 모든 페인(7개)에 대해 호출되는지 확인합니다.

```bash
grep -c "renderLightweightCharts" MARF/src/python/ui/dashboard.py
```

**PASS 기준**: 최소 **7회** 이상의 렌더링 함수 호출이 확인되어야 함.

### Step 2: 단위 변환 포맷팅 검사

**파일**: `MARF/src/python/ui/dashboard.py`

**검사**: 범례(Legend) 문자열 생성부에서 단위 변환 로직이 누락되지 않았는지 확인합니다.

```bash
grep -E "10000.0|100000000.0" MARF/src/python/ui/dashboard.py
```

### Step 3: 주기 전환(Timeframe) 데이터 경로 검증

**파일**: `MARF/src/python/ui/dashboard.py`

**검사**: `load_indicator_data` 함수가 각 주기에 맞는 Parquet 파일을 로드하는지 확인합니다.

## Related Files

| File | Purpose |
|------|---------|
| `MARF/src/python/ui/dashboard.py` | 7분할 대시보드 및 실시간 범례 UI |
| `MARF/data/resampled/` | 주, 월, 분기 등 리샘플링된 지표 DB 경로 |

## 예외사항

1. **데이터 부족**: 신규 상장 종목이거나 특정 주기에 데이터가 부족할 경우 렌더링이 되지 않을 수 있음.
2. **브라우저 호환성**: 일부 오래된 브라우저에서 Lightweight Charts의 십자선 동기화가 느려질 수 있음.
