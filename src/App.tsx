import {
  useEffect,
  useState,
  useRef,
  type ComponentProps,
  useMemo,
} from "react";
import {
  motion,
  useSpring,
  useScroll,
  useTransform,
  animate,
  MotionValue,
} from "framer-motion";
import { cn } from "./lib/utils";
import { ArrowClockwise, CaretDown } from "@phosphor-icons/react";

const BALL_SIZE_DESKTOP = 150;
const SPACING_DESKTOP = 340;
const BALL_SIZE_MOBILE = 70;
const SPACING_MOBILE = 180;
const IDLE_AMPLITUDE = 60;
const MOUSE_REPEL_STRENGTH = 2.5;

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
          spacing: Math.min(width * 0.45, SPACING_MOBILE),
          ballSize: Math.min(width * 0.2, BALL_SIZE_MOBILE),
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

interface ButtonProps extends ComponentProps<"button"> {
  variant?: "default" | "outline";
}

const Button = ({ className, variant = "default", ...props }: ButtonProps) => {
  const variants: Record<string, string> = {
    default: "bg-black text-white hover:bg-neutral-800",
    outline: "border border-black text-black hover:bg-black/10",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors cursor-pointer",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
};

interface BallProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  ballSize: number;
}

function Ball({ x, y, ballSize }: BallProps) {
  const scaleX = useSpring(1, { stiffness: 400, damping: 15 });
  const scaleY = useSpring(1, { stiffness: 400, damping: 15 });

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const distortX = 1 + (clickX - centerX) / 100;
    const distortY = 1 + (clickY - centerY) / 100;
    scaleX.set(distortX);
    scaleY.set(distortY);
  };

  const handlePointerLeave = () => {
    scaleX.set(1);
    scaleY.set(1);
  };

  return (
    <motion.div
      className="absolute rounded-full"
      onPointerMove={handlePointerMove}
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
}: BridgeSegmentProps) {
  const segX = useTransform([ax, bx], ([a, b]: number[]) => a + (b - a) * t);
  const segY = useTransform([ay, by], ([a, b]: number[]) => a + (b - a) * t);

  const tFromCenter = Math.abs(2 * t - 1);
  // Stringier taper: slightly thicker center so bridges connect
  const centerBoost = 0.06 * (1 - tFromCenter);
  const taper = 0.1 + 0.4 * Math.pow(tFromCenter, 0.7) + centerBoost;
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
  const offsetMag = useTransform(mouseForce, (f: number) => f * 18);
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
  }, []);

  useEffect(() => {
    items.forEach((item) => {
      item.baseX = item.ix * spacing;
      item.baseY = item.iy * spacing;
    });
  }, [spacing, items]);

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

  const segmentCount = isMobile ? 34 : 24;
  const segmentTs = useMemo(() => {
    const step = 1 / (segmentCount + 1);
    return Array.from({ length: segmentCount }, (_, i) =>
      Number((step * (i + 1)).toFixed(4)),
    );
  }, [segmentCount]);
  const segmentVariance = useMemo(
    () => segmentTs.map(() => 0.97 + Math.random() * 0.06),
    [segmentTs],
  );

  const gridItems = useGridItems(spacing);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controls: any[] = [];

    gridItems.forEach((item) => {
      const animateIdle = () => {
        const randomX = item.baseX + (Math.random() - 0.5) * IDLE_AMPLITUDE;
        const randomY = item.baseY + (Math.random() - 0.5) * IDLE_AMPLITUDE;

        const duration = 2 + Math.random() * 3;

        const cx = animate(item.x, randomX, { duration, ease: "easeInOut" });
        const cy = animate(item.y, randomY, { duration, ease: "easeInOut" });

        controls.push(cx);
        controls.push(cy);

        cx.then(() => {
          if (controls.includes(cx)) animateIdle();
        });
      };

      animateIdle();
    });

    const handleMove = (e: MouseEvent) => {
      const mx = e.clientX - window.innerWidth / 2;
      const my = e.clientY - window.innerHeight / 2;

      mouseX.set(mx);
      mouseY.set(my);

      gridItems.forEach((item) => {
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
      window.removeEventListener("mousemove", handleMove);
    };
  }, [gridItems, mouseX, mouseY]);

  const bridges = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pairs: any[] = [];
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
  const gooBlur = isMobile ? 36 : 48;
  const gooMatrix = isMobile
    ? "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 40 -8"
    : "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 55 -12";
  const glowDilate = isMobile ? 8 : 10;
  const glowBlur = isMobile ? 32 : 42;

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
          <div className="absolute top-8 left-8 z-50">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="bg-white/50 backdrop-blur"
            >
              <ArrowClockwise className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

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
                {/* Goo merge: blobs all elements into one unified shape */}
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
                {/* Flatten to solid black: the goo alpha defines the unified shape */}
                <feColorMatrix
                  in="merged"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                  result="blackShape"
                />

                {/* Inner glow: flood light outside the shape, blur inward, clip to shape */}
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

                {/* Unified specular sheen across the merged shape */}
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

                {/* Stack: unified black shape, then inner glow + sheen on top */}
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
            style={{ filter: "url(#smart-goo)" }}
          >
            {gridItems.map((item) => (
              <Ball key={item.id} x={item.x} y={item.y} ballSize={ballSize} />
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
              />
            ))}
          </div>

          {/* Specular highlights — separate unfiltered layer, only on main balls */}
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
