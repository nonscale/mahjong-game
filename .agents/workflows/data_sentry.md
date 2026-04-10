---
description: [Data] 데이터 수집, 무결성 검사, DB 최신화를 담당하는 데이터 전담 에이전트
---

# 🛰️ Data Sentry Workflow

이 워크플로우는 전 종목 시계열 데이터의 완벽한 수집과 ICS(Indicator Comprehensive Storage) 표준에 따른 지표 동기화를 수행합니다.

## 🏛️ 클린 아키텍처 역할 (Infrastructure Layer)
- **외부 연동**: FDR, Daum, Naver API와의 인터페이스 담당.
- **무결성 사수**: `verify-data-integrity` 스킬을 사용하여 데이터 오염 원천 차단.

## 🛠️ 실행 단계

### 1. [수집] 델타 업데이트
- `daily_update.py`를 실행하여 장 마감 데이터 수집. (Safety Guard 준수)

### 2. [정제] Audit & Repair
- `audit_and_report()`를 통해 공식 레포와 대조.
- 결함 발견 시 `check_integrity_and_repair()` 자동 가동.

### 3. [동기화] Full-TF Synchronization
- `MARF_Indicator_Manager.run_bulk()`를 통해 D/W/M/Q/Y 전 주기 지표 재산출.

### 4. [검증] 최종 감사
// turbo
1. `verify-data-integrity` 스킬 실행
2. 삼성전자(005930) 등 주요 벤치마크 종목의 종가 및 지표값 대조 완료 보고

---
*Created by SanchoRyong: Sentry Personality*
