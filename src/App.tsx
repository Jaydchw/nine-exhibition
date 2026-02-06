import { useEffect, useState, useRef, type ComponentProps } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  type MotionValue,
} from "framer-motion";
import { cn } from "./lib/utils";
import { ArrowClockwise, CaretDown } from "@phosphor-icons/react";

const useResponsiveValues = () => {
  const [values, setValues] = useState({
    spacing: 320,
    ballSize: 280,
    isMobile: false,
  });

  useEffect(() => {
    const updateValues = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;

      if (isMobile) {
        setValues({
          spacing: Math.min(width * 0.22, 120),
          ballSize: Math.min(width * 0.28, 120),
          isMobile: true,
        });
      } else if (isTablet) {
        setValues({
          spacing: 250,
          ballSize: 200,
          isMobile: false,
        });
      } else {
        setValues({
          spacing: 320,
          ballSize: 280,
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
  x: number;
  y: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  ballSize: number;
}

function Ball({ x, y, mouseX, mouseY, ballSize }: BallProps) {
  const [randomDelay] = useState(() => Math.random() * 2);
  const [randomOffset] = useState(() => ({
    x: (Math.random() - 0.5) * 0.3,
    y: (Math.random() - 0.5) * 0.3,
  }));

  const moveX = useTransform(mouseX, (mX: number) => {
    if (typeof window === "undefined") return 0;
    const screenX = window.innerWidth / 2 + x;
    const diff = mX - screenX;
    const dist = Math.sqrt(diff * diff);
    const influence = Math.max(0, 1 - dist / 600);
    return diff * influence * 0.25;
  });

  const moveY = useTransform(mouseY, (mY: number) => {
    if (typeof window === "undefined") return 0;
    const screenY = window.innerHeight / 2 + y;
    const diff = mY - screenY;
    const dist = Math.sqrt(diff * diff);
    const influence = Math.max(0, 1 - dist / 600);
    return diff * influence * 0.25;
  });

  const springConfig = { damping: 20, stiffness: 100 };
  const springX = useSpring(moveX, springConfig);
  const springY = useSpring(moveY, springConfig);

  const isDiagonal =
    (x < 0 && y < 0) || (x > 0 && y > 0) || (x === 0 && y === 0);
  const diagonalVector = isDiagonal ? 1 : -1;

  const isOrthogonal = (x === 0 && y !== 0) || (x !== 0 && y === 0);

  const xMovement = isOrthogonal
    ? 5 * diagonalVector * (1 + randomOffset.x)
    : 12 * diagonalVector * (1 + randomOffset.x);
  const yMovement = isOrthogonal
    ? 8 * diagonalVector * (1 + randomOffset.y)
    : 32 * diagonalVector * (1 + randomOffset.y);

  return (
    <motion.div
      className="absolute rounded-full bg-black"
      style={{
        x: springX,
        y: springY,
        width: ballSize,
        height: ballSize,
        left: `calc(50% + ${x}px - ${ballSize / 2}px)`,
        top: `calc(50% + ${y}px - ${ballSize / 2}px)`,
      }}
      animate={{
        x: [0, xMovement, 0],
        y: [0, yMovement, 0],
      }}
      transition={{
        // eslint-disable-next-line react-hooks/purity
        duration: 5 + Math.random() * 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: randomDelay,
      }}
    />
  );
}

export default function App() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const { spacing, ballSize } = useResponsiveValues();
  const [hasScrolled, setHasScrolled] = useState(false);

  const GRID_POSITIONS = [
    { id: 1, x: -spacing, y: -spacing },
    { id: 2, x: 0, y: -spacing },
    { id: 3, x: spacing, y: -spacing },
    { id: 4, x: -spacing, y: 0 },
    { id: 5, x: 0, y: 0 },
    { id: 6, x: spacing, y: 0 },
    { id: 7, x: -spacing, y: spacing },
    { id: 8, x: 0, y: spacing },
    { id: 9, x: spacing, y: spacing },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX.set(e.touches[0].clientX);
        mouseY.set(e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mouseX, mouseY]);

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

  return (
    <div ref={containerRef} className="relative w-full bg-white">
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
              <filter id="soft-goop">
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="48"
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 36 -13"
                  result="goo"
                />

                <feMorphology
                  operator="erode"
                  radius="38"
                  in="goo"
                  result="eroded"
                />

                <feGaussianBlur
                  in="eroded"
                  stdDeviation="18"
                  result="innerBlur1"
                />
                <feColorMatrix
                  in="innerBlur1"
                  mode="matrix"
                  values="0 0 0 0 0.5   0 0 0 0 0.5   0 0 0 0 0.5  0 0 0 0.4 0"
                  result="innerGrey1"
                />

                <feGaussianBlur
                  in="eroded"
                  stdDeviation="12"
                  result="innerBlur2"
                />
                <feColorMatrix
                  in="innerBlur2"
                  mode="matrix"
                  values="0 0 0 0 0.5   0 0 0 0 0.5   0 0 0 0 0.5  0 0 0 0.6 0"
                  result="innerGrey2"
                />

                <feGaussianBlur
                  in="eroded"
                  stdDeviation="6"
                  result="innerBlur3"
                />
                <feColorMatrix
                  in="innerBlur3"
                  mode="matrix"
                  values="0 0 0 0 0.5   0 0 0 0 0.5   0 0 0 0 0.5  0 0 0 0.8 0"
                  result="innerGrey3"
                />

                <feFlood floodColor="#000000" result="flood" />
                <feComposite in="flood" in2="goo" operator="in" result="body" />

                <feComposite
                  in="innerGrey1"
                  in2="body"
                  operator="atop"
                  result="layer1"
                />
                <feComposite
                  in="innerGrey2"
                  in2="layer1"
                  operator="atop"
                  result="layer2"
                />
                <feComposite
                  in="innerGrey3"
                  in2="layer2"
                  operator="atop"
                  result="final"
                />

                <feComposite in="final" in2="goo" operator="atop" />
              </filter>
            </defs>
          </svg>

          <div
            className="absolute inset-0 w-full h-full z-10"
            style={{ filter: "url(#soft-goop)" }}
          >
            {GRID_POSITIONS.map((pos) => (
              <Ball
                key={pos.id}
                x={pos.x}
                y={pos.y}
                mouseX={mouseX}
                mouseY={mouseY}
                ballSize={ballSize}
              />
            ))}
          </div>
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-difference">
          <h1
            className="text-[12vw] md:text-[10vw] lg:text-[12vw] font-bold tracking-tighter leading-none select-none text-white"
            style={{ fontFamily: '"Saira Stencil One", sans-serif' }}
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
          <p className="text-base md:text-lg text-neutral-600 mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="text-base md:text-lg text-neutral-600 mb-6">
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat.
          </p>
          <p className="text-base md:text-lg text-neutral-600">
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
