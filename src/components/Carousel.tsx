import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState } from "react";
import ActionButton from "./ActionButton";

interface CarouselProps {
  images: string[];
  altBase: string;
}

const fallbackToJpg = (src: string) => src.replace(/\.png$/, ".jpg");

export default function Carousel({ images, altBase }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const swipeStartX = useRef<number | null>(null);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number | null>(null);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const goToPrev = () => {
    setActiveIndex((prev) =>
      images.length ? (prev === 0 ? images.length - 1 : prev - 1) : 0,
    );
    resetView();
  };

  const goToNext = () => {
    setActiveIndex((prev) =>
      images.length ? (prev === images.length - 1 ? 0 : prev + 1) : 0,
    );
    resetView();
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    swipeStartX.current = event.clientX;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (swipeStartX.current === null) return;
    const delta = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  const handleFullscreenPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "touch") {
      const now = Date.now();
      const lastTap = lastTapRef.current;
      if (lastTap && now - lastTap < 300) {
        lastTapRef.current = null;
        swipeStartX.current = null;
        pointerStart.current = null;
        panStart.current = null;
        setZoom((prev) => {
          const next = prev > 1.02 ? 1 : 2;
          if (next === 1) {
            setPan({ x: 0, y: 0 });
          }
          return next;
        });
        return;
      }
      lastTapRef.current = now;
    }
    pointerStart.current = { x: event.clientX, y: event.clientY };
    if (zoom > 1.02) {
      panStart.current = { x: pan.x, y: pan.y };
    } else {
      swipeStartX.current = event.clientX;
    }
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handleFullscreenPointerMove = (event: React.PointerEvent) => {
    if (!pointerStart.current) return;
    if (zoom <= 1.02 || !panStart.current) return;
    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };

  const handleFullscreenPointerUp = (event: React.PointerEvent) => {
    if (!pointerStart.current) return;
    pointerStart.current = null;
    panStart.current = null;
    if (zoom > 1.02) return;
    handlePointerUp(event);
  };

  const handleFullscreenWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const next = Math.min(3, Math.max(1, zoom - event.deltaY * 0.001));
    setZoom(next);
    if (next === 1) {
      setPan({ x: 0, y: 0 });
    }
  };

  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const target = event.currentTarget;
    if (target.dataset.fallback === "done") return;
    if (target.src.endsWith(".png")) {
      target.dataset.fallback = "done";
      target.src = fallbackToJpg(target.src);
      return;
    }
    target.dataset.fallback = "done";
  };

  const activeImage = images[activeIndex] ?? "";

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.2em]">
            Past Works
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-neutral-500 mt-1 sm:hidden">
            {altBase}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton type="button" onClick={goToPrev} size="sm">
            Prev
          </ActionButton>
          <ActionButton type="button" onClick={goToNext} size="sm">
            Next
          </ActionButton>
          <Dialog.Root
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (open) resetView();
            }}
          >
            <Dialog.Trigger asChild>
              <ActionButton
                type="button"
                size="sm"
                aria-label="Open fullscreen viewer"
              >
                Fullscreen
              </ActionButton>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay
                className="fixed inset-0 bg-black/70"
                onPointerDown={() => setIsOpen(false)}
              />
              <Dialog.Content className="fixed inset-0 flex items-center justify-center p-6 pointer-events-none">
                <div className="relative w-full max-w-5xl pointer-events-auto">
                  <div className="border-2 border-black bg-[#f7f4ef] px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="text-xs uppercase tracking-[0.3em] font-semibold">
                          {altBase} {activeIndex + 1}
                        </span>
                      </div>
                      <div className="flex flex-row flex-nowrap items-center gap-2">
                        <ActionButton
                          type="button"
                          onClick={goToPrev}
                          size="sm"
                        >
                          Prev
                        </ActionButton>
                        <ActionButton
                          type="button"
                          onClick={goToNext}
                          size="sm"
                        >
                          Next
                        </ActionButton>
                        <Dialog.Close asChild>
                          <ActionButton
                            type="button"
                            size="sm"
                            aria-label="Close fullscreen viewer"
                          >
                            Close
                          </ActionButton>
                        </Dialog.Close>
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-3 w-full h-[70vh] border-2 border-black overflow-hidden bg-[#f7f4ef] flex items-center justify-center"
                    onPointerDown={handleFullscreenPointerDown}
                    onPointerMove={handleFullscreenPointerMove}
                    onPointerUp={handleFullscreenPointerUp}
                    onPointerCancel={handleFullscreenPointerUp}
                    onWheel={handleFullscreenWheel}
                    style={{ touchAction: "pan-y" }}
                  >
                    {activeImage ? (
                      <img
                        key={`full-${activeImage}`}
                        src={activeImage}
                        alt={`${altBase} ${activeIndex + 1}`}
                        className="h-full w-full object-contain"
                        style={{
                          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                          transformOrigin: "center",
                        }}
                        onError={handleImageError}
                      />
                    ) : (
                      <span className="text-sm uppercase tracking-[0.3em] font-semibold text-neutral-500">
                        No artwork
                      </span>
                    )}
                  </div>
                  <div className="mt-3 w-full border-2 border-black bg-[#f7f4ef] px-4 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-black">
                      Double tap to zoom
                    </p>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
      <div
        className="mt-6 w-full max-w-140 h-70 sm:h-85 md:h-95 overflow-hidden bg-black border-2 border-black flex items-center justify-center mx-auto"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {activeImage ? (
          <img
            key={activeImage}
            src={activeImage}
            alt={`${altBase} ${activeIndex + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <span className="text-sm uppercase tracking-[0.3em] font-semibold text-neutral-500">
            No artwork
          </span>
        )}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2 w-2 border-2 border-black cursor-pointer ${
              index === activeIndex ? "bg-black" : "bg-white hover:bg-black"
            }`}
            aria-label={`View artwork ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
