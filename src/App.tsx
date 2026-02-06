import { useEffect, useState, useRef, useMemo } from "react";
import {
  motion,
  useSpring,
  useScroll,
  useTransform,
  animate,
  MotionValue,
  type AnimationPlaybackControls,
} from "framer-motion";
import { CaretDown } from "@phosphor-icons/react";

const IDLE_AMPLITUDE = 60;
const MOUSE_REPEL_STRENGTH = 1.6;
const SEGMENT_VARIANCE_BASE = 0.97;
const SEGMENT_VARIANCE_RANGE = 0.06;
const BRIDGE_TAPER_BASE = 0.1;
const BRIDGE_TAPER_EXP = 0.7;

const BALL_SIZE_DESKTOP = 150;
const SPACING_DESKTOP = 340;
const DESKTOP_SEGMENT_COUNT = 24;
const BRIDGE_CENTER_BOOST_DESKTOP = 0.08;
const BRIDGE_END_SCALE_DESKTOP = 0.4;
const DESKTOP_GOO_BLUR = 48;
const DESKTOP_GOO_MATRIX = "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 55 -12";
const DESKTOP_GLOW_DILATE = 10;
const DESKTOP_GLOW_BLUR = 42;

const BALL_SIZE_MOBILE = 70;
const SPACING_MOBILE = 150;
const MOBILE_SPACING_FACTOR = 0.5;
const MOBILE_BALL_SIZE_FACTOR = 0.18;
const MOBILE_IDLE_AMPLITUDE = 20;
const MOBILE_SEGMENT_COUNT = 24;
const BRIDGE_CENTER_BOOST_MOBILE = 0.14;
const BRIDGE_END_SCALE_MOBILE = 0.32;
const MOBILE_INTRO_DURATION = 3.2;
const MOBILE_INTRO_SPRING_SCALE = 0.35;
const MOBILE_SIM_BOOST_START = 1.4;
const MOBILE_SIM_BOOST_DECAY = 0.2;
const MOBILE_SIM_BOOST_DURATION = 2.5;
const MOBILE_SIM_SWAY_MULTIPLIER = 0.35;
const MOBILE_SIM_FREQ_X = 0.0012;
const MOBILE_SIM_FREQ_Y = 0.0011;
const MOBILE_SIM_SPRING = 0.01;
const MOBILE_SIM_DAMPING = 0.92;
const MOBILE_GOO_BLUR = 20;
const MOBILE_GOO_MATRIX = "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -6";
const MOBILE_GLOW_DILATE = 5;
const MOBILE_GLOW_BLUR = 32;

const pseudoRandom = (index: number, seed: number) => {
  const value = Math.sin(index * 12.9898 + seed) * 43758.5453;
  return value - Math.floor(value);
};

const useResponsiveValues = () => {
  const [values, setValues] = useState({
    spacing: SPACING_DESKTOP,
    ballSize: BALL_SIZE_DESKTOP,
    isMobile: false,
  });

  useEffect(() => {
    const updateValues = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;

      if (isMobile) {
        setValues({
          spacing: Math.min(width * MOBILE_SPACING_FACTOR, SPACING_MOBILE),
          ballSize: Math.min(width * MOBILE_BALL_SIZE_FACTOR, BALL_SIZE_MOBILE),
          isMobile: true,
        });
      } else {
        setValues({
          spacing: SPACING_DESKTOP,
          ballSize: BALL_SIZE_DESKTOP,
          isMobile: false,
        });
      }
    };

    updateValues();
    window.addEventListener("resize", updateValues);
    return () => window.removeEventListener("resize", updateValues);
  }, []);

  return values;
};

interface BallProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  ballSize: number;
  enableDistort?: boolean;
  onPointerDown?: (event: React.PointerEvent) => void;
  onPointerMove?: (event: React.PointerEvent) => void;
  onPointerUp?: (event: React.PointerEvent) => void;
  onPointerCancel?: (event: React.PointerEvent) => void;
}

