import { useEffect, useCallback, useState } from "react";
import Image from "next/image";

export default function Lightbox({ images, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [touchStartX, setTouchStartX] = useState(null);

  const goNext = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 50) goPrev();
    if (deltaX < -50) goNext();
    setTouchStartX(null);
  };

  const current = images[index];

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button onClick={onClose} type="button" className="absolute top-6 right-6 text-white text-2xl leading-none" aria-label="Close">
        ✕
      </button>

      {images.length > 1 && (
        <button onClick={goPrev} type="button" className="absolute left-4 tablet:left-8 text-white text-3xl" aria-label="Previous image">
          ‹
        </button>
      )}

      <div className="relative w-[90vw] h-[70vh] max-w-4xl">
        <Image src={current.src} alt={current.captionEn || ""} layout="fill" objectFit="contain" sizes="90vw" />
      </div>

      {(current.captionEn || current.captionId) && (
        <p className="text-zinc-300 text-sm font-mono mt-4 max-w-xl text-center px-6">{current.captionEn || current.captionId}</p>
      )}

      {images.length > 1 && (
        <button onClick={goNext} type="button" className="absolute right-4 tablet:right-8 text-white text-3xl" aria-label="Next image">
          ›
        </button>
      )}
    </div>
  );
}
