---
name: design-quantum-terminal
description: Figma, FlyonUI, shadcn/ui 등 현대적 디자인 도구를 활용하여 7분할 퀀텀 터미널의 미학(Aesthetics)과 UX를 '고아단아'의 경지로 리모델링합니다.
---

# 퀀텀 터미널 디자인 특화 가이드 (design-quantum-terminal)

## 🏛️ 디자인 철학: 검이블루 화이불치 (儉而不陋 華而不侈)

**"검소하되 누추하지 않고, 화려하되 사치스럽지 않다. (高雅端雅)"**

7분할 퀀텀 터미널은 단순한 차트 나열이 아니라, 퀀텀 트레이더가 0.1%의 직관력을 유지할 수 있는 **'예술적 질서'**가 담겨야 합니다.

---

## 🎨 1단계: 디자인 MCP 무료 구축 및 설정 (갈릴레용 가이드)

### 1-1. Figma (피그마) MCP 설정 (무료)
Figma는 디자인의 '설계도'입니다. 개인 계정은 **무료**입니다. [Figma.com](https://www.figma.com)

1.  **Personal Access Token 발급**:
    - Figma 로그인 -> 상단 프로필 클릭 -> **Settings** 진입.
    - **Personal access tokens** 섹션에서 `Generate new token` 클릭.
    - 이름을 `MARF_Design_MCP`로 하고 모든 권한 부여 후 생성된 토큰(`figd_...`)을 복사하여 안전한 곳에 보관.
2.  **File ID 확인**:
    - 갈릴레용님이 만든(또는 제가 제안한) 디자인 파일 URL의 중간 부분 문자열입니다.
    - 예: `https://www.figma.com/file/ABC123XYZ/MARF_Design` -> `ABC123XYZ`가 ID입니다.

### 1-2. FlyonUI & shadcn/ui 스타일 이식 (무료/오픈 소스)
이들은 별도의 설치보다는 **Tailwind CSS CDN**을 통해 대시보드에 직접 주입(Injection)하는 방식을 사용합니다.

---

## 🖌️ 2단계: 퀀텀 터미널 디자인 표준 (Standards)

### 🏮 색상 체계 (Zen Black Palette)
| 구분 | 코드 | 설명 |
|------|------|------|
| **Background** | `#000000` | Pure Black (조선 흑자) |
| **Foreground** | `#050505` | Subtle Soft Black |
| **Border** | `#1a1a1a` | Dark Graphite (정돈된 경계) |
| **Accent (Gold)** | `#D4AF37` | Antique Gold (성공의 빛) |
| **Accent (Blue)** | `#00FFFF` | Cyber Blue (데이터의 흐름) |

### 📏 레이아웃 황금 비율
- **Main Chart (Price)**: 전체 높이의 **50%** 차지.
- **Support Panes (V, M, T, Q, X)**: 나머지 50%를 1:1:1:1:1로 분할.
- **Gutter (간격)**: 각 페인 사이의 간격은 `2px`로 고정하여 **타이트하고 정밀한** 인상을 줌.

---

## 🚀 3단계: 리모델링 시나리오 (실행 순서)

1.  **[설계]**: Figma MCP를 통해 갈릴레용님의 의중을 담은 레이아웃 정보를 가져옴.
2.  **[컴포넌트]**: FlyonUI 스타일의 사이드바와 shadcn/ui 느낌의 폰트 타이포그래피 주입.
3.  **[동기화]**: 7분할 차트의 범례(Legend) 수치를 shadcn/ui 스타일의 배지(Badge)와 부드러운 애니메이션으로 결합.

---

## 🛡️ 디자인 품질 감사 (Quality Gate)
- [ ] 십자선 동기화 딜레이가 10ms 이내인가?
- [ ] 모든 숫자에 콤마(`,`)와 올바른 단위(억/만)가 붙어 있는가?
- [ ] '고아단격'의 진한 블랙 테마가 유지되는가?

---
*Created by SanchoRyong (산쵸룡) for Galileo Galileo* ✅
