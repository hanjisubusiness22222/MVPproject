import React, { useMemo } from 'react';
import { buildCroquisSvgInner } from '../utils/croquisAvatar';

interface CroquisAvatarProps {
  avatarCode?: string;
  selectedIndices?: number[];
  hairPair?: [string, string];
  seed?: string;
  className?: string;
}

export const CroquisAvatar: React.FC<CroquisAvatarProps> = ({
  avatarCode,
  selectedIndices,
  hairPair,
  seed,
  className = 'w-full h-full'
}) => {
  const svgInner = useMemo(
    () => buildCroquisSvgInner(selectedIndices || avatarCode, hairPair, seed),
    [selectedIndices, avatarCode, hairPair, seed]
  );

  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svgInner }}
    />
  );
};
