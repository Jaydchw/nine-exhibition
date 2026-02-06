import { forwardRef } from "react";
import type { ElementType, ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

type ButtonVariant = "outline" | "solid";
type ButtonSize = "xs" | "sm" | "md";
type ButtonAlign = "center" | "between";

const baseClasses =
  "inline-flex items-center justify-center gap-2 border-2 border-black font-semibold uppercase tracking-[0.2em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ef] cursor-pointer";

const variantClasses: Record<ButtonVariant, string> = {
  outline: "bg-transparent text-black hover:bg-black hover:text-white",
  solid: "bg-black text-white hover:bg-white hover:text-black",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-3 py-2 text-xs",
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-3 text-xs",
};

const alignClasses: Record<ButtonAlign, string> = {
  center: "justify-center",
  between: "justify-between w-full",
};

export type ActionButtonProps<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
  size?: ButtonSize;
  align?: ButtonAlign;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

const ActionButton = forwardRef(
  <T extends ElementType = "button">(
    {
      as,
      variant = "outline",
      size = "xs",
      align = "center",
      className,
      ...props
    }: ActionButtonProps<T>,
    ref: React.Ref<Element>,
  ) => {
    const Component = (as || "button") as ElementType;
    return (
      <Component
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          alignClasses[align],
          className,
        )}
        {...props}
      />
    );
  },
);

ActionButton.displayName = "ActionButton";

export default ActionButton;
