# 🏛️ The 2026 Annual Planet Gathering : Semester of Planet
> **"플래닛 북 아카데미 2026 연말 모임 — 정통 아이비리그와 지적인 긱 시크의 만남"**

[![Deploy to GitHub Pages](https://github.com/hanjisubusiness22222/MVPproject/actions/workflows/deploy.yml/badge.svg)](https://github.com/hanjisubusiness22222/MVPproject/actions)

---

## 📌 행사 개요 (Event Overview)

- **주최**: 플래닛 북 아카데미 (**PLANET Book Academy** / since 2017)
- **일시**: **2026년 12월 19일 (토)**
  - **1부 (Main Session)**: `12:00 ~ 18:00` | 플래닛 연말 모임 **「플래닛의 새학기」** @ 공간나인 강남점
  - **2부 (After Session)**: `18:00 ~ LATE` | 애프터 나이트 프롬 **「플래닛의 윈터 프롬 (The Winter Prom)」** @ 강남 파티룸
- **드레스코드**: **Classic Preppy with a Twist of Geek Chic**
  - 블레이저, 케이블 니트/베스트, 넥타이, 플리츠 스커트/치노 팬츠, 긱 시크 뿔테·무테 안경
- **준비물**: 동료 학우에게 선물할 엄선된 도서 1권 (추천사 동봉), 필기구, 열린 마음

---

## ✨ 주요 기능 (Key Features)

| 기능 | 설명 |
| :--- | :--- |
| **0. 인터랙티브 티저 (Teaser)** | 골드/버건디 **실링 왁스(Wax Seal)** 개봉 애니메이션, D-Day 카운트다운, 사전 알림 신청 |
| **1. 공식 초대 서간문 (Invitation)** | 옥스포드 크림지 바탕의 아카데미 공식 초청장, 프로그램 타임라인 및 드레스코드 룩북 |
| **2. RSVP 신청 폼** | 1부/2부 참석 여부, 성별, 학우 구분(신규/기존), 선물 도서 힌트 입력 및 유효성 검사 |
| **3. 모바일 캠퍼스 ID 발급** | 신청 즉시 개인 이름·고유 학번·바코드가 새겨진 **학생증/도서패스 이미지(PNG) 다운로드** |
| **4. 스마트 하우스 조배치 (`/seat`)** | **남/녀 성비 균등 + 신규/기존 균형** 2대 알고리즘 기반 세미나 조배치 (현장 빔프로젝터 모드 지원) |
| **5. 투명 회계 결산 (`/settlement`)** | 행정처(Bursar's Office) 감사 결산 양식의 수입/실비 지출 내역 및 영수증 증빙 공개 |
| **6. 관리자 대시보드 (`/admin`)** | 구글 시트 실시간 연동, 입금 확인 토글, 티저/정산 공개 원클릭 스위치 |

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons, Canvas-confetti, Framer Motion
- **Backend & Database**: Google Sheets API + Google Apps Script (Serverless, 완전 무료)
- **CI/CD & Hosting**: **GitHub Actions** 자동 빌드 파이프라인 ➔ **GitHub Pages** 무중단 무료 호스팅

---

## ⏱️ 5일 개발 스프린트 로드맵 (5-Day Sprint)

- **Day 1**: 프로젝트 기반 환경 구축, 디자인 시스템 및 **실링 왁스 티저 페이지 배포**
- **Day 2**: 아카데미 공식 초대장 템플릿 & **RSVP 참가 신청 폼 UI** 구현
- **Day 3**: Google Apps Script 연동(실시간 저장) & **모바일 캠퍼스 ID(PNG) 발급** 시스템 완성
- **Day 4**: **하우스 조배치 프로그램 (`/seat`)** 개발 (2대 밸런스 알고리즘) & **관리자 페이지** 구축
- **Day 5**: **투명 결산 공개 페이지 (`/settlement`)** 구현, 전 기기 반응형 검수 및 최종 배포

---

## 📖 상세 기획 문서
프로젝트의 전체 아키텍처, 와이어프레임 및 구체적인 데이터 스펙은 [PROJECT_PLAN.md](file:///c:/Users/pile1/OneDrive/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/%EC%88%98%EC%97%85/1%ED%95%99%EB%85%84%202%ED%95%99%EA%B8%B0/%EA%B8%B0%EC%88%A0%EA%B0%9C%EB%B0%9C%EC%97%B0%EA%B5%AC%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%97%B0%EB%A7%90%EB%AA%A8%EC%9E%84%ED%99%88%ED%8E%98%EC%9D%B4%EC%A7%80/PROJECT_PLAN.md)에서 확인하실 수 있습니다.
