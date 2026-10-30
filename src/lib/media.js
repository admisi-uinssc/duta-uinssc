// Media parsing and video support utility for PADUKA UIN SSC

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

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (match && match[1]) return match[1];
  return null;
}

export function isDirectVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase().split('?')[0].split('#')[0];
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(clean);
}

/**
 * Universal media URL parser that supports both photos and videos (YouTube, Google Drive, Direct MP4, etc.)
 */
export function parseMediaUrl(url, explicitType = null) {
  if (!url || typeof url !== 'string') {
    return {
      rawUrl: '',
      isVideo: false,
      isImage: false,
      type: 'image',
      source: 'none',
      videoId: null,
      thumbnailUrl: '',
      embedUrl: null,
      directVideoUrl: null
    };
  }

  const trimmed = url.trim();
  const ytId = extractYouTubeId(trimmed);
  const driveId = extractDriveId(trimmed);
  const isDirectVideo = isDirectVideoUrl(trimmed);

  const isExplicitVideo = explicitType === 'video' || (typeof explicitType === 'string' && explicitType.toLowerCase() === 'video');
  const isExplicitImage = explicitType === 'image' || (typeof explicitType === 'string' && explicitType.toLowerCase() === 'image');

  // 1. YouTube Video
  if (ytId && !isExplicitImage) {
    return {
      rawUrl: trimmed,
      isVideo: true,
      isImage: false,
      type: 'video',
      source: 'youtube',
      videoId: ytId,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`,
      autoplayEmbedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&playsinline=1`,
      directVideoUrl: null
    };
  }

  // 2. Direct Video File (.mp4, .webm, etc.)
  if (isDirectVideo && !isExplicitImage) {
    return {
      rawUrl: trimmed,
      isVideo: true,
      isImage: false,
      type: 'video',
      source: 'direct',
      videoId: null,
      thumbnailUrl: '',
      embedUrl: null,
      autoplayEmbedUrl: null,
      directVideoUrl: trimmed
    };
  }

  // 3. Google Drive (can be photo or video)
  if (driveId) {
    const isDriveVideo = isExplicitVideo || trimmed.toLowerCase().includes('video');
    return {
      rawUrl: trimmed,
      isVideo: isDriveVideo,
      isImage: !isDriveVideo,
      type: isDriveVideo ? 'video' : 'image',
      source: 'drive',
      videoId: driveId,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`,
      embedUrl: isDriveVideo ? `https://drive.google.com/file/d/${driveId}/preview` : null,
      autoplayEmbedUrl: isDriveVideo ? `https://drive.google.com/file/d/${driveId}/preview` : null,
      directVideoUrl: null
    };
  }

  // 4. Custom video URL explicitly declared
  if (isExplicitVideo) {
    return {
      rawUrl: trimmed,
      isVideo: true,
      isImage: false,
      type: 'video',
      source: 'custom',
      videoId: null,
      thumbnailUrl: '',
      embedUrl: trimmed,
      directVideoUrl: trimmed
    };
  }

  // 5. Standard Image
  return {
    rawUrl: trimmed,
    isVideo: false,
    isImage: true,
    type: 'image',
    source: 'image',
    videoId: null,
    thumbnailUrl: trimmed,
    embedUrl: null,
    directVideoUrl: null
  };
}
