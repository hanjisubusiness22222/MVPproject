import React, { useEffect, useRef, useState } from 'react';

export const PlanetV3Rsvp: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState<number>(2300);

  useEffect(() => {
    // 1. Same-origin 직접 측정 함수
    const updateHeightFromDoc = () => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentDocument) {
          const doc = iframe.contentDocument;
          const body = doc.body;
          const html = doc.documentElement;
          const h = Math.max(
            body ? body.scrollHeight : 0,
            body ? body.offsetHeight : 0,
            html ? html.clientHeight : 0,
            html ? html.scrollHeight : 0,
            html ? html.offsetHeight : 0
          );
          if (h > 600) {
            setFrameHeight(h + 20);
          }
        }
      } catch (err) {
        // 교차 출처 fallback은 postMessage 핸들러가 처리
      }
    };

    // 2. postMessage 수신 핸들러 (planet-v3.html 내부 리사이즈 이벤트 수신)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PLANET_RESIZE' && typeof event.data.height === 'number') {
        if (event.data.height > 600) {
          setFrameHeight(event.data.height + 20);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const iframe = iframeRef.current;
    if (iframe) {
      const onLoad = () => {
        updateHeightFromDoc();
        try {
          if (iframe.contentDocument && iframe.contentDocument.body) {
            const ro = new ResizeObserver(() => updateHeightFromDoc());
            ro.observe(iframe.contentDocument.body);
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
        className="w-full border-0 block transition-[height] duration-200"
        style={{
          height: `${frameHeight}px`,
          overflow: 'hidden'
        }}
        scrolling="no"
      />
    </div>
  );
};
