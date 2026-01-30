import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "small" | "medium" | "large";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "font-bold rounded-xl sm:rounded-2xl lg:rounded-3xl transition-all duration-200 flex items-center justify-center font-normal overflow-hidden";

    const variantStyles = {
      primary:
        "bg-gradient-green text-white disabled:cursor-not-allowed disabled:hover:scale-100",
      secondary:
        "bg-white text-gradient-green-end hover:bg-opacity-90 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
      tertiary:
        "bg-white bg-opacity-20 text-gradient-green-end border-2 border-gradient-green-end disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
    };

    const sizeStyles = {
      small: "px-4 py-2 text-sm",
      medium: "px-6 py-3 text-base sm:text-lg",
      large: "px-6 sm:px-8 lg:px-10 py-4 sm:py-5 lg:py-6 text-lg sm:text-xl lg:text-2xl",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
