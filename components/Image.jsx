import React from 'react';

// Extract Google Drive File ID from any share link or embed code format
export function extractDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();

  // If user pasted an iframe embed code like <iframe src=".../preview"...>
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/);
  if (iframeMatch && iframeMatch[1]) {
    trimmed = iframeMatch[1].trim();
  }

  // Remove surrounding quotes or angles if any
  trimmed = trimmed.replace(/^["'<]+|["'>]+$/g, '');

  // Match /d/ID or /file/d/ID
  const dMatch = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1] && dMatch[1] !== 'd') return dMatch[1];

  // Match id=ID or docid=ID
  const idMatch = trimmed.match(/[?&](?:id|docid)=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // Match lh3.googleusercontent.com/d/ID or /u/0/d/ID
  const lh3Match = trimmed.match(/lh3\.googleusercontent\.com\/(?:[a-zA-Z0-9_-]+\/)*(?:d\/)?([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1] && lh3Match[1] !== 'd') return lh3Match[1];

  // Raw Drive ID directly
  if (/^[a-zA-Z0-9_-]{25,55}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

// Generate an ordered list of reliable Google Drive CDN endpoints for maximum resilience
export function getDriveCandidates(fileId) {
  if (!fileId) return [];
  return [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    `https://lh3.googleusercontent.com/d/${fileId}=w1600`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=view`,
  ];
}

// Convert any URL to directly loadable image src
export function formatImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Discard any residual Unsplash mock images so dummy photos never flash on screen
  if (trimmed.includes('unsplash.com')) {
    return '/assets/logo-circle.png';
  }

  // Local asset or data URI
  if (trimmed.startsWith('/') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Google Drive URL
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('lh3.googleusercontent.com') ||
    trimmed.includes('drive.usercontent.google.com')
  ) {
    const fileId = extractDriveId(trimmed);
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
    }
  }

  // Any other direct image URL
  return trimmed;
}

export default function Image({
  src,
  alt = '',
  width,
  height,
  style,
  className,
  fill,
  onError,
  fallbackSrc,
  ...rest
}) {
  const [imgSrc, setImgSrc] = React.useState(() => formatImageUrl(src));
  const [candidateIndex, setCandidateIndex] = React.useState(0);

  React.useEffect(() => {
    setImgSrc(formatImageUrl(src));
    setCandidateIndex(0);
  }, [src]);

  const handleImgError = (e) => {
    const driveId = extractDriveId(src);
    if (driveId) {
      const candidates = getDriveCandidates(driveId);
      const nextIndex = candidateIndex + 1;
      if (nextIndex < candidates.length) {
        setCandidateIndex(nextIndex);
        setImgSrc(candidates[nextIndex]);
        return;
      }
    }

    // If all candidates failed or not drive, try user-provided fallbackSrc
    if (fallbackSrc && imgSrc !== fallbackSrc && !fallbackSrc.includes('unsplash.com')) {
      setImgSrc(fallbackSrc);
      return;
    }

    if (imgSrc !== '/assets/logo-circle.png') {
      setImgSrc('/assets/logo-circle.png');
      return;
    }

    if (onError) onError(e);
  };

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
      src={imgSrc}
      alt={alt}
      style={combinedStyle}
      className={className}
      onError={handleImgError}
      loading="lazy"
      referrerPolicy="no-referrer"
      {...rest}
    />
  );
}