function Ball({
  x,
  y,
  ballSize,
  enableDistort = true,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: BallProps) {
  const scaleX = useSpring(1, { stiffness: 400, damping: 15 });
  const scaleY = useSpring(1, { stiffness: 400, damping: 15 });

  const handlePointerMove = (e: React.PointerEvent) => {
    if (enableDistort) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const distortX = 1 + (clickX - centerX) / 100;
      const distortY = 1 + (clickY - centerY) / 100;
      scaleX.set(distortX);
      scaleY.set(distortY);
    }
    onPointerMove?.(e);
  };

  const handlePointerLeave = () => {
    if (enableDistort) {
      scaleX.set(1);
      scaleY.set(1);
    }
  };

  return (
    <motion.div
      className="absolute rounded-full"
      onPointerDown={onPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={handlePointerLeave}
      style={{
        width: ballSize,
        height: ballSize,
        scaleX,
        scaleY,
        x,
        y,
        left: "50%",
        top: "50%",
        marginLeft: -ballSize / 2,
        marginTop: -ballSize / 2,
        backgroundColor: "#000000",
      }}
    />
  );
}

function BallSpecular({ x, y, ballSize }: BallProps) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: ballSize * 0.7,
        height: ballSize * 0.7,
        x,
        y,
        left: "50%",
        top: "50%",
        marginLeft: -(ballSize * 0.7) / 2,
        marginTop: -(ballSize * 0.7) / 2,
        background:
          "radial-gradient(circle at 50% 50%, rgba(200,200,200,0.4) 0%, rgba(130,130,130,0.25) 22%, rgba(90,90,90,0.18) 48%, transparent 75%)",
      }}
    />
  );
}

interface BridgeProps {
  ax: MotionValue<number>;
  ay: MotionValue<number>;
  bx: MotionValue<number>;
  by: MotionValue<number>;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  ballSize: number;
  segmentTs: number[];
  segmentVariance: number[];
  isMobile: boolean;
}

interface BridgeSegmentProps {
  ax: MotionValue<number>;
  ay: MotionValue<number>;
  bx: MotionValue<number>;
  by: MotionValue<number>;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  t: number;
  sizeVariance: number;
  ballSize: number;
  opacity: MotionValue<number>;
  isMobile: boolean;
}

function BridgeSegment({
  ax,
  ay,
  bx,
  by,
  mouseX,
  mouseY,
  t,
  sizeVariance,
  ballSize,
  opacity,
  isMobile,
}: BridgeSegmentProps) {
  const segX = useTransform([ax, bx], ([a, b]: number[]) => a + (b - a) * t);
  const segY = useTransform([ay, by], ([a, b]: number[]) => a + (b - a) * t);

  const tFromCenter = Math.abs(2 * t - 1);
  const centerBoost =
    (isMobile ? BRIDGE_CENTER_BOOST_MOBILE : BRIDGE_CENTER_BOOST_DESKTOP) *
    (1 - tFromCenter);
  const endScale = isMobile
    ? BRIDGE_END_SCALE_MOBILE
    : BRIDGE_END_SCALE_DESKTOP;
  const taper =
    BRIDGE_TAPER_BASE +
    endScale * Math.pow(tFromCenter, BRIDGE_TAPER_EXP) +
    centerBoost;
  const size = ballSize * taper * sizeVariance;

  const bridgeDx = useTransform([ax, bx], ([a, b]: number[]) => b - a);
  const bridgeDy = useTransform([ay, by], ([a, b]: number[]) => b - a);
  const bridgeLen = useTransform([bridgeDx, bridgeDy], ([dx, dy]: number[]) =>
    Math.max(1, Math.sqrt(dx * dx + dy * dy)),
  );
  const normalX = useTransform(
    [bridgeDy, bridgeLen],
    ([dy, len]: number[]) => -dy / len,
  );
  const normalY = useTransform(
    [bridgeDx, bridgeLen],
    ([dx, len]: number[]) => dx / len,
  );
  const mouseForce = useTransform(
    [segX, segY, mouseX, mouseY],
    ([sx, sy, mx, my]: number[]) => {
      const dx = mx - sx;
      const dy = my - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return Math.max(0, 1 - dist / 500);
    },
  );
  const offsetMag = useTransform(
    mouseForce,
    (f: number) => f * (isMobile ? 0 : 18),
  );
  const offsetX = useTransform(
    [normalX, offsetMag],
    ([nx, mag]: number[]) => nx * mag,
  );
  const offsetY = useTransform(
    [normalY, offsetMag],
    ([ny, mag]: number[]) => ny * mag,
  );
  const finalX = useTransform([segX, offsetX], ([sx, ox]: number[]) => sx + ox);
  const finalY = useTransform([segY, offsetY], ([sy, oy]: number[]) => sy + oy);

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        x: finalX,
        y: finalY,
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
        opacity,
        backgroundColor: "#000000",
      }}
    />
  );
}

