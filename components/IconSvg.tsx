'use client';

import { useMemo } from 'react';
import { sanitizeIconMarkup } from '@/lib/sanitizeIcon';

export default function IconSvg({
  icon,
  color = 'currentColor',
  strokeWidth = 5,
  className = '',
}: {
  icon: string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const safeMarkup = useMemo(() => sanitizeIconMarkup(icon), [icon]);

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeMarkup }}
    />
  );
}
