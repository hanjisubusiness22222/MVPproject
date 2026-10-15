import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Download, RefreshCw, Shuffle, Check, 
  Sparkles, BookOpen, User, Copy, CheckCircle2, QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import planetLogo from '../assets/planet-logo.png';

interface PartOption {
  name: string;
  badge: string;
  svg: string; // SVG inner elements
}

interface StepData {
  category: string;
  subTitle: string;
  colorName: string;
  colorHex: string;
  options: PartOption[];
}

// 5단계 고화질 일러스트 SVG 데이터 (viewBox: 0 0 200 200)
const HIGH_QUALITY_PARTS: Record<string, StepData> = {
  // 1단계: 얼굴형 & 피부톤 & 볼터치
  face: {
    category: '얼굴형 & 피부',
    subTitle: '개성 있는 피부톤과 귀여운 볼터치',
    colorName: '살구빛 톤',
    colorHex: '#2563EB',
    options: [
      {
        name: '동글 복숭아',
        badge: '인기',
        svg: `
          <!-- 귀 -->
          <circle cx="58" cy="95" r="9" fill="#FFF0DE" stroke="#1F1B18" stroke-width="2.5" />
          <circle cx="142" cy="95" r="9" fill="#FFF0DE" stroke="#1F1B18" stroke-width="2.5" />
          <!-- 얼굴 본체 -->
          <ellipse cx="100" cy="95" rx="42" ry="44" fill="#FFF0DE" stroke="#1F1B18" stroke-width="3" />
          <!-- 볼터치 -->
          <ellipse cx="73" cy="108" rx="8" ry="4" fill="#FDA4AF" opacity="0.85" />
          <ellipse cx="127" cy="108" rx="8" ry="4" fill="#FDA4AF" opacity="0.85" />
        `
      },
      {
        name: '갸름 계란형',
        badge: '청순',
        svg: `
          <circle cx="60" cy="95" r="8" fill="#FFF5EB" stroke="#1F1B18" stroke-width="2.5" />
          <circle cx="140" cy="95" r="8" fill="#FFF5EB" stroke="#1F1B18" stroke-width="2.5" />
          <path d="M 62 80 C 62 50 138 50 138 80 C 138 115 120 142 100 142 C 80 142 62 115 62 80 Z" fill="#FFF5EB" stroke="#1F1B18" stroke-width="3" />
          <ellipse cx="74" cy="106" rx="7" ry="4" fill="#F472B6" opacity="0.75" />
          <ellipse cx="126" cy="106" rx="7" ry="4" fill="#F472B6" opacity="0.75" />
        `
      },
      {
        name: '통통 찹쌀떡',
        badge: '귀염',
        svg: `
          <circle cx="56" cy="98" r="9" fill="#FEF7EE" stroke="#1F1B18" stroke-width="2.5" />
          <circle cx="144" cy="98" r="9" fill="#FEF7EE" stroke="#1F1B18" stroke-width="2.5" />
          <path d="M 100 52 C 135 52 144 72 144 95 C 144 125 130 144 100 144 C 70 144 56 125 56 95 C 56 72 65 52 100 52 Z" fill="#FEF7EE" stroke="#1F1B18" stroke-width="3" />
          <circle cx="71" cy="110" r="7" fill="#FB7185" opacity="0.75" />
          <circle cx="129" cy="110" r="7" fill="#FB7185" opacity="0.75" />
        `
      },
      {
        name: '각진 듬직형',
        badge: '신뢰',
        svg: `
          <circle cx="56" cy="95" r="9" fill="#FEEBC8" stroke="#1F1B18" stroke-width="2.5" />
          <circle cx="144" cy="95" r="9" fill="#FEEBC8" stroke="#1F1B18" stroke-width="2.5" />
          <path d="M 64 58 L 136 58 C 145 58 145 75 143 100 L 140 132 C 140 142 130 145 100 145 C 70 145 60 142 60 132 L 57 100 C 55 75 55 58 64 58 Z" fill="#FEEBC8" stroke="#1F1B18" stroke-width="3" />
          <ellipse cx="73" cy="108" rx="8" ry="4" fill="#FBBF24" opacity="0.65" />
          <ellipse cx="127" cy="108" rx="8" ry="4" fill="#FBBF24" opacity="0.65" />
        `
      },
      {
        name: '하트 요정형',
        badge: '발랄',
        svg: `
          <circle cx="58" cy="92" r="8" fill="#FFF0DE" stroke="#1F1B18" stroke-width="2.5" />
          <circle cx="142" cy="92" r="8" fill="#FFF0DE" stroke="#1F1B18" stroke-width="2.5" />
          <path d="M 60 70 C 60 48 140 48 140 70 C 142 98 122 132 100 144 C 78 132 58 98 60 70 Z" fill="#FFF0DE" stroke="#1F1B18" stroke-width="3" />
          <path d="M 72 107 C 72 105 75 104 76 106 C 77 104 80 105 80 107 C 80 109 76 112 76 112 C 76 112 72 109 72 107 Z" fill="#FDA4AF" />
          <path d="M 120 107 C 120 105 123 104 124 106 C 125 104 128 105 128 107 C 128 109 124 112 124 112 C 124 112 120 109 120 107 Z" fill="#FDA4AF" />
        `
      }
    ]
  },

  // 2단계: 헤어스타일
  hair: {
    category: '헤어스타일',
    subTitle: '단정한 스쿨룩 & 레트로 헤어',
    colorName: '초코·블랙 톤',
    colorHex: '#78350F',
    options: [
      {
        name: '모범 댄디컷',
        badge: '클래식',
        svg: `
          <path d="M 54 85 C 50 65 65 36 100 35 C 135 36 150 65 146 85 C 144 75 140 68 132 68 C 120 68 115 76 100 70 C 88 65 80 72 70 68 C 60 70 56 75 54 85 Z" fill="#38281F" stroke="#1F1B18" stroke-width="3" />
          <path d="M 75 48 Q 100 42 125 48" stroke="#6B4F3B" stroke-width="3" stroke-linecap="round" fill="none" />
        `
      },
      {
        name: '레트로 단발',
        badge: '단정',
        svg: `
          <path d="M 52 98 C 48 65 65 35 100 34 C 135 35 152 65 148 98 C 148 110 142 116 138 112 C 140 85 136 68 126 66 C 110 63 92 78 68 70 C 60 75 58 90 62 112 C 58 116 52 110 52 98 Z" fill="#1F2937" stroke="#1F1B18" stroke-width="3" />
          <path d="M 125 58 L 135 62" stroke="#DC2626" stroke-width="4" stroke-linecap="round" />
        `
      },
      {
        name: '양갈래 땋은머리',
        badge: '러블리',
        svg: `
          <path d="M 56 82 C 52 58 68 35 100 35 C 132 35 148 58 144 82 C 140 68 130 68 118 68 C 105 68 100 74 95 68 C 85 68 75 68 66 76 C 60 80 58 82 56 82 Z" fill="#78350F" stroke="#1F1B18" stroke-width="3" />
          <ellipse cx="46" cy="105" rx="8" ry="12" fill="#78350F" stroke="#1F1B18" stroke-width="2.5" />
          <circle cx="46" cy="118" r="4.5" fill="#EF4444" />
          <ellipse cx="154" cy="105" rx="8" ry="12" fill="#78350F" stroke="#1F1B18" stroke-width="2.5" />
          <circle cx="154" cy="118" r="4.5" fill="#EF4444" />
        `
      },
      {
        name: '복슬 베이비펌',
        badge: '포근',
        svg: `
          <path d="M 52 82 C 45 75 45 58 55 50 C 55 40 68 33 80 34 C 90 28 110 28 120 34 C 132 33 145 40 145 50 C 155 58 155 75 148 82 C 142 68 128 65 118 68 C 105 65 95 68 82 65 C 68 68 58 75 52 82 Z" fill="#92400E" stroke="#1F1B18" stroke-width="3" />
        `
      },
      {
        name: '프레피 베레모',
        badge: '스쿨룩',
        svg: `
          <ellipse cx="100" cy="46" rx="44" ry="16" fill="#166534" stroke="#1F1B18" stroke-width="3" transform="rotate(-6 100 46)" />
          <circle cx="124" cy="44" r="5" fill="#FBBF24" stroke="#B45309" stroke-width="1.5" />
          <path d="M 58 64 C 58 82 64 94 68 96 M 132 96 C 136 94 142 82 142 64" stroke="#1F1B18" stroke-width="3" fill="none" />
          <path d="M 75 58 Q 100 66 125 58" fill="#38281F" stroke="#1F1B18" stroke-width="2" />
        `
      }
    ]
  },

  // 3단계: 눈 & 표정
  eyes: {
    category: '눈 & 표정',
    subTitle: '빛나는 눈동자와 섬세한 눈썹',
    colorName: '초록 사인펜',
    colorHex: '#16A34A',
    options: [
      {
        name: '순정만화 반짝이',
        badge: '초롱초롱',
        svg: `
          <path d="M 66 76 C 72 73 82 74 86 77" stroke="#1F1B18" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <path d="M 114 77 C 118 74 128 73 134 76" stroke="#1F1B18" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <ellipse cx="76" cy="88" rx="8" ry="10" fill="#1F1B18" />
          <circle cx="74" cy="85" r="3" fill="#FFFFFF" />
          <circle cx="78" cy="92" r="1.5" fill="#FFFFFF" />
          <ellipse cx="124" cy="88" rx="8" ry="10" fill="#1F1B18" />
          <circle cx="122" cy="85" r="3" fill="#FFFFFF" />
          <circle cx="126" cy="92" r="1.5" fill="#FFFFFF" />
        `
      },
      {
        name: '지적 뿔테안경',
        badge: '모범생',
        svg: `
          <circle cx="75" cy="88" r="13" fill="none" stroke="#1F1B18" stroke-width="3.5" />
          <circle cx="125" cy="88" r="13" fill="none" stroke="#1F1B18" stroke-width="3.5" />
          <path d="M 88 87 Q 100 84 112 87" stroke="#1F1B18" stroke-width="3.5" fill="none" />
          <circle cx="75" cy="88" r="5" fill="#1F1B18" />
          <circle cx="73" cy="86" r="1.8" fill="#FFF" />
          <circle cx="125" cy="88" r="5" fill="#1F1B18" />
          <circle cx="123" cy="86" r="1.8" fill="#FFF" />
          <path d="M 66 73 L 84 73" stroke="#1F1B18" stroke-width="2" stroke-linecap="round" />
          <path d="M 116 73 L 134 73" stroke="#1F1B18" stroke-width="2" stroke-linecap="round" />
        `
      },
      {
        name: '러블리 윙크',
        badge: '심쿵',
        svg: `
          <path d="M 68 89 Q 76 82 84 89" stroke="#1F1B18" stroke-width="3.5" fill="none" stroke-linecap="round" />
          <path d="M 82 86 L 86 83" stroke="#1F1B18" stroke-width="2.5" stroke-linecap="round" />
          <ellipse cx="124" cy="88" rx="8" ry="10" fill="#1F1B18" />
          <circle cx="122" cy="85" r="3" fill="#FFFFFF" />
          <path d="M 68 76 Q 76 72 84 76" stroke="#1F1B18" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <path d="M 116 76 Q 124 72 132 76" stroke="#1F1B18" stroke-width="2.5" fill="none" stroke-linecap="round" />
        `
      },
      {
        name: '반달 눈웃음',
        badge: '다정',
        svg: `
          <path d="M 67 89 Q 76 80 85 89" stroke="#1F1B18" stroke-width="3.5" fill="none" stroke-linecap="round" />
          <path d="M 115 89 Q 124 80 133 89" stroke="#1F1B18" stroke-width="3.5" fill="none" stroke-linecap="round" />
          <path d="M 68 75 Q 76 71 84 75" stroke="#1F1B18" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <path d="M 116 75 Q 124 71 132 75" stroke="#1F1B18" stroke-width="2.5" fill="none" stroke-linecap="round" />
        `
      },
      {
        name: '밤샘 독서팬더',
        badge: '열정',
        svg: `
          <ellipse cx="76" cy="91" rx="12" ry="7" fill="#E2E8F0" opacity="0.8" />
          <ellipse cx="124" cy="91" rx="12" ry="7" fill="#E2E8F0" opacity="0.8" />
          <ellipse cx="76" cy="87" rx="7" ry="8" fill="#1F1B18" />
          <circle cx="74" cy="85" r="2.5" fill="#FFF" />
          <ellipse cx="124" cy="87" rx="7" ry="8" fill="#1F1B18" />
          <circle cx="122" cy="85" r="2.5" fill="#FFF" />
          <path d="M 68 75 L 84 78" stroke="#1F1B18" stroke-width="2" stroke-linecap="round" />
          <path d="M 132 75 L 116 78" stroke="#1F1B18" stroke-width="2" stroke-linecap="round" />
        `
      }
    ]
  },

  // 4단계: 코 & 입
  mouth: {
    category: '코 & 입',
    subTitle: '생기 있는 입술과 귀여운 미소',
    colorName: '체리 레드 톤',
    colorHex: '#DB2777',
    options: [
      {
        name: '체리빛 미소',
        badge: '화사함',
        svg: `
          <ellipse cx="100" cy="104" rx="2.5" ry="2" fill="#E29D82" />
          <path d="M 90 119 Q 100 133 110 119 Z" fill="#E11D48" stroke="#1F1B18" stroke-width="2.5" />
          <path d="M 93 121 Q 100 124 107 121" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" />
        `
      },
      {
        name: "고양이 ':3' 입",
        badge: '장난기',
        svg: `
          <polygon points="98,103 102,103 100,106" fill="#F472B6" />
          <path d="M 92 118 Q 96 123 100 119 Q 104 123 108 118" fill="none" stroke="#1F1B18" stroke-width="3" stroke-linecap="round" />
        `
      },
      {
        name: '앵두 삐죽입',
        badge: '새침',
        svg: `
          <circle cx="100" cy="104" r="2" fill="#D97706" />
          <ellipse cx="100" cy="122" rx="6" ry="5" fill="#FB7185" stroke="#1F1B18" stroke-width="2.5" />
          <path d="M 97 122 Q 100 124 103 122" stroke="#BE123C" stroke-width="2" fill="none" />
        `
      },
      {
        name: '장미꽃 물기',
        badge: '로맨틱',
        svg: `
          <path d="M 98 102 L 102 105 L 98 107" stroke="#1F1B18" stroke-width="2" fill="none" stroke-linecap="round" />
          <path d="M 91 120 Q 100 126 109 120" stroke="#1F1B18" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <path d="M 105 120 L 128 114" stroke="#15803D" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="132" cy="112" r="6" fill="#E11D48" stroke="#9F1239" stroke-width="1.5" />
        `
      },
      {
        name: '건치 함박웃음',
        badge: '유쾌',
        svg: `
          <circle cx="100" cy="104" r="3" fill="#FBBF24" stroke="#1F1B18" stroke-width="1.5" />
          <path d="M 86 116 Q 100 138 114 116 Z" fill="#BE123C" stroke="#1F1B18" stroke-width="3" />
          <path d="M 92 128 Q 100 120 108 128 Q 100 137 92 128 Z" fill="#FB7185" />
        `
      }
    ]
  },

  // 5단계: 스쿨룩 의상 & 소품
  body: {
    category: '스쿨룩 & 소품',
    subTitle: '단정한 프레피 교복과 독서 소품',
    colorName: '보라·네이비',
    colorHex: '#1E3A8A',
    options: [
      {
        name: '프레피 블레이저',
        badge: '대표 교복',
        svg: `
          <path d="M 64 140 L 40 200 L 160 200 L 136 140 Z" fill="#1E3A8A" stroke="#1F1B18" stroke-width="3" />
          <polygon points="100,162 82,140 100,146 118,140" fill="#FFFFFF" stroke="#1F1B18" stroke-width="2" />
          <polygon points="97,152 103,152 105,188 100,194 95,188" fill="#DC2626" stroke="#991B1B" stroke-width="1.5" />
          <path d="M 80 140 L 92 170 M 120 140 L 108 170" stroke="#1E293B" stroke-width="2.5" />
          <circle cx="100" cy="180" r="3" fill="#FBBF24" />
        `
      },
      {
        name: '케이블 니트조끼',
        badge: '따뜻함',
        svg: `
          <path d="M 64 140 L 42 200 L 158 200 L 136 140 Z" fill="#FEF3C7" stroke="#1F1B18" stroke-width="3" />
          <polygon points="100,160 84,140 100,146 116,140" fill="#78350F" stroke="#1F1B18" stroke-width="2" />
          <path d="M 84 140 L 100 168 L 116 140" stroke="#D97706" stroke-width="3" fill="none" />
          <path d="M 88 172 L 88 198 M 112 172 L 112 198" stroke="#D97706" stroke-width="2" stroke-dasharray="3 3" />
        `
      },
      {
        name: '초록 체육복 져지',
        badge: '추억의 2줄',
        svg: `
          <path d="M 64 140 L 38 200 L 162 200 L 136 140 Z" fill="#15803D" stroke="#1F1B18" stroke-width="3" />
          <polygon points="98,140 102,140 102,200 98,200" fill="#FFFFFF" stroke="#1F1B18" stroke-width="1.5" />
          <path d="M 52 158 L 44 200 M 58 155 L 50 200 M 148 158 L 156 200 M 142 155 L 150 200" stroke="#FFFFFF" stroke-width="2" />
        `
      },
      {
        name: '벽돌책 든 독서광',
        badge: '독서왕',
        svg: `
          <path d="M 64 140 L 42 200 L 158 200 L 136 140 Z" fill="#475569" stroke="#1F1B18" stroke-width="3" />
          <rect x="74" y="152" width="52" height="48" rx="4" fill="#B91C1C" stroke="#1F1B18" stroke-width="2.5" />
          <line x1="82" y1="152" x2="82" y2="200" stroke="#FBBF24" stroke-width="2" />
          <circle cx="102" cy="176" r="6" fill="#FBBF24" stroke="#78350F" stroke-width="1" />
          <ellipse cx="72" cy="176" rx="6" ry="5" fill="#FFF0DE" stroke="#1F1B18" stroke-width="2" />
          <ellipse cx="128" cy="176" rx="6" ry="5" fill="#FFF0DE" stroke="#1F1B18" stroke-width="2" />
        `
      },
      {
        name: '파자마 & 따아 머그',
        badge: '수학여행',
        svg: `
          <path d="M 64 140 L 42 200 L 158 200 L 136 140 Z" fill="#E0F2FE" stroke="#1F1B18" stroke-width="3" />
          <line x1="56" y1="160" x2="144" y2="160" stroke="#0284C7" stroke-width="2" />
          <line x1="50" y1="178" x2="150" y2="178" stroke="#0284C7" stroke-width="2" />
          <rect x="116" y="166" width="18" height="22" rx="3" fill="#FFFFFF" stroke="#1F1B18" stroke-width="2" />
          <path d="M 134 171 C 140 171 140 182 134 182" stroke="#1F1B18" stroke-width="2" fill="none" />
          <path d="M 122 158 Q 120 152 124 148 M 128 159 Q 130 153 127 149" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" fill="none" />
        `
      }
    ]
  }
};

