import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2",
      "font-medium transition-all duration-300",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50",
      "active:scale-[0.98]"
    );

    const variants = {
      default: cn(
        "bg-gradient-to-r from-rose-500 to-orange-400",
        "text-white shadow-lg shadow-primary/25",
        "hover:shadow-xl hover:shadow-primary/30",
        "hover:from-rose-600 hover:to-orange-500",
        "focus:ring-primary/50"
      ),
      outline: cn(
        "border-2 border-gold/60 text-gold",
        "bg-transparent",
        "hover:bg-gold/10 hover:border-gold",
        "focus:ring-gold/50"
      ),
      ghost: cn(
        "text-slate-300 bg-transparent",
        "hover:bg-white/10 hover:text-white",
        "focus:ring-white/20"
      ),
    };

    const sizes = {
      sm: "h-9 px-4 text-sm rounded-lg",
      md: "h-11 px-6 text-base rounded-xl",
      lg: "h-14 px-8 text-lg rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Cargando...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
