import React, { useEffect, useRef, useState } from 'react';

export const PlanetV3Rsvp: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // 초기 렌더링 높이를 신청서 카드 실제 높이(~1300px)에 맞춤 (과도한 공백 제거)
  const [frameHeight, setFrameHeight] = useState<number>(1300);

  useEffect(() => {
    // 1. Same-origin 직접 측정 함수 (실제 내부 카드 요소의 높이만 정확히 측정)
    const updateHeightFromDoc = () => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentDocument) {
          const container = iframe.contentDocument.querySelector('.main-paper-container') as HTMLElement | null;
          if (container) {
            const h = Math.ceil(container.getBoundingClientRect().height);
            if (h > 200) {
              setFrameHeight(h);
            }
          }
        }
      } catch (err) {
        // 교차 출처 fallback은 postMessage 핸들러가 처리
      }
    };

    // 2. postMessage 수신 핸들러 (planet-v3.html 내부에서 실측된 카드 높이 수신)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PLANET_RESIZE' && typeof event.data.height === 'number') {
        if (event.data.height > 200) {
          setFrameHeight(event.data.height);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const iframe = iframeRef.current;
    if (iframe) {
      const onLoad = () => {
        updateHeightFromDoc();
        try {
          if (iframe.contentDocument) {
            const container = iframe.contentDocument.querySelector('.main-paper-container');
            if (container && window.ResizeObserver) {
              const ro = new ResizeObserver(() => updateHeightFromDoc());
              ro.observe(container);
            }
          }
        } catch (e) {}
      };

      iframe.addEventListener('load', onLoad);
      return () => {
        iframe.removeEventListener('load', onLoad);
        window.removeEventListener('message', handleMessage);
      };
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="w-full">
      <iframe
        ref={iframeRef}
        src="planet-v3.html"
        title="2026 플래닛독서학교 참가 신청"
        className="w-full border-0 block transition-[height] duration-150"
        style={{
          height: `${frameHeight}px`,
          overflow: 'hidden'
        }}
        scrolling="no"
      />
    </div>
  );
};