function DiagonalBridge({
  ax,
  ay,
  bx,
  by,
  mouseX,
  mouseY,
  ballSize,
  segmentTs,
  segmentVariance,
  isMobile,
}: BridgeProps) {
  const distance = useTransform(
    [ax, ay, bx, by],
    ([axv, ayv, bxv, byv]: number[]) => {
      const ddx = bxv - axv;
      const ddy = byv - ayv;
      return Math.sqrt(ddx * ddx + ddy * ddy);
    },
  );

  const opacity = useTransform(distance, [300, 900], [1, 0]);

  return (
    <>
      {segmentTs.map((t, i) => (
        <BridgeSegment
          key={i}
          ax={ax}
          ay={ay}
          bx={bx}
          by={by}
          mouseX={mouseX}
          mouseY={mouseY}
          t={t}
          sizeVariance={segmentVariance[i]}
          ballSize={ballSize}
          opacity={opacity}
          isMobile={isMobile}
        />
      ))}
    </>
  );
}

interface GridItem {
  id: number;
  ix: number;
  iy: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  baseX: number;
  baseY: number;
}

const GRID_COORDS = [
  { id: 1, ix: -1, iy: -1 },
  { id: 2, ix: 0, iy: -1 },
  { id: 3, ix: 1, iy: -1 },
  { id: 4, ix: -1, iy: 0 },
  { id: 5, ix: 0, iy: 0 },
  { id: 6, ix: 1, iy: 0 },
  { id: 7, ix: -1, iy: 1 },
  { id: 8, ix: 0, iy: 1 },
  { id: 9, ix: 1, iy: 1 },
];

