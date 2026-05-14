"use client";

import { useState, useRef, useCallback } from "react";

export function PhotoViewer({ photos, startIndex, onClose }: { photos: string[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ startX: number; startY: number; moved: boolean; dragX: number; locked: boolean } | null>(null);
  const indexRef = useRef(startIndex);
  indexRef.current = index;

  function updateStrip(dragX: number, animate: boolean) {
    if (!stripRef.current) return;
    const offset = -indexRef.current * window.innerWidth + dragX;
    stripRef.current.style.transition = animate ? "transform 0.2s ease-out" : "none";
    stripRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
  }

  function onTouchStart(e: React.TouchEvent) {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, moved: false, dragX: 0, locked: false };
    updateStrip(0, false);
  }

  function onTouchMove(e: React.TouchEvent) {
    const t = touchRef.current;
    if (!t) return;
    const dx = e.touches[0].clientX - t.startX;
    const dy = e.touches[0].clientY - t.startY;
    if (!t.locked && !t.moved) {
      if (Math.abs(dy) > Math.abs(dx)) { touchRef.current = null; return; }
      t.locked = true;
    }
    t.moved = true;
    const idx = indexRef.current;
    const drag = (idx === 0 && dx > 0) || (idx === photos.length - 1 && dx < 0) ? dx * 0.3 : dx;
    t.dragX = drag;
    updateStrip(drag, false);
  }

  function onTouchEnd() {
    const t = touchRef.current;
    if (!t) return;
    const idx = indexRef.current;
    let newIndex = idx;
    if (t.dragX < -50 && idx < photos.length - 1) newIndex = idx + 1;
    else if (t.dragX > 50 && idx > 0) newIndex = idx - 1;
    indexRef.current = newIndex;
    setIndex(newIndex);
    updateStrip(0, true);
    touchRef.current = null;
  }

  // Блокируем скролл
  const lockRef = useRef(false);
  if (!lockRef.current) {
    lockRef.current = true;
    document.body.style.overflow = "hidden";
  }
  const handleClose = useCallback(() => {
    document.body.style.overflow = "";
    onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 animate-[fadeIn_150ms_ease-out]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={() => { if (!touchRef.current?.moved) handleClose(); }}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full text-white text-2xl flex items-center justify-center z-10"
        onClick={handleClose}
      >
        ✕
      </button>
      <div className="absolute overflow-hidden" style={{ top: 56, bottom: 32, left: 0, right: 0 }}>
        <div
          ref={stripRef}
          className="flex h-full will-change-transform"
          style={{ transform: `translate3d(${-startIndex * 100}vw, 0, 0)` }}
        >
          {photos.map((url, i) => (
            <div key={i} className="flex items-center justify-center shrink-0 px-4" style={{ width: "100vw" }}>
              <img
                src={url}
                alt=""
                className="max-w-full max-h-full object-contain rounded-2xl select-none"
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
