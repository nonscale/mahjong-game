---
name: yl-to-python-converter
description: 예스랭기지(YesLanguage/YIN) 지표와 함수를 파이썬(Polars) 코드로 정밀하게 변환합니다. 모든 계산은 원/주 단위로 수행하고, 최종 표현 시에만 억 원/만 주 단위를 적용하는 원칙을 준수합니다.
---

# 🚀 YL to Python (Polars) Converter

이 스킬은 예스트레이더의 YesLanguage(`.yin`) 로직을 고성능 파이썬 라이브러리인 **Polars**로 변환하는 데 최적화되어 있습니다.

## 📌 핵심 변환 원칙 (Core Principles)

1.  **[정밀도 최우선]**: 모든 수치 계산은 반드시 **원(KRW), 주(Share)** 단위를 기본으로 수행한다. (계산 도중 단위 변환 금지)
2.  **[시계열 데이터]**: 데이터 처리는 단편적인 스냅샷이 아닌, 과거부터 현재까지의 흐름을 포함하는 **시계열 데이터(Time-Series)**를 기본으로 한다.
3.  **[종가일 기준]**: 모든 캔들/바(Bar)의 기준 날짜는 시작일이 아닌 **'종료일(종가일)'**로 설정한다. (Polars: `label='right', closed='right'`)
4.  **[Polars 우선]**: Pandas 대신 고속 처리가 가능한 **Polars**의 Lazy API를 적극 활용한다.
5.  **[초기값 0-초기화]**: 예스랭귀지의 `[1]`(전봉 참조)은 데이터 시작점 이전의 값을 **`0`**으로 간주한다. 파이썬 변환 시 `fill_null(0)` 또는 루프 내 `if i > 0 else 0` 처리를 엄격히 준수한다.
6.  **[상태 유지(Persistence)]**: `Side` 판별이나 조건별 누적 시, 새로운 조건이 발생하지 않으면 **이전 상태를 그대로 유지(Forward Fill)**해야 에너지가 증발하지 않는다.
7.  **[정밀 역연산]**: `tXe`와 같이 미세한 오차가 증폭되는 고차 역연산(De-lagging) 지표는 Polars 벡터 연산보다 **Numpy 루프를 통한 절차적 구현**이 YL 차트와 100% 일치하는 정답을 보장한다.
8.  **[MVo4 리셋 원칙]**: 수급 에너지 누적 시 `Side`가 변하는(크로스) 시점에는 이전 누적치를 즉시 **0으로 리셋**하고 현재 봉의 값으로 새로 시작한다.
9.  **[기하학적 교점]**: `foPov3`를 통한 교점(`cenV/M`)은 에너지가 실제로 **교차(CrossUp/Down)**하는 찰나에만 업데이트하고 그 외에는 이전 값을 유지한다.
10. **[Latching(고정) 로직]**: `fixReqPrice` 등 고정 가격은 시그널이 **최초 발생한 시점**의 값을 변수에 저장하여 조건 해제 전까지 유지해야 한다. 이를 위해 히스토리 전체를 순회하는 상태 머신(State Machine) 로직이 필수적이다.
11. **[단위 오차 허용]**: 예스트레이더와 파이썬의 부동소수점 및 단위 변환(억/만)으로 인해 발생하는 소수점 단위의 미세한 차이는 감수하되, 정수값 및 방향성(Gap)은 100% 일치해야 한다.

## 🛠️ YL 함수 - Polars 매핑 가이드

| YL 함수 | Polars 구현 방식 | 비고 |
| :--- | :--- | :--- |
| `MA(C, P)` | `pl.col('close').rolling_mean(window_size=P)` | 이동평균 |
| `Highest(H, P)` | `pl.col('high').rolling_max(window_size=P)` | 최고가 |
| `Lowest(L, P)` | `pl.col('low').rolling_min(window_size=P)` | 최저가 |
| `IFF(Cond, A, B)` | `pl.when(Cond).then(A).otherwise(B)` | 조건문 |
| `ValueWhen(N, C, V)`| `pl.col(V).filter(C).tail(N).first()` | 특정 조건 시점의 값 |
| `Accum(V)` | `pl.col(V).cum_sum()` | 누적 합계 |

## 📊 최종 표현 규칙 (Output Formatting)

사용자에게 보고하거나 대시보드에 표시할 때만 아래 단위를 적용한다.

- **거래량(만):** `(volume / 10_000).round(2)`
- **거래대금(억):** `(amount / 100_000_000).round(2)`
- **외국환:** 해당 통화로 정밀 계산 후, 최종 단계에서 KRW 환산 및 단위 적용.

## 📁 파일 처리
- 입력: `.yin`, `.txt` (YL 소스)
- 출력: `.py` (Polars 코드), `.csv`/`.parquet` (결과 데이터)
- **모든 입출력은 `encoding='utf-8'` 명시 필수.**

## 💡 변환 예시 (Workflow)

1.  YL 코드 분석: 변수 및 파라미터(`Input`) 추출.
2.  데이터 로드 로직 생성: `pl.read_csv()` 또는 API 연동 코드 작성.
3.  지표 계산 로직 구현: 위 매핑 가이드를 따라 Polars 구문으로 변환.
4.  시각화/검증: 계산된 결과를 억 원/만 주 단위로 변환하여 출력하는 `print()` 또는 차트 코드 추가.