function useGridItems(spacing: number) {
  const items = useMemo<GridItem[]>(() => {
    return GRID_COORDS.map((pos) => ({
      ...pos,
      x: new MotionValue(pos.ix * spacing),
      y: new MotionValue(pos.iy * spacing),
      baseX: pos.ix * spacing,
      baseY: pos.iy * spacing,
    }));
  }, [spacing]);

  return items;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const { spacing, ballSize, isMobile } = useResponsiveValues();
  const [hasScrolled, setHasScrolled] = useState(false);
  const mouseX = useSpring(0, { stiffness: 120, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 120, damping: 20 });
  const dragState = useRef<{
    id: number | null;
    offsetX: number;
    offsetY: number;
    pointerId: number | null;
  }>({ id: null, offsetX: 0, offsetY: 0, pointerId: null });
  const wasMobileRef = useRef(false);
  const mobileIntroStartRef = useRef<number | null>(null);
  const idleRestartRef = useRef(new Map<number, () => void>());
  const idleControlsRef = useRef(
    new Map<
      number,
      { x?: AnimationPlaybackControls; y?: AnimationPlaybackControls }
    >(),
  );

  const segmentCount = isMobile ? MOBILE_SEGMENT_COUNT : DESKTOP_SEGMENT_COUNT;
  const segmentTs = useMemo(() => {
    const step = 1 / (segmentCount + 1);
    return Array.from({ length: segmentCount }, (_, i) =>
      Number((step * (i + 1)).toFixed(4)),
    );
  }, [segmentCount]);
  const segmentVariance = useMemo(
    () =>
      segmentTs.map(
        (_, index) =>
          SEGMENT_VARIANCE_BASE +
          pseudoRandom(index, 0.13) * SEGMENT_VARIANCE_RANGE,
      ),
    [segmentTs],
  );

  const gridItems = useGridItems(spacing);
  const itemById = useMemo(
    () => new Map(gridItems.map((item) => [item.id, item])),
    [gridItems],
  );
  const mobilePhases = useMemo(
    () =>
      gridItems.map((_, index) => ({
        x: pseudoRandom(index, 1.23) * Math.PI * 2,
        y: pseudoRandom(index, 4.56) * Math.PI * 2,
      })),
    [gridItems],
  );
  const idleAmplitude = isMobile ? MOBILE_IDLE_AMPLITUDE : IDLE_AMPLITUDE;

  useEffect(() => {
    if (isMobile && !wasMobileRef.current) {
      gridItems.forEach((item) => {
        item.x.set(item.ix * SPACING_DESKTOP);
        item.y.set(item.iy * SPACING_DESKTOP);
      });
      mobileIntroStartRef.current = performance.now();
    }

    if (!isMobile && wasMobileRef.current) {
      mobileIntroStartRef.current = null;
    }

    wasMobileRef.current = isMobile;
  }, [isMobile, gridItems]);

  useEffect(() => {
    const controls: AnimationPlaybackControls[] = [];
    let rafId: number | null = null;
    const startTime = performance.now();

    if (isMobile) {
      const velocities = gridItems.map(() => ({ x: 0, y: 0 }));
      const tick = (time: number) => {
        const elapsed = (time - startTime) / 1000;
        const boost =
          elapsed < MOBILE_SIM_BOOST_DURATION
            ? MOBILE_SIM_BOOST_START - elapsed * MOBILE_SIM_BOOST_DECAY
            : 1;
        const introStart = mobileIntroStartRef.current;
        const introProgress = introStart
          ? Math.min(
              1,
              Math.max(0, (time - introStart) / (MOBILE_INTRO_DURATION * 1000)),
            )
          : 1;
        const introEase = 1 - Math.pow(1 - introProgress, 3);
        const introScale =
          MOBILE_INTRO_SPRING_SCALE +
          (1 - MOBILE_INTRO_SPRING_SCALE) * introEase;
        const sway = idleAmplitude * MOBILE_SIM_SWAY_MULTIPLIER;

        gridItems.forEach((item, index) => {
          if (dragState.current.id === item.id) {
            velocities[index].x = 0;
            velocities[index].y = 0;
            return;
          }
          const phase = mobilePhases[index];
          const targetX =
            item.baseX + Math.sin(time * MOBILE_SIM_FREQ_X + phase.x) * sway;
          const targetY =
            item.baseY + Math.cos(time * MOBILE_SIM_FREQ_Y + phase.y) * sway;
          const vx = velocities[index].x;
          const vy = velocities[index].y;
          const dx = targetX - item.x.get();
          const dy = targetY - item.y.get();
          const spring = MOBILE_SIM_SPRING * boost * introScale;
          velocities[index].x = (vx + dx * spring) * MOBILE_SIM_DAMPING;
          velocities[index].y = (vy + dy * spring) * MOBILE_SIM_DAMPING;
          item.x.set(item.x.get() + velocities[index].x);
          item.y.set(item.y.get() + velocities[index].y);
        });

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    } else {
      gridItems.forEach((item) => {
        const animateIdle = () => {
          if (dragState.current.id === item.id) return;
          const randomX = item.baseX + (Math.random() - 0.5) * idleAmplitude;
          const randomY = item.baseY + (Math.random() - 0.5) * idleAmplitude;

          const duration = 2 + Math.random() * 3;

          const cx = animate(item.x, randomX, { duration, ease: "easeInOut" });
          const cy = animate(item.y, randomY, { duration, ease: "easeInOut" });

          idleControlsRef.current.set(item.id, { x: cx, y: cy });

          controls.push(cx);
          controls.push(cy);

          cx.then(() => {
            if (controls.includes(cx)) animateIdle();
          });
        };

        idleRestartRef.current.set(item.id, animateIdle);
        animateIdle();
      });
    }

    const handleMove = (e: MouseEvent) => {
      const mx = e.clientX - window.innerWidth / 2;
      const my = e.clientY - window.innerHeight / 2;

      mouseX.set(mx);
      mouseY.set(my);

      gridItems.forEach((item) => {
        if (dragState.current.id === item.id) return;
        const dx = mx - item.x.get();
        const dy = my - item.y.get();
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 500) {
          const force = (500 - dist) * MOUSE_REPEL_STRENGTH;
          item.x.set(item.x.get() - (dx / dist) * force * 0.05);
          item.y.set(item.y.get() - (dy / dist) * force * 0.05);
        }
      });
    };

    window.addEventListener("mousemove", handleMove);

    return () => {
      controls.forEach((c) => c.stop());
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMove);
      idleControlsRef.current.clear();
      idleRestartRef.current.clear();
    };
  }, [gridItems, mouseX, mouseY, isMobile, idleAmplitude, mobilePhases]);

  const bridges = useMemo(() => {
    const pairs: { id: string; p1: GridItem; p2: GridItem }[] = [];
    for (let i = 0; i < gridItems.length; i++) {
      for (let j = i + 1; j < gridItems.length; j++) {
        const p1 = gridItems[i];
        const p2 = gridItems[j];

        const dx = p2.ix - p1.ix;
        const dy = p2.iy - p1.iy;

        if (dx === 1 && dy === 1) {
          pairs.push({
            id: `bridge-${p1.id}-${p2.id}`,
            p1,
            p2,
          });
        }
      }
    }
    return pairs;
  }, [gridItems]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50 && !hasScrolled) {
        setHasScrolled(true);
        contentRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasScrolled]);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);
  const gooBlur = isMobile ? MOBILE_GOO_BLUR : DESKTOP_GOO_BLUR;
  const gooMatrix = isMobile ? MOBILE_GOO_MATRIX : DESKTOP_GOO_MATRIX;
  const glowDilate = isMobile ? MOBILE_GLOW_DILATE : DESKTOP_GLOW_DILATE;
  const glowBlur = isMobile ? MOBILE_GLOW_BLUR : DESKTOP_GLOW_BLUR;

  return (
    <div ref={containerRef} className="relative w-full bg-white">
      <style>{`
        @font-face {
          font-family: 'Gunplay';
          src: url('/gunplay rg.otf') format('opentype');
        }
      `}</style>

      <div className="grain-overlay" />

      <div className="relative w-full h-screen bg-white isolate overflow-hidden">
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 mix-blend-difference"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-white text-sm font-medium tracking-wide">
              SCROLL DOWN
            </span>
            <CaretDown className="text-white" size={24} weight="bold" />
          </motion.div>

          <svg className="hidden">
            <defs>
              <filter
                id="smart-goo"
                x="-15%"
                y="-15%"
                width="130%"
                height="130%"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation={gooBlur}
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values={gooMatrix}
                  result="goo"
                />
                <feComposite
                  in="SourceGraphic"
                  in2="goo"
                  operator="atop"
                  result="merged"
                />
                <feColorMatrix
                  in="merged"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                  result="blackShape"
                />

                <feMorphology
                  in="blackShape"
                  operator="dilate"
                  radius={glowDilate}
                  result="expandedShape"
                />
                <feFlood
                  floodColor="#9a9a9a"
                  floodOpacity="0.45"
                  result="flood"
                />
                <feComposite
                  in="flood"
                  in2="expandedShape"
                  operator="out"
                  result="outside"
                />
                <feGaussianBlur
                  in="outside"
                  stdDeviation={glowBlur}
                  result="glowBlur"
                />
                <feComposite
                  in="glowBlur"
                  in2="expandedShape"
                  operator="in"
                  result="innerGlow"
                />
                <feComponentTransfer in="innerGlow" result="innerGlowSoft">
                  <feFuncA
                    type="gamma"
                    amplitude="1"
                    exponent="1.6"
                    offset="0"
                  />
                </feComponentTransfer>

                <feGaussianBlur
                  in="blackShape"
                  stdDeviation="16"
                  result="sheenBlur"
                />
                <feColorMatrix
                  in="sheenBlur"
                  type="matrix"
                  values="0 0 0 0 0.65  0 0 0 0 0.65  0 0 0 0 0.65  0 0 0 0.25 0"
                  result="sheen"
                />
                <feComposite
                  in="sheen"
                  in2="blackShape"
                  operator="in"
                  result="sheenMask"
                />

                <feMerge>
                  <feMergeNode in="blackShape" />
                  <feMergeNode in="innerGlowSoft" />
                  <feMergeNode in="sheenMask" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          <div
            className="absolute inset-0 w-full h-full z-10"
            style={{ filter: "url(#smart-goo)", willChange: "transform" }}
          >
            {gridItems.map((item) => (
              <Ball
                key={item.id}
                x={item.x}
                y={item.y}
                ballSize={ballSize}
                enableDistort={!isMobile}
                onPointerDown={(event) => {
                  const target = event.currentTarget as HTMLElement;
                  const mx = event.clientX - window.innerWidth / 2;
                  const my = event.clientY - window.innerHeight / 2;
                  dragState.current = {
                    id: item.id,
                    offsetX: mx - item.x.get(),
                    offsetY: my - item.y.get(),
                    pointerId: event.pointerId,
                  };
                  if (!isMobile) {
                    const idle = idleControlsRef.current.get(item.id);
                    idle?.x?.stop();
                    idle?.y?.stop();
                  }
                  target.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (dragState.current.id !== item.id) return;
                  const mx = event.clientX - window.innerWidth / 2;
                  const my = event.clientY - window.innerHeight / 2;
                  const current = itemById.get(item.id);
                  if (!current) return;
                  current.x.set(mx - dragState.current.offsetX);
                  current.y.set(my - dragState.current.offsetY);
                }}
                onPointerUp={(event) => {
                  const target = event.currentTarget as HTMLElement;
                  if (dragState.current.pointerId === event.pointerId) {
                    target.releasePointerCapture(event.pointerId);
                  }
                  dragState.current = {
                    id: null,
                    offsetX: 0,
                    offsetY: 0,
                    pointerId: null,
                  };
                  if (!isMobile) {
                    idleRestartRef.current.get(item.id)?.();
                  }
                }}
                onPointerCancel={(event) => {
                  const target = event.currentTarget as HTMLElement;
                  if (dragState.current.pointerId === event.pointerId) {
                    target.releasePointerCapture(event.pointerId);
                  }
                  dragState.current = {
                    id: null,
                    offsetX: 0,
                    offsetY: 0,
                    pointerId: null,
                  };
                  if (!isMobile) {
                    idleRestartRef.current.get(item.id)?.();
                  }
                }}
              />
            ))}

            {bridges.map((bridge) => (
              <DiagonalBridge
                key={bridge.id}
                ax={bridge.p1.x}
                ay={bridge.p1.y}
                bx={bridge.p2.x}
                by={bridge.p2.y}
                mouseX={mouseX}
                mouseY={mouseY}
                ballSize={ballSize}
                segmentTs={segmentTs}
                segmentVariance={segmentVariance}
                isMobile={isMobile}
              />
            ))}
          </div>
          <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
            {gridItems.map((item) => (
              <BallSpecular
                key={`spec-${item.id}`}
                x={item.x}
                y={item.y}
                ballSize={ballSize}
              />
            ))}
          </div>
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-difference">
          <h1
            className="text-[15vw] font-bold leading-none select-none text-white tracking-[0.5em]"
            style={{
              fontFamily: "Gunplay, sans-serif",
              filter: "blur(0.5px)",
            }}
          >
            NINE
          </h1>
        </div>
      </div>

      <motion.div
        ref={contentRef}
        style={{ opacity: contentOpacity }}
        className="relative min-h-screen bg-white z-50 px-8 py-24"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Content Section
          </h2>
          <p className="text-lg md:text-xl text-neutral-700 mb-6">
            This is placeholder content that appears when you scroll down.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
