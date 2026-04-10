---
name: verify-data-integrity
description: 대한민국 증시 40년 초장기 시계열의 수정주가 무결성 및 데이터 라벨링(REAL/CALC)을 검증합니다.
---

# 데이터 무결성 검증 (verify-data-integrity)

## 목적

수복된 40년 초장기 시계열 데이터가 0.1% 퀀텀 트레이딩에 적합한지 정밀 검사합니다:

1. **Benchmark Alignment**: 삼성전자(005930) 등 대표 종목의 현재가가 기준 수치(2026-04-08 기준 211,000원)와 일치하는지 확인.
2. **Historical Continuity**: 2014년 전후(Legacy vs Current)의 가격 연결 지점에서 비정상적인 갭(Gap) 발생 여부 탐지.
3. **Data Labeling Integrity**: 2014년 이전 데이터가 `amount_type='CALC'`로, 이후가 `'REAL'`로 정확히 마킹되었는지 확인.
4. **Volume Consistency**: 거래량(Volume) 데이터가 비정상적으로 0이거나 음수인 구간 탐지.

## 실행 시점

- `legacy_recovery_manager.py` 또는 `full_refetch_adjusted.py` 실행 후.
- `daily_evening_update.py`를 통한 일일 데이터 축적 후.
- 특정 종목의 차트에서 가격 왜곡(수정주가 미적용 의심)이 발견될 때.

## 핵심 검사항목 (Workflow)

### Step 1: 삼성전자 211,000원 벤치마크 체크

**파일**: `MARF/data/raw/full_market_history_master.parquet`

**검사**: 마스터 DB 내 삼성전자의 최신 종가를 확인합니다.

```bash
python -c "import polars as pl; print(pl.read_parquet('MARF/data/raw/full_market_history_master.parquet').filter(pl.col('code')=='005930').sort('date').tail(1).select(['date', 'close']))"
```

**PASS 기준**: 2026-04-08 종가가 **211,000**이어야 함.

### Step 2: 데이터 라벨링 (REAL/CALC) 전수 조사

**검사**: `amount_type` 컬럼의 분포를 확인하여 2014년 전후 구분이 명확한지 체크합니다.

```bash
python -c "import polars as pl; df = pl.read_parquet('MARF/data/raw/full_market_history_master.parquet'); print(df.group_by('amount_type').count())"
```

### Step 3: 가격 연속성 (Geometric Splicing) 검증

**파일**: `MARF/tests/verify_historical_bridge_ultimate.py`

**검사**: 연결 지점에서 가교 비율이 1.0 전후인지, 가격 단절이 없는지 확인합니다.

```bash
python MARF/tests/verify_historical_bridge_ultimate.py
```

## Related Files

| File | Purpose |
|------|---------|
| `MARF/data/raw/full_market_history_master.parquet` | 40년 초장기 시계열 통합 마스터 DB |
| `MARF/src/python/legacy_recovery_manager.py` | 레거시 데이터 수복 및 가교 배수 산출 엔진 |
| `MARF/src/python/full_refetch_adjusted.py` | FDR 기반 정석 수정주가 전 종목 재수집 도구 |
| `MARF/tests/verify_ohlcv_sync.py` | 실시간-DB 간 OHLCV 정합성 대조 도구 |

## 예외사항

1. **2026-04-08 장중 데이터**: 장 마감 전 데이터는 실시간 웹소켓 값에 따라 유동적이므로 벤치마크 오차가 발생할 수 있음.
2. **신규 상장주**: 상장일이 2014년 이후인 종목은 `CALC` 라벨이 존재하지 않는 것이 정상임.
