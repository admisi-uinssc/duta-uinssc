import React from 'react';

export default function Image({
  src,
  alt = '',
  width,
  height,
  style,
  className,
  fill,
  unoptimized,
  ...rest
}) {
  const combinedStyle = fill
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style,
      }
    : {
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      };

  return (
    <img
      src={src}
      alt={alt}
      style={combinedStyle}
      className={className}
      {...rest}
    />
  );
}
