'use client';

import { useEffect, useRef, type ImgHTMLAttributes } from 'react';

export function RemoteImage({
  onError,
  style,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = ref.current;
    if (image?.complete && image.naturalWidth === 0) {
      image.style.opacity = '0';
    }
  }, []);

  return (
    <img
      ref={ref}
      {...props}
      style={{ color: 'transparent', ...style }}
      onError={(event) => {
        event.currentTarget.style.opacity = '0';
        onError?.(event);
      }}
    />
  );
}
