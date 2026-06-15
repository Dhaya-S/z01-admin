'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getImageUrl } from '@/lib/api';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageViewer({ images, initialIndex = 0, onClose }: ImageViewerProps) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(images.length - 1, c + 1)), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  if (!images.length) return null;

  return (
    <div
      className="lightbox-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <button className="lightbox-close" onClick={onClose}>
        <X size={20} />
      </button>

      {current > 0 && (
        <button className="lightbox-nav lightbox-nav-prev" onClick={prev}>
          <ChevronLeft size={24} />
        </button>
      )}

      <img
        src={getImageUrl(images[current])}
        alt={`Image ${current + 1}`}
        className="lightbox-img"
        onError={e => {
          (e.target as HTMLImageElement).src = '/placeholder.png';
        }}
      />

      {current < images.length - 1 && (
        <button className="lightbox-nav lightbox-nav-next" onClick={next}>
          <ChevronRight size={24} />
        </button>
      )}

      {images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
          }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === current ? 'white' : 'rgba(255,255,255,0.3)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'background 0.15s',
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 44,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        {current + 1} / {images.length}
      </div>
    </div>
  );
}
