export interface EventConfig {
  isTeaserMode: boolean;
  eventTitle: string;
  subTitle: string;
  themeTagline: string;
  organization: string;
  establishedYear: number;
  eventDate: string; // ISO or human readable
  targetDateTime: string; // for Countdown
  
  session1: {
    name: string;
    englishName: string;
    time: string;
    location: string;
    description: string;
    capacity: number;
    fee: number;
  };
  
  session2: {
    name: string;
    englishName: string;
    time: string;
    location: string;
    description: string;
    capacity: number;
    fee: number;
  };
  
  dressCode: {
    title: string;
    dayStyle: string;
    nightStyle: string;
    geekChicItems: string[];
  };
  
  requirements: string[];
  
  contact: {
    accountInfo: string;
    inquiryEmail: string;
  };
  
  googleScriptUrl: string;
}

export const EVENT_CONFIG: EventConfig = {
  isTeaserMode: true, // true: 티저 모드 우선 노출, false: 정식 오픈
  eventTitle: "2026 플래닛 연말 갈라",
  subTitle: "The Annual Planet Gala : The New Semester & The Winter Prom",
  themeTagline: "Where Classic Ivy Meets Modern Geek Chic & Romantic Prom Night",
  organization: "플래닛 북 아카데미 (PLANET Book Academy)",
  establishedYear: 2017,
  eventDate: "2026년 12월 19일 (토요일)",
  targetDateTime: "2026-12-19T12:00:00+09:00",
  
  session1: {
    name: "플래닛의 새학기",
    englishName: "The New Semester (Academic Session)",
    time: "12:00 ~ 18:00",
    location: "공간나인 강남점 (서울 강남구 테헤란로)",
    description: "올해의 플래닛 아카이브 회고, 블라인드 북 익스체인지(책 선물 교환) 및 2026 명예의 전당 어워즈",
    capacity: 35,
    fee: 45000,
  },
  
  session2: {
    name: "플래닛의 윈터 프롬",
    englishName: "The Winter Prom (Night Gala & Prom)",
    time: "18:00 ~ LATE",
    location: "Secret Prom Lounge (강남 프라이빗 파티룸)",
    description: "샴페인 토스트, 프롬 포토월 촬영, 실시간 베스트 드레서(Prom King & Queen) 투표 및 미드나잇 재즈 살롱",
    capacity: 25,
    fee: 35000,
  },
  
  dressCode: {
    title: "Classic Preppy with a Twist of Geek Chic",
    dayStyle: "네이비 금장 블레이저, 케이블 니트 베스트, 옥스포드 셔츠, 플리츠 스커트 / 치노 팬츠, 타이",
    nightStyle: "주간 프레피 룩에 보타이, 벨벳 리본, 코사지/부토니에 등 이브닝 프롬 액센트 추가",
    geekChicItems: ["클래식 뿔테 / 오벌 안경", "포켓치프", "로퍼 / 옥스포드 슈즈", "만년필 & 가죽 노트"],
  },
  
  requirements: [
    "동료 학우(Fellow)에게 선물할 엄선된 도서 1권 (정성 담긴 추천사 카드 동봉)",
    "만년필 또는 아날로그 필기구 1자루",
    "지적 호기심과 밤새 꺾이지 않는 프롬 텐션",
  ],
  
  contact: {
    accountInfo: "카카오뱅크 3333-01-XXXXXXX (예금주: 플래닛운영위)",
    inquiryEmail: "fellows@planet-academy.org",
  },
  
  googleScriptUrl: import.meta.env.VITE_GOOGLE_SCRIPT_URL || "",
};