const STEP_KEYS = ['face', 'hair', 'eyes', 'mouth', 'body'];

interface StudentCardStudioProps {
  onBack: () => void;
}

export const StudentCardStudio: React.FC<StudentCardStudioProps> = ({ onBack }) => {
  // 공책 게임 상태
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0..4
  const [activeSlot, setActiveSlot] = useState(0);             // 0..4
  const [selectedResults, setSelectedResults] = useState<(number | null)[]>([0, 0, 0, 0, 0]); // 기본 1번 세트 세팅
  const [isPlaying, setIsPlaying] = useState(true);

  // 카드 탭: 'student' (학생증) | 'library' (도서대출카드)
  const [cardMode, setCardMode] = useState<'student' | 'library'>('student');

  // 학생증 인적사항 3대 항목 + 세션
  const [name, setName] = useState('김플래닛');
  const [seasonGroup, setSeasonGroup] = useState<'스프링토' | '미들썸머' | '어텀' | '윈터블'>('윈터블');
  const [grade, setGrade] = useState<'1학년' | '2학년' | '3학년' | '4학년'>('2학년');
  const [sessionType, setSessionType] = useState('1부+2부 전체 참석');
  const [bookHint, setBookHint] = useState('삶의 쉼표가 되어준 소설 1권');

  // 이미지 다운로드
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 기존 등록 명단에서 불러오기
  const [registeredList, setRegisteredList] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('planet_rsvps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRegisteredList(parsed);
        }
      }
    } catch {}
  }, []);

  // 볼펜 왕복 타이머 (85ms)
  useEffect(() => {
    if (!isPlaying || currentStepIndex >= STEP_KEYS.length) return;

    let direction = 1;
    const interval = setInterval(() => {
      setActiveSlot(prev => {
        let next = prev + direction;
        if (next >= 4) {
          next = 4;
          direction = -1;
        } else if (next <= 0) {
          next = 0;
          direction = 1;
        }
        return next;
      });
    }, 85);

    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex]);

  // 스페이스바 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
          return;
        }
        e.preventDefault();
        handleStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // 멈춰! 핸들러
  const handleStop = () => {
    if (currentStepIndex >= STEP_KEYS.length) return;

    const chosen = activeSlot;
    const updated = [...selectedResults];
    updated[currentStepIndex] = chosen;
    setSelectedResults(updated);

    confetti({
      particleCount: 15,
      spread: 40,
      origin: { y: 0.65 }
    });

    const nextStep = currentStepIndex + 1;
    setCurrentStepIndex(nextStep);

    if (nextStep >= STEP_KEYS.length) {
      setIsPlaying(false);
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  // 선도부한테 빌어서 재촬영 (초기화)
  const handleReset = () => {
    setSelectedResults([0, null, null, null, null]);
    setCurrentStepIndex(0);
    setActiveSlot(0);
    setIsPlaying(true);
  };

  // 1초 올랜덤 뽑기
  const handleQuickRandom = () => {
    const randoms = [
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5)
    ];
    setSelectedResults(randoms);
    setCurrentStepIndex(5);
    setIsPlaying(false);
    confetti({ particleCount: 50, spread: 70 });
  };

  // 특정 부위 직접 수동 선택 (파츠 클릭)
  const handleDirectSelect = (stepIdx: number, optIdx: number) => {
    const updated = [...selectedResults];
    updated[stepIdx] = optIdx;
    setSelectedResults(updated);
  };

  // 아바타 코드 생성: F{i}-H{i}-E{i}-M{i}-B{i}
  const prefix = ['F', 'H', 'E', 'M', 'B'];
  const avatarCode = selectedResults
    .map((r, i) => `${prefix[i]}${r !== null ? r + 1 : '1'}`)
    .join('-');

  // 이미지 다운로드
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `2026_플래닛_학생증_${name || '학우'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download card:', err);
      alert('학생증 저장 중 오류가 발생했습니다. 화면을 캡처해 주세요!');
    } finally {
      setIsDownloading(false);
    }
  };

  // 기존 명단 선택 시 자동 채우기
  const handleSelectRecord = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const found = registeredList.find(r => r.name === val || r.studentNumber === val);
    if (found) {
      setName(found.name || '');
      setBookHint(found.bookTitle || found.bookHint || '선물할 책 준비 중');
      setSessionType(found.session || '1부+2부 전체 참석');
    }
  };

  const currentStepData = currentStepIndex < STEP_KEYS.length 
    ? HIGH_QUALITY_PARTS[STEP_KEYS[currentStepIndex]] 
    : null;

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1f1b18] font-sans py-4 sm:py-8 px-2.5 sm:px-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">

        {/* 상단 관리자 네비게이션 헤더 */}
        <header className="bg-white/95 border-2 border-[#1f1b18] rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#d8d3c7] bg-[#f8f6f0] hover:bg-[#ede8dc] text-xs font-serif text-[#1f1b18] transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-[#b82828]" />
              <span>관리자 대시보드로 돌아가기</span>
            </button>

            <div className="flex items-center space-x-2">
              <img src={planetLogo} alt="플래닛" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded bg-white border border-[#e5e0d8] p-0.5 shadow-sm" />
              <div>
                <h1 className="font-serif text-sm sm:text-base font-bold text-[#1f1b18] flex items-center space-x-1.5">
                  <span>추억의 공책 게임 아바타 학생증 공작소</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#b82828] text-white">현장 발급</span>
                </h1>
                <p className="text-[10px] text-[#666] font-serif">5단계 '볼펜 멈춰!' 손그림 아바타 생성 및 고화질 네임택 즉시 인쇄</p>
              </div>
            </div>
          </div>

          {/* 명단에서 원클릭 불러오기 (관리자 편의 기능) */}
          {registeredList.length > 0 && (
            <div className="flex items-center space-x-1.5 text-xs font-serif">
              <span className="text-[#666] whitespace-nowrap">📋 참가자 불러오기:</span>
              <select 
                onChange={handleSelectRecord}
                className="text-xs font-serif border border-[#ccc] rounded px-2 py-1 bg-white focus:outline-none focus:border-[#b82828]"
              >
                <option value="">명단에서 선택...</option>
                {registeredList.map((r, i) => (
                  <option key={i} value={r.name}>{r.name} ({r.session})</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* 메인 2단 작업 그리드: [좌: 공책 볼펜 멈춰 게임판] / [우: 실시간 발급 카드 & 편집] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">

          {/* ======================================================== */}
          {/* [좌측 7컬럼] 추억의 스프링 공책 "볼펜 멈춰!" 게임판           */}
          {/* ======================================================== */}
          <section className="lg:col-span-7 bg-[#FAF8F2] border-2 border-[#1f1b18] rounded-xl shadow-xl overflow-hidden relative">
            
            {/* 스프링 바인더 철 장식 */}
            <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-[#e8e4dc] border-r-2 border-[#1f1b18] flex flex-col justify-around py-4 items-center z-10 select-none">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-3 h-5 sm:w-4 sm:h-6 bg-[#222] rounded-full border border-gray-400"></div>
              ))}
            </div>

            <div className="pl-8 sm:pl-11 p-4 sm:p-6 min-h-[560px] flex flex-col justify-between"
                 style={{
                   backgroundColor: '#FAF8F2',
                   backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(37, 99, 235, 0.12) 28px)',
                   backgroundSize: '100% 28px'
                 }}>
              
              <div>
                {/* 과목 및 진행도 */}
                <div className="flex items-center justify-between border-b-2 border-[#b82828] pb-2 mb-3">
                  <div className="font-serif text-base sm:text-lg font-bold text-[#b82828] flex items-center space-x-2">
                    <span>과목: 독서학교 학생증 사진촬영</span>
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#b82828] text-white">제 1 교시</span>
                  </div>
                  <div className="font-serif text-xs sm:text-sm text-[#444]">
                    진행도: <strong className="text-[#2563EB] text-base">{Math.min(currentStepIndex + 1, 5)}/5단계</strong>
                  </div>
                </div>

                {/* 현재 카테고리 알림 */}
                <div className="bg-white/95 border border-[#1f1b18]/30 rounded-lg p-2.5 mb-3 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#777] font-sans">현재 뽑는 부위:</span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1f1b18]">
                      {currentStepIndex < 5 
                        ? `${currentStepIndex + 1}단계 <${currentStepData?.category}>`
                        : '🎉 5단계 완성! 아바타가 모두 조립되었습니다!'}
                    </h3>
                    <p className="text-[11px] text-[#666] font-serif">
                      {currentStepData?.subTitle || '마음에 안 들면 다시 뽑거나 직접 클릭해 수정하세요.'}
                    </p>
                  </div>
                  {isPlaying && currentStepIndex < 5 && (
                    <div className="text-[11px] font-sans text-right text-[#555]">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping mr-1"></span>
                      <span>볼펜 질주 중 (85ms)</span>
                    </div>
                  )}
                </div>

                {/* 5개 파츠 카드 슬롯 그리드 (고화질 일러스트 썸네일) */}
                {currentStepData && (
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-3">
                    {currentStepData.options.map((opt, idx) => {
                      const isActive = activeSlot === idx && isPlaying;
                      return (
                        <div 
                          key={idx}
                          onClick={() => handleDirectSelect(currentStepIndex, idx)}
                          className={`cursor-pointer bg-white/95 border-2 rounded-lg p-1.5 text-center transition-all duration-75 relative hover:border-[#1f1b18] ${
                            isActive 
                              ? 'border-[#DC2626] bg-yellow-100/90 shadow-md scale-105' 
                              : 'border-dashed border-[#888]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-serif font-bold text-[#555] mb-0.5 px-0.5">
                            <span>{['①', '②', '③', '④', '⑤'][idx]}</span>
                            <span className="text-[8px] font-mono px-1 rounded bg-[#eee] text-[#555]">{opt.badge}</span>
                          </div>
                          
                          {/* 고화질 SVG 썸네일 */}
                          <div className="w-full aspect-square flex items-center justify-center bg-[#FAF8F5] rounded border border-gray-200 overflow-hidden">
                            <svg 
                              viewBox="0 0 200 200" 
                              className="w-full h-full"
                              dangerouslySetInnerHTML={{ __html: opt.svg }}
                            />
                          </div>

                          <div className="text-[10px] font-serif font-bold text-[#1f1b18] truncate mt-1">
                            {opt.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="text-center py-1">
                  <div className="inline-flex items-center space-x-1.5 bg-yellow-100/90 px-3 py-1 rounded-full border border-yellow-300 text-[11px] font-serif text-yellow-900">
                    <span>🖋️ 모나미 볼펜이 눈 깜짝할 새 왔다 갔다 하는 중! 타이밍을 맞춰보세요. (클릭 선택도 가능)</span>
                  </div>
                </div>
              </div>

              {/* 공책 하단 조작 버튼 */}
              <div className="pt-4 border-t-2 border-[#1f1b18]/20 space-y-2.5">
                <button
                  type="button"
                  onClick={handleStop}
                  disabled={currentStepIndex >= 5}
                  className={`w-full py-3.5 sm:py-4 rounded-xl text-white font-serif font-black text-lg sm:text-2xl shadow-lg border-2 active:scale-98 transition-all flex items-center justify-center space-x-2 ${
                    currentStepIndex < 5
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C] border-[#7F1D1D]'
                      : 'bg-[#16A34A] border-[#15803D]'
                  }`}
                >
                  {currentStepIndex < 5 ? (
                    <span>✋ 멈춰! (클릭 또는 스페이스바)</span>
                  ) : (
                    <span>✨ 아바타 조립 완료! (다시 뽑기 가능)</span>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2 text-xs font-serif">
                  <button 
                    type="button"
                    onClick={handleQuickRandom}
                    className="px-3 py-1.5 rounded-lg border border-[#888] bg-white hover:bg-[#ede8dc] text-[#333] flex items-center space-x-1 transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-[#2e5238]" />
                    <span>🎲 운명에 맡기기 (1초 랜덤)</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg border border-[#dc2626]/40 bg-red-50 hover:bg-red-100 text-[#b91c1c] font-bold flex items-center space-x-1 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>선도부한테 빌어서 재촬영하기 (초기화)</span>
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* ======================================================== */}
          {/* [우측 5컬럼] 실시간 발급 카드 (학생증/대출증) & 정보 편집 */}
          {/* ======================================================== */}
          <section className="lg:col-span-5 space-y-4">
            
            {/* 카드 탭 스위처: [학생증 모드] vs [도서대출카드 모드] */}
            <div className="flex items-center bg-[#e8e4dc] p-1 rounded-xl border border-[#1f1b18]/30 font-serif text-xs sm:text-sm font-bold">
              <button 
                type="button"
                onClick={() => setCardMode('student')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  cardMode === 'student' ? 'bg-white text-[#1f1b18] shadow-sm' : 'text-[#666] hover:text-[#111]'
                }`}
              >
                🪪 학생증 모드
              </button>
              <button 
                type="button"
                onClick={() => setCardMode('library')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  cardMode === 'library' ? 'bg-white text-[#1f1b18] shadow-sm' : 'text-[#666] hover:text-[#111]'
                }`}
              >
                📖 도서대출카드 모드
              </button>
            </div>

            {/* 캡처 대상: 실물 발급 카드 */}
            <div 
              ref={cardRef}
              className="bg-white border-2 border-[#1f1b18] rounded-xl p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden"
            >
              {/* 카드 상단 헤더 */}
              <div className="border-b-2 border-[#1f1b18] pb-2 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b82828]"></span>
                  <span className="font-mono text-[9px] tracking-widest text-[#777]">PLANET-2026</span>
                </div>
                <div className="font-serif text-[11px] sm:text-xs font-bold text-[#1f1b18]">
                  {cardMode === 'student' ? '2026 플래닛의 새학기 공식 학생증' : '플래닛 도서관 공식 도서대출증'}
                </div>
              </div>

              {/* 카드 본문: [5겹 고화질 합체 증명사진] + [인적사항 3대 항목] */}
              <div className="grid grid-cols-12 gap-3 items-center">
                
                {/* 증명사진 란 (5겹 SVG 레이어 스택: 몸통 -> 얼굴형 -> 눈 -> 입 -> 헤어스타일 순서로 완벽 결합) */}
                <div className="col-span-5">
                  <div 
                    className="aspect-[3/4] w-full border-2 border-[#1f1b18] rounded-lg relative overflow-hidden flex items-center justify-center shadow-inner"
                    style={{
                      backgroundColor: '#FAF8F5',
                      backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
                      backgroundSize: '12px 12px'
                    }}
                  >
                    {/* 레이어 0: 몸통 & 의상 (가장 아래) */}
                    {selectedResults[4] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full"
                           dangerouslySetInnerHTML={{ __html: HIGH_QUALITY_PARTS.body.options[selectedResults[4]!].svg }} />
                    )}

                    {/* 레이어 1: 얼굴형 & 피부톤 & 볼터치 */}
                    {selectedResults[0] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full"
                           dangerouslySetInnerHTML={{ __html: HIGH_QUALITY_PARTS.face.options[selectedResults[0]!].svg }} />
                    )}

                    {/* 레이어 2: 눈 & 눈썹 */}
                    {selectedResults[2] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full"
                           dangerouslySetInnerHTML={{ __html: HIGH_QUALITY_PARTS.eyes.options[selectedResults[2]!].svg }} />
                    )}

                    {/* 레이어 3: 코 & 입 */}
                    {selectedResults[3] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full"
                           dangerouslySetInnerHTML={{ __html: HIGH_QUALITY_PARTS.mouth.options[selectedResults[3]!].svg }} />
                    )}

                    {/* 레이어 4: 헤어스타일 & 모자/핀 (가장 위에서 얼굴을 덮음) */}
                    {selectedResults[1] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full"
                           dangerouslySetInnerHTML={{ __html: HIGH_QUALITY_PARTS.hair.options[selectedResults[1]!].svg }} />
                    )}
                  </div>
                  <div className="text-center mt-1 font-serif text-[10px] text-[#777]">증명사진 (고화질 아바타)</div>
                </div>

                {/* 우측 인적사항 란 */}
                <div className="col-span-7 space-y-1.5 font-serif text-xs text-[#2c2621]">
                  
                  {cardMode === 'student' ? (
                    <div className="space-y-1">
                      <div>
                        <span className="text-[10px] text-[#777]">성명:</span>
                        <div className="font-bold text-sm sm:text-base text-[#111]">{name || '김플래닛'}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <span className="text-[10px] text-[#777]">소속반:</span>
                          <div className="font-bold text-[#2e5238]">{seasonGroup}반</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#777]">학년:</span>
                          <div className="font-bold text-[#b82828]">{grade}</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#777]">기증 도서 힌트:</span>
                        <div className="text-[10px] text-[#444] line-clamp-1 italic">{bookHint || '선물할 책 준비 중'}</div>
                      </div>
                      <div className="pt-0.5">
                        <span className="text-[10px] text-[#777]">등교 일자:</span>
                        <div className="font-mono text-[10px] text-[#333]">2026. 12. 19. (토) 10:00</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="border border-[#1f1b18] text-center p-1 bg-[#fdfbf7] rounded">
                        <div className="font-bold text-[11px] font-serif text-[#1f1b18]">플래닛 도서대출증</div>
                        <div className="text-[9px] text-[#888]">NO. 2026-PLANET-BOOK</div>
                      </div>
                      <div className="border border-[#1f1b18] text-[9px] text-center">
                        <div className="grid grid-cols-2 bg-[#eae5d8] font-bold border-b border-[#1f1b18] p-0.5">
                          <span>대출일자</span>
                          <span>반납예정</span>
                        </div>
                        <div className="grid grid-cols-2 p-0.5 text-red-600 font-bold">
                          <span>2026.12.19</span>
                          <span>평생 반납금지</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-[#666] pt-0.5">
                        대출자: <strong className="text-[#111]">{name}</strong> ({seasonGroup}반 {grade})
                      </div>
                    </div>
                  )}

                  {/* 아바타 조합 코드 */}
                  <div className="pt-1 border-t border-dashed border-[#ddd]">
                    <span className="text-[9px] text-[#888] font-mono">AVATAR_CODE:</span>
                    <div className="font-mono font-bold text-[10px] text-[#2563EB]">{avatarCode}</div>
                  </div>

                </div>

              </div>

              {/* 카드 하단 결재 직인 날인 */}
              <div className="pt-2 border-t border-[#1f1b18]/20 flex items-center justify-between">
                <div className="font-mono text-[9px] text-[#888]">PLANET READING SCHOOL ★</div>
                <div className="border-2 border-[#b82828] text-[#b82828] text-[10px] px-2 py-0.5 rounded font-bold rotate-[-8deg] shadow-xs">
                  플래닛독서학교장
                </div>
              </div>

            </div>

            {/* 다운로드 버튼 */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-2.5 rounded-lg bg-[#2e5238] hover:bg-[#23402c] text-white font-serif font-bold text-xs sm:text-sm shadow flex items-center justify-center space-x-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? '이미지 저장 중...' : '📸 내 학생증 이미지 저장하기 (PNG)'}</span>
            </button>

            {/* 인적사항 실시간 편집 폼 (관리자 수정용) */}
            <div className="bg-white border-2 border-[#1f1b18] rounded-xl p-4 shadow-sm space-y-3 font-serif">
              <div className="border-b border-[#1f1b18]/20 pb-1.5">
                <h4 className="font-bold text-xs sm:text-sm text-[#1f1b18]">
                  ✍️ 학생증 인적사항 3대 항목 실시간 편집
                </h4>
                <p className="text-[10px] text-[#777]">수정 시 위의 학생증 카드에 즉시 반영됩니다.</p>
              </div>

              {/* 1. 성명 */}
              <div>
                <label className="block text-[11px] font-bold text-[#1f1b18] mb-0.5">1. 성명 (이름)</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="실명 또는 닉네임"
                  className="w-full text-xs p-2 border border-[#ccc] rounded focus:border-[#b82828] focus:outline-none"
                />
              </div>

              {/* 2. 소속반 (스프링토/미들썸머/어텀/윈터블) */}
              <div>
                <label className="block text-[11px] font-bold text-[#1f1b18] mb-1">2. 소속반 (계절 모임반)</label>
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-serif">
                  {(['스프링토', '미들썸머', '어텀', '윈터블'] as const).map(grp => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSeasonGroup(grp)}
                      className={`p-1.5 rounded border transition-all ${
                        seasonGroup === grp 
                          ? 'border-[#2e5238] bg-[#2e5238] text-white font-bold shadow-xs' 
                          : 'border-[#ccc] bg-white text-[#555] hover:bg-gray-50'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 학년 (1학년:신규 / 2학년:기존 / 3학년:진행 / 4학년:준비) */}
              <div>
                <label className="block text-[11px] font-bold text-[#1f1b18] mb-1">3. 학년 (플래닛 롤)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-[11px] font-serif">
                  {(['1학년', '2학년', '3학년', '4학년'] as const).map(grd => (
                    <button
                      key={grd}
                      type="button"
                      onClick={() => setGrade(grd)}
                      className={`p-1.5 rounded border transition-all ${
                        grade === grd 
                          ? 'border-[#b82828] bg-[#b82828] text-white font-bold shadow-xs' 
                          : 'border-[#ccc] bg-white text-[#555] hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-bold">{grd}</div>
                      <div className="text-[9px] opacity-80">
                        {grd === '1학년' ? '신규' : grd === '2학년' ? '기존' : grd === '3학년' ? '진행' : '준비'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 도서 힌트 */}
              <div>
                <label className="block text-[11px] font-bold text-[#1f1b18] mb-0.5">선물할 도서 제목 / 힌트</label>
                <input 
                  type="text" 
                  value={bookHint} 
                  onChange={e => setBookHint(e.target.value)}
                  placeholder="예: 삶의 쉼표가 되어준 소설 1권"
                  className="w-full text-xs p-2 border border-[#ccc] rounded focus:border-[#b82828] focus:outline-none"
                />
              </div>

            </div>

          </section>

        </div>

      </div>
    </div>
  );
};
