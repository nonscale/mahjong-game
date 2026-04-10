---
name: yl-to-spot-integrator
description: 파이썬(Polars)으로 계산된 로직을 예스스팟(YesSpot/JavaScript) 환경에서 연동하거나, 스팟 내에서 지표 로직을 구현합니다. 데이터 입출력 규약과 파일 워처 방식을 활용한 통합 전략을 지원합니다.
---

# 🔗 YL to Spot Integrator

이 스킬은 파이썬의 강력한 분석 성능과 예스스팟의 실시간 주문 및 모니터링 기능을 연결하는 브릿지 역할을 합니다.

## 📌 핵심 통합 전략 (Integration Strategy)

1.  **[데이터 정합성]**: 파이썬에서 계산된 모든 수치는 스팟으로 전달될 때 **원(KRW), 주(Share)** 단위를 기본으로 전달한다. (스팟에서 직접 주문 수량을 결정할 때 오차 방지)
2.  **[파일 기반 통신]**: `Main.PrintOnFile` 또는 CSV/JSON 파일을 활용한 비동기 통신 방식을 우선한다.
3.  **[실시간 대응]**: 스팟의 `OnBar`, `OnTick` 이벤트 루프 내에서 파이썬 결과값을 호출하거나 반영하는 최적화된 로직을 구성한다.
4.  **[Discord 알림]**: 통합 시스템의 모든 주요 신호는 지정된 Discord 채널로 전송한다. (File Watcher 방식 활용)

## 🛠️ 예스스팟 구현 가이드

### 1. 파이썬 계산 결과 로드 (Spot)
- `Main.RunApp()`을 통해 파이썬 스크립트 실행.
- 파이썬이 생성한 JSON/CSV 파일을 `Main.PrintOnFile` 또는 JS 파일 입출력으로 로드.

### 2. 스팟 지표 구현 규칙
- YL 지표를 스팟(JS)에서 직접 구현할 경우, `yl-to-python-converter`의 로직을 JS 문법으로 1:1 대응하여 구현.

## 📊 표현 및 알림 규칙 (UI/Alert)

- **출력/알림:** 최종 메시지(Discord 등)에는 반드시 **억 원/만 주** 단위를 적용한다.
- **예시:** `[매수신호] 종목: 삼성전자, 목표가: 85,000원, 예상거래대금: 1.2억 원`

## 📁 통합 워크플로우 (Workflow)

1.  **[Python]**: 대량의 시계열 데이터를 Polars로 고속 처리 및 신호(Signal) 생성.
2.  **[File]**: 신호 데이터를 JSON 포맷으로 `data/signals.json`에 기록.
3.  **[Spot]**: 실시간으로 `signals.json`을 감시하거나 특정 이벤트 발생 시 로드.
4.  **[Order]**: 로드된 신호에 따라 주문(Buy/Sell) 실행.
5.  **[Alert]**: 주문 결과를 Discord로 즉시 전송.

## 💡 주요 스팟 명령어 (Reference)
- `Main.PrintOnFile(filename, text)`: 데이터 저장/로그.
- `Main.RunApp(path, arg)`: 외부 분석 프로그램(Python) 실행.
- `MarketData.GetBar(N, Type)`: 데이터 추출.
