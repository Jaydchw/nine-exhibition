import { useEffect, useState, type ComponentProps } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { cn } from "./lib/utils";
import { ArrowClockwise } from "@phosphor-icons/react";

const SPACING = 380;
const BALL_SIZE = 320;

const GRID_POSITIONS = [
  { id: 1, x: -SPACING, y: -SPACING },
  { id: 2, x: 0, y: -SPACING },
  { id: 3, x: SPACING, y: -SPACING },
  { id: 4, x: -SPACING, y: 0 },
  { id: 5, x: 0, y: 0 },
  { id: 6, x: SPACING, y: 0 },
  { id: 7, x: -SPACING, y: SPACING },
  { id: 8, x: 0, y: SPACING },
  { id: 9, x: SPACING, y: SPACING },
];

// Fix 1: Properly typed Button Props
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

// Fix 2: Properly typed Ball Props
interface BallProps {
  x: number;
  y: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

function Ball({ x, y, mouseX, mouseY }: BallProps) {
  // Fix 3: Use useState with lazy initializer for pure random generation
  const [randomDelay] = useState(() => Math.random() * 2);

  const moveX = useTransform(mouseX, (mX: number) => {
    // Ensure window is defined (safe for CSR)
    if (typeof window === "undefined") return 0;
    const screenX = window.innerWidth / 2 + x;
    const diff = mX - screenX;
    const dist = Math.abs(diff);
    return dist < 400 ? diff * -0.3 : 0;
  });

  const moveY = useTransform(mouseY, (mY: number) => {
    if (typeof window === "undefined") return 0;
    const screenY = window.innerHeight / 2 + y;
    const diff = mY - screenY;
    const dist = Math.abs(diff);
    return dist < 400 ? diff * -0.3 : 0;
  });

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(moveX, springConfig);
  const springY = useSpring(moveY, springConfig);

  const isDiagonal1 =
    (x < 0 && y < 0) || (x > 0 && y > 0) || (x === 0 && y === 0);
  const diagonalVector = isDiagonal1 ? 1 : -1;

  return (
    <motion.div
      className="absolute rounded-full bg-black"
      style={{
        x: springX,
        y: springY,
        width: BALL_SIZE,
        height: BALL_SIZE,
        left: `calc(50% + ${x}px - ${BALL_SIZE / 2}px)`,
        top: `calc(50% + ${y}px - ${BALL_SIZE / 2}px)`,
      }}
      animate={{
        x: [0, 60 * diagonalVector, 0],
        y: [0, 60 * diagonalVector, 0],
      }}
      transition={{
        duration: 8,
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]); // Fix 4: Added dependencies

  return (
    <div className="relative w-full h-screen bg-white isolate overflow-hidden">
      <div className="grain-overlay" />

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

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-difference">
        <h1
          className="text-[12vw] font-bold tracking-tighter leading-none select-none text-white"
          style={{ fontFamily: '"Saira Stencil One", sans-serif' }}
        >
          NINE
        </h1>
      </div>

      <svg className="hidden">
        <defs>
          <filter id="soft-goop">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="25"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -12"
              result="goo"
            />

            <feMorphology
              operator="erode"
              radius="25"
              in="goo"
              result="eroded"
            />
            <feGaussianBlur in="eroded" stdDeviation="10" result="innerBlur" />

            <feColorMatrix
              in="innerBlur"
              mode="matrix"
              values="0 0 0 0 0.5   0 0 0 0 0.5   0 0 0 0 0.5  0 0 0 1 0"
              result="innerGrey"
            />

            <feFlood floodColor="#000000" result="flood" />
            <feComposite in="flood" in2="goo" operator="in" result="body" />
            <feComposite
              in="innerGrey"
              in2="body"
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
          />
        ))}
      </div>
    </div>
  );
}
